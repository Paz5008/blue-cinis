import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { wrapLanguageModel, extractReasoningMiddleware, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

export const runtime = 'nodejs';

// ─── Cache quota Gemini ─────────────────────────────────────────────────────
// Si le quota est épuisé, on mémorise pendant 45min pour éviter 4s de latence
// à chaque requête. Stocké en module-level (Node.js workers partagent l'état).
const geminiQuotaCache: { exhaustedAt: number | null } = { exhaustedAt: null };
const GEMINI_QUOTA_COOLDOWN = 45 * 60 * 1000; // 45 minutes en ms

function isGeminiQuotaKnownExhausted(): boolean {
    if (!geminiQuotaCache.exhaustedAt) return false;
    const elapsed = Date.now() - geminiQuotaCache.exhaustedAt;
    if (elapsed > GEMINI_QUOTA_COOLDOWN) {
        geminiQuotaCache.exhaustedAt = null; // Reset après le cooldown
        return false;
    }
    return true;
}

function markGeminiQuotaExhausted() {
    geminiQuotaCache.exhaustedAt = Date.now();
    console.warn('[OpenClawd] Quota Gemini marqué épuisé pour 45min');
}
// ────────────────────────────────────────────────────────────────────────────

// Types de blocs autorisés — liste exhaustive figée
const VALID_BLOCK_TYPES = new Set([
    'text', 'image', 'gallery', 'columns', 'book',
    'divider', 'spacer', 'oeuvre', 'artistName', 'artistPhoto', 'artistBio'
]);

/** Valide et nettoie les blocs générés par l'IA */
function sanitizeBlocks(rawBlocks: unknown): unknown[] | null {
    if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return null;
    const cleaned = rawBlocks
        .filter((b: any) => b && typeof b === 'object' && typeof b.id === 'string' && VALID_BLOCK_TYPES.has(b.type))
        .slice(0, 30); // max 30 blocs
    return cleaned.length > 0 ? cleaned : null;
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        // Sécurité : seuls les artistes authentifiés peuvent appeler l'IA
        if (!session?.user?.id || session.user.role !== 'artist') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        let messages: any[] = [];
        let context: any = {};

        try {
            const body = await req.json();
            messages = body.messages || [];
            context = body.context || {};
        } catch {
            // keep empty
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { aiTokens: true, name: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.aiTokens < 500) {
            return new NextResponse(JSON.stringify({ error: 'TOKENS_LIMIT_REACHED' }), {
                status: 402,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const artistData = context?.artistData || {};
        const artworks = context?.oeuvreOptions || [];
        const nameFallback = artistData.name || 'Artiste';
        const bioFallback = artistData.biography || 'Aucune biographie fournie.';

        // ═══════════════════════════════════════════════════════════════
        // PROMPT SÉCURISÉ — Portfolio artiste uniquement
        // Tout jailbreak ou détournement de rôle est explicitement interdit
        // ═══════════════════════════════════════════════════════════════
        // Construire la liste des œuvres avec TOUTES leurs données (imageUrl incluse)
        // Construire la base URL à partir du header Host pour convertir /uploads/ → URL absolue
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        const artworksData = artworks.map((o: any) => {
            let imageUrl = o.imageUrl || null;
            // Convertir les paths relatifs en URLs absolues pour que LLaMA puisse les utiliser
            if (imageUrl && imageUrl.startsWith('/')) {
                imageUrl = `${baseUrl}${imageUrl}`;
            }
            return { id: o.id, title: o.title, imageUrl };
        }).filter((o: any) => o.id);

        // LOG : artworks reçus
        console.log(`[OpenClawd] Artworks: ${artworksData.length} | Avec imageUrl: ${artworksData.filter((o: any) => o.imageUrl).length}`);

        const artworksWithImages = artworksData.filter((o: any) => o.imageUrl);
        const hasImages = artworksWithImages.length > 0;

        // Construire la section OEUVRES enrichie avec toutes les métadonnées artistiques
        const artworksForPrompt = artworksData.length > 0
            ? artworksData.map((o: any) => {
                const parts: string[] = [];
                parts.push(`• ID="${o.id}" | Titre: "${o.title}"`);
                if (o.price) parts.push(`prix: ${o.price}€`);
                if (o.medium) parts.push(`medium: "${o.medium}"`);
                if (o.year) parts.push(`année: ${o.year}`);
                if (o.widthCm && o.heightCm) parts.push(`${o.widthCm}x${o.heightCm}cm`);
                if (o.orientation) parts.push(`orientation: ${o.orientation}`);
                if (o.description && o.description.length > 0) parts.push(`description: "${o.description.slice(0, 150)}"`);
                if (Array.isArray(o.style) && o.style.length > 0) parts.push(`style: [${o.style.join(', ')}]`);
                if (Array.isArray(o.mood) && o.mood.length > 0) parts.push(`mood: [${o.mood.join(', ')}]`);
                if (Array.isArray(o.colors) && o.colors.length > 0) parts.push(`couleurs: [${o.colors.join(', ')}]`);
                if (o.imageUrl) parts.push(`imageUrl: "${o.imageUrl}"`);
                else parts.push(`(pas d'image)`);
                return parts.join(' | ');
            }).join('\n')
            : '(aucune oeuvre disponible)';

        // Exemple few-shot : blocs oeuvre (IDs stables) pour éviter les URLs inventées
        const fewShotArtwork = artworksData.slice(0, 3).map((o: any) =>
            `  {"id":"oeuvre-${o.id.slice(0, 6)}","type":"oeuvre","oeuvreId":"${o.id}"}`
        ).join(',\n') || '  {"id":"text-1","type":"text","content":"Découvrez mon univers.","fontSize":"xl"}';


        const systemPrompt = `Tu es OpenClawd, architecte web expert en portfolios d'artistes pour Blue Cinis.
Role UNIQUE : generer des portfolios visuellement adaptes a la DEMANDE STYLE de l'utilisateur.

=== ARTISTE ===
Nom : ${nameFallback}
Biographie : ${bioFallback || 'Non renseignee'}
Style artistique : ${artistData.artStyle || 'non precise'}
Localisation : ${artistData.location || 'non renseignee'}
Instagram : ${artistData.instagramUrl || 'non renseigne'}
Photo profil : ${artistData.photoUrl ? 'disponible' : 'non disponible'}

=== OEUVRES DISPONIBLES ===
${artworksForPrompt}

=== REGLES ABSOLUES ===
1. Reflechis dans <think>...</think> (2 phrases : style choisi + pourquoi).
2. Apres </think>, produis UNIQUEMENT un JSON array valide. Zero texte, zero markdown autour.
3. 6 a 10 blocs, IDs uniques.
4. ADAPTE le style visuel (champ "style" de chaque bloc) a la DEMANDE de l'utilisateur.
5. IMAGES : ${hasImages
                ? "Utilise les imageUrls de la liste EXACTEMENT. INTERDIT : unsplash, picsum, pexels, toute URL inventee."
                : "Aucune imageUrl disponible. N'utilise PAS de blocs book/image/gallery. Utilise les blocs 'oeuvre' avec les IDs ci-dessus."
            }

=== PROPRIETES DE STYLE (champ \"style\" de chaque bloc) ===
backgroundColor: "#000000"      -> fond du bloc
color: "#ffffff"                -> couleur texte
padding: "80px 40px"            -> espacement interieur
fontFamily: "Georgia, serif"    -> typographie
fontSize: "5rem"                -> taille (pour artistName seulement)
letterSpacing: "0.3em"          -> espacement lettres
fontWeight: "900"               -> graisse
gradientFrom / gradientTo / gradientDirection -> degrade (ex: "135deg")
filter: "grayscale(100%)"       -> filtre image (pour artistPhoto)
borderTop: "2px solid #333"     -> bordure

=== EXEMPLES PAR THEME ===

DARK MODE cinematographique :
artistName style : {"backgroundColor":"#000","color":"#fff","padding":"100px 40px","fontFamily":"Georgia,serif","fontSize":"5rem","letterSpacing":"0.05em"}
artistPhoto style : {"filter":"grayscale(100%) contrast(1.2)","backgroundColor":"#000"}
artistBio style  : {"backgroundColor":"#0a0a0a","color":"#aaa","padding":"60px 40px"}
spacer    style  : {"backgroundColor":"#000"}

MINIMALISTE grands espaces blancs :
artistName style : {"backgroundColor":"#fff","color":"#000","padding":"120px 80px","fontFamily":"Helvetica Neue,sans-serif","fontSize":"6rem","letterSpacing":"-0.03em","fontWeight":"300"}
artistBio  style : {"backgroundColor":"#fafafa","color":"#555","padding":"80px 80px"}

AWWWARDS couleur et impact :
artistName style : {"gradientFrom":"#6366f1","gradientTo":"#ec4899","gradientDirection":"135deg","color":"#fff","padding":"100px 60px","fontFamily":"Inter,sans-serif","fontSize":"5.5rem","fontWeight":"900","letterSpacing":"-0.04em"}
artistBio  style : {"backgroundColor":"#f0f0ff","color":"#333","padding":"60px"}

NOIR ET BLANC photographique :
artistName style : {"backgroundColor":"#fff","color":"#000","padding":"80px","fontFamily":"GT Sectra,serif","fontSize":"4.5rem","letterSpacing":"0.02em"}
artistPhoto style : {"filter":"grayscale(100%)"}
artistBio  style : {"backgroundColor":"#000","color":"#fff","padding":"60px"}

=== TYPES DE BLOCS ===
{"type":"artistName"} -> NOM ARTISTE (TOUJOURS PREMIER BLOC)
{"type":"artistPhoto"} -> photo de profil de l'artiste
{"type":"artistBio"} -> biographie de l'artiste (generee auto)
{"type":"text","content":"...","fontSize":"display"|"xl"|"lg"|"md"}
{"type":"spacer","height":40-80}
{"type":"divider"}
{"type":"oeuvre","oeuvreId":"ID_EXACT"} -> carte oeuvre avec prix
${hasImages ? '{"type":"book","bookStyle":"slider"|"fade","items":[{"id":"uid","url":"URL_EXACTE","title":"...","description":"..."},...]}' : ''}

=== EXEMPLE DE SORTIE PARFAITE ===
<think>Style dark cinematographique : je choisis un fond noir, typo serif, photo en N&B pour une ambiance dramatique.</think>
[
  {"id":"name-1","type":"artistName","style":{"backgroundColor":"#000","color":"#fff","padding":"100px 40px","fontFamily":"Georgia,serif","fontSize":"5rem"}},
  {"id":"photo-1","type":"artistPhoto","style":{"filter":"grayscale(100%)","backgroundColor":"#000"}},
  {"id":"space-1","type":"spacer","height":60,"style":{"backgroundColor":"#000"}},
${fewShotArtwork},
  {"id":"div-1","type":"divider"},
  {"id":"bio-1","type":"artistBio","style":{"backgroundColor":"#0a0a0a","color":"#aaaaaa","padding":"60px 40px"}},
  {"id":"cta-1","type":"text","content":"Disponible pour collaborations.","fontSize":"lg","style":{"backgroundColor":"#000","color":"#555","padding":"40px"}}
]

RAPPEL CRUCIAL : Applique le style demande sur CHAQUE bloc. Le champ "style" controle l'apparence visuelle.`;

        const googleApiKey = process.env.GOOGLE_AI_KEY;


        if (!googleApiKey) {
            console.error('[OpenClawd] GOOGLE_AI_KEY manquant dans les variables d\'environnement.');
            return new NextResponse('Configuration serveur invalide', { status: 500 });
        }

        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { streamText } = await import('ai');

        const google = createGoogleGenerativeAI({ apiKey: googleApiKey });

        // Ordre de fallback Gemini : chaque modèle a un quota indépendant
        const GEMINI_CHAIN = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-2.5-flash',
        ];

        let result: any = null;
        let lastError: any = null;
        let activeProvider = 'groq'; // Optimiste : on suppose qu'on va fallback sur Groq

        // 1. Essai Gemini avec reasoning middleware (skip si quota connu épuisé)
        if (isGeminiQuotaKnownExhausted()) {
            console.log('[OpenClawd] Quota Gemini connu épuisé → skip direct vers Groq');
        } else {
            for (const modelName of GEMINI_CHAIN) {
                try {
                    const modelWithReasoning = wrapLanguageModel({
                        model: google(modelName),
                        middleware: extractReasoningMiddleware({ tagName: 'think' }),
                    });
                    result = await streamText({
                        model: modelWithReasoning,
                        system: systemPrompt,
                        messages: messages.map((m: any) => ({
                            role: m.role as 'user' | 'assistant' | 'system',
                            content: m.content
                        })),
                        temperature: 0.65,  // Focalisé pour JSON structuré
                        maxRetries: 0,    // On gère le fallback manuellement
                        maxOutputTokens: 1500,
                    });
                    console.log(`[OpenClawd] Gemini OK: ${modelName}`);
                    activeProvider = `gemini / ${modelName}`;
                    break;
                } catch (err: any) {
                    lastError = err;
                    const isQuota = err?.statusCode === 429
                        || err?.message?.includes('RESOURCE_EXHAUSTED')
                        || err?.message?.includes('quota');
                    if (isQuota) {
                        console.warn(`[OpenClawd] ${modelName} quota épuisé, fallback...`);
                        markGeminiQuotaExhausted();
                        continue;
                    }
                    // Erreur non-quota (404 modèle inconnu, etc.) : on passe au suivant
                    console.warn(`[OpenClawd] ${modelName} erreur: ${err?.message?.substring(0, 80)}`);
                    continue;
                }
            }
        } // fin du bloc if (!isGeminiQuotaKnownExhausted)

        // 2. Fallback Groq si tous les modèles Gemini ont échoué
        if (!result) {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (groqApiKey) {
                try {
                    const groq = createGroq({ apiKey: groqApiKey });
                    // llama-3.3-70b : meilleure qualité Groq, 14k req/jour gratuit
                    result = await streamText({
                        model: groq('llama-3.3-70b-versatile'),
                        system: systemPrompt,
                        messages: messages.map((m: any) => ({
                            role: m.role as 'user' | 'assistant' | 'system',
                            content: m.content
                        })),
                        temperature: 0.7,
                        maxRetries: 0,
                        maxOutputTokens: 2500, // Plus de quota pour Groq (fallback pré-stream)
                    });
                    console.log('[OpenClawd] Fallback sur Groq/llama-3.3-70b-versatile');
                } catch (groqErr: any) {
                    console.error('[OpenClawd] Groq échoue aussi:', groqErr?.message?.substring(0, 120));
                    lastError = groqErr;
                }
            } else {
                console.warn('[OpenClawd] GROQ_API_KEY non définie, pas de fallback Groq');
            }
        }

        // Fonction helper pour itérer un stream et envoyer les chunks
        async function streamToController(
            streamResult: any,
            controller: ReadableStreamDefaultController,
            enc: TextEncoder
        ): Promise<'ok' | 'quota_error' | 'empty'> {
            let textCount = 0;
            let fullText = ''; // LOG TEMP: accumule pour diagnostic
            try {
                for await (const part of streamResult.fullStream) {
                    if (part.type === 'reasoning-delta') {
                        controller.enqueue(enc.encode('r:' + JSON.stringify(part.text) + '\n'));
                    } else if (part.type === 'text-delta') {
                        textCount++;
                        fullText += part.text;
                        controller.enqueue(enc.encode('0:' + JSON.stringify(part.text) + '\n'));
                    }
                }
                if (textCount === 0) {
                    console.warn('[OpenClawd] Stream vide (0 text-delta) → fallback Groq');
                    markGeminiQuotaExhausted();
                    return 'empty';
                }
                // LOG TEMP : affiche les 600 premiers chars du JSON (après </think>)
                const afterThink = fullText.indexOf('</think>');
                const jsonPreview = afterThink !== -1 ? fullText.substring(afterThink + 8, afterThink + 608) : fullText.substring(0, 600);
                console.log(`[OpenClawd] Stream OK: ${textCount} delta | JSON: \n${jsonPreview}`);
                return 'ok';
            } catch (err: any) {
                const isQuota = err?.statusCode === 429 || err?.message?.includes('RESOURCE_EXHAUSTED');
                if (isQuota) {
                    console.warn('[OpenClawd] 429 pendant le stream, tentative fallback Groq...');
                    markGeminiQuotaExhausted();
                    return 'quota_error';
                }
                throw err;
            }
        }


        const encoder = new TextEncoder();
        const groqApiKey = process.env.GROQ_API_KEY;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // 1. Essai avec Gemini
                    const geminiStatus = await streamToController(result, controller, encoder);

                    // 2. Si quota Gemini épuisé (erreur ou stream vide) → fallback Groq
                    if ((geminiStatus === 'quota_error' || geminiStatus === 'empty') && groqApiKey) {
                        try {
                            const groq = createGroq({ apiKey: groqApiKey });
                            const groqResult = await streamText({
                                model: groq('llama-3.3-70b-versatile'),
                                system: systemPrompt,
                                messages: messages.map((m: any) => ({
                                    role: m.role as 'user' | 'assistant' | 'system',
                                    content: m.content
                                })),
                                temperature: 0.7,
                                maxRetries: 0,
                                maxOutputTokens: 2500,
                            });
                            console.log('[OpenClawd] Fallback Groq/llama-3.3-70b-versatile activé');
                            activeProvider = 'groq/llama-3.3-70b-versatile';
                            await streamToController(groqResult, controller, encoder);
                        } catch (groqErr: any) {
                            console.error('[OpenClawd] Groq échoue aussi:', groqErr?.message?.substring(0, 100));
                            const msg = 'Limite de génération atteinte. Réessayez dans quelques instants.';
                            controller.enqueue(encoder.encode('e:' + JSON.stringify(msg) + '\n'));
                        }
                    } else if (geminiStatus === 'quota_error') {
                        // Pas de clé Groq disponible
                        const msg = 'Limite de génération atteinte. Réessayez dans quelques instants.';
                        controller.enqueue(encoder.encode('e:' + JSON.stringify(msg) + '\n'));
                    }
                } catch (err: any) {
                    console.error('[OpenClawd] Erreur stream inattendue:', err?.message?.substring(0, 100));
                    controller.enqueue(encoder.encode('e:' + JSON.stringify('Erreur de génération. Réessayez.') + '\n'));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Vercel-AI-DataStream': 'v1',
                'Cache-Control': 'no-cache',
                'X-OpenClawd-Provider': activeProvider, // Permet au client d'afficher le bon provider
            }
        });


    } catch (error: any) {
        console.error('[OpenClawd] Génération IA échouée:', error);
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
