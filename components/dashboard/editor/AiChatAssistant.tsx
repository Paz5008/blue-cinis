'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { Loader2, Send, Sparkles, Wand2, Image as ImageIcon, X, Brain, ChevronDown } from 'lucide-react';

export interface AiChatAssistantProps {
    blocks: any[];
    theme: any;
    artistData: any;
    oeuvreOptions: any[];
    onPreviewLayout: (blocks: any[], theme: any) => void;
    onCommitLayout?: () => void;
    isCommitting?: boolean;
    onPreviewUpdating?: (isUpdating: boolean) => void;
}

const SUGGESTIONS = [
    '🎨 Crée un portfolio Awwwards-style, audacieux avec de grands espaces blancs',
    '✨ Galerie immersive et texturée pour mettre en valeur les micro-détails de mes toiles',
    '🌑 Dark Mode profond avec grain cinématographique et contrastes forts',
    '🖼️ Portfolio élégant en noir & blanc avec typographie monumentale',
];

// Types de blocs valides (miroir de la liste serveur)
const VALID_BLOCK_TYPES = new Set([
    'text', 'image', 'gallery', 'columns', 'book',
    'divider', 'spacer', 'oeuvre', 'artistName', 'artistPhoto', 'artistBio',
]);

function sanitizeBlocks(blocks: any[]): any[] {
    return blocks.filter(
        (b) => b && typeof b === 'object' && typeof b.id === 'string' && VALID_BLOCK_TYPES.has(b.type)
    ).slice(0, 30);
}

// Étapes de raisonnement affichées séquentiellement
const REASONING_STEPS = [
    { label: 'Analyse du profil artiste…', icon: '👤' },
    { label: 'Conception de la structure…', icon: '📐' },
    { label: 'Choix de la palette & typographie…', icon: '🎨' },
    { label: 'Génération du portfolio…', icon: '✨' },
];

interface Message {
    id: string;
    role: string;
    content: string | any[];
    reasoning?: string; // texte de raisonnement associé
}

export function AiChatAssistant({
    blocks, theme, artistData, oeuvreOptions,
    onPreviewLayout, onCommitLayout, isCommitting, onPreviewUpdating
}: AiChatAssistantProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Ref pour éviter les closures stale dans parseAndApply (useCallback)
    const lastParsedContentRef = useRef<string>('');
    // Throttle: on ne tente de parser le JSON que toutes les 300ms max pour limiter les re-renders
    const lastParseAttemptRef = useRef<number>(0);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Bonjour ${artistData.name || 'Artiste'} ! Je suis OpenClawd, votre IA architecte.\n\nDécrivez votre portfolio idéal, ou demandez-moi : "Crée mon portfolio avec mes dernières œuvres".`,
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Raisonnement en temps réel
    const [streamingReasoning, setStreamingReasoning] = useState<string>('');
    const [reasoningStep, setReasoningStep] = useState(0);
    const [showReasoning, setShowReasoning] = useState(false);
    const reasoningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localInput, setLocalInput] = useState('');
    // Provider actif — mis à jour après chaque réponse depuis le header X-OpenClawd-Provider
    const [activeProvider, setActiveProvider] = useState<string>('OpenClawd');

    // --- Image helpers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onloadend = () => { setImageBase64(reader.result as string); };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageBase64(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Start reasoning step animation ---
    const startReasoningAnimation = useCallback(() => {
        setReasoningStep(0);
        setShowReasoning(true);
        setStreamingReasoning('');
        let step = 0;
        reasoningTimerRef.current = setInterval(() => {
            step = Math.min(step + 1, REASONING_STEPS.length - 1);
            setReasoningStep(step);
        }, 1200);
    }, []);

    const stopReasoningAnimation = useCallback(() => {
        if (reasoningTimerRef.current) {
            clearInterval(reasoningTimerRef.current);
            reasoningTimerRef.current = null;
        }
    }, []);

    // --- Main chat handler ---
    const actualAppend = async (message: { role: string; content: string | any[] }) => {
        const tempId = Date.now().toString();
        const newMessages = [...messages, { ...message, id: tempId }];
        setMessages(newMessages);
        setIsLoading(true);
        onPreviewUpdating?.(true);
        startReasoningAnimation();

        try {
            const response = await fetch('/api/artist/ai/openclawd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    context: {
                        artistData: {
                            name: artistData.name,
                            biography: artistData.biography,
                            photoUrl: artistData.photoUrl,
                            artStyle: artistData.artStyle,
                            location: artistData.location,
                            instagramUrl: artistData.instagramUrl,
                            bannerCaption: artistData.bannerCaption,
                        },
                        oeuvreOptions: oeuvreOptions.map((o) => ({
                            id: o.id,
                            title: o.title,
                            imageUrl: o.imageUrl,
                            price: o.price ?? null,
                            description: o.description ?? null,
                            medium: o.medium ?? null,
                            style: o.style ?? [],
                            mood: o.mood ?? [],
                            colors: o.colors ?? [],
                            year: o.year ?? null,
                            orientation: o.orientation ?? null,
                            widthCm: o.widthCm ?? null,
                            heightCm: o.heightCm ?? null,
                            isOriginal: o.isOriginal ?? true,
                            isSigned: o.isSigned ?? true,
                        })),
                    },
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Erreur réseau: ${response.status} ${errText}`);
            }
            if (!response.body) throw new Error("Réponse vide d'OpenClawd");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedChunks = '';
            let accumulatedReasoning = '';
            let cleanContent = '';

            // Tracker le provider actif pour l'affichage dans le footer
            const provider = response.headers.get('X-OpenClawd-Provider');
            if (provider) setActiveProvider(provider);

            const assistantMsgId = (Date.now() + 1).toString();
            setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });

                // Séparer lignes reasoning (r:) et content (0:)
                const allText = accumulatedChunks + chunkText;
                const lines = allText.split('\n');
                accumulatedChunks = lines[lines.length - 1]; // buffer incomplet en attente du prochain \n

                for (const line of lines.slice(0, -1)) {
                    // Reasoning stream (r: "texte")
                    if (line.startsWith('r:')) {
                        try {
                            const reasoningChunk = JSON.parse(line.substring(2));
                            accumulatedReasoning += reasoningChunk;
                            setStreamingReasoning(accumulatedReasoning);
                        } catch { /* ignore */ }
                    }
                    // Content stream (0: "texte")
                    else if (line.startsWith('0:')) {
                        try {
                            const contentChunk = JSON.parse(line.substring(2));
                            cleanContent += contentChunk;
                        } catch { /* ignore */ }
                    }
                    // Error stream (e: "message")
                    else if (line.startsWith('e:')) {
                        try {
                            const errorMsg = JSON.parse(line.substring(2));
                            throw new Error(errorMsg);
                        } catch (e: any) {
                            throw e;
                        }
                    }
                }

                // Mettre à jour le message assistant et parser le JSON en live (throttlé à 300ms)
                const currentContent = cleanContent;
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsgId ? { ...m, content: currentContent, reasoning: accumulatedReasoning } : m))
                );
                const now = Date.now();
                if (now - lastParseAttemptRef.current >= 300) {
                    lastParseAttemptRef.current = now;
                    parseAndApply(currentContent);
                }
            }

            // Vider le buffer résiduel (dernière ligne sans \n finale)
            if (accumulatedChunks.trim()) {
                if (accumulatedChunks.startsWith('0:')) {
                    try {
                        const lastChunk = JSON.parse(accumulatedChunks.substring(2));
                        cleanContent += lastChunk;
                    } catch { /* ignore */ }
                } else if (accumulatedChunks.startsWith('r:')) {
                    try {
                        const lastReasoning = JSON.parse(accumulatedChunks.substring(2));
                        accumulatedReasoning += lastReasoning;
                    } catch { /* ignore */ }
                }
            }

            // Parse final avec tout le contenu accumulé
            const finalContent = cleanContent;
            setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: finalContent, reasoning: accumulatedReasoning } : m))
            );
            parseAndApply(finalContent);



        } catch (err: any) {
            console.error('[AiChatAssistant] Error:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Désolé, une erreur est survenue. Veuillez réessayer.\n\n[${err.message}]`,
                },
            ]);
        } finally {
            setIsLoading(false);
            setShowReasoning(false);
            stopReasoningAnimation();
            onPreviewUpdating?.(false);
        }
    };

    // --- Parse & Apply layout en live ---
    const parseAndApply = useCallback((content: string) => {
        if (!content || typeof content !== 'string') return;
        if (content === lastParsedContentRef.current) return;

        try {
            // 1. Ignorer le raisonnement <think>...</think> de LLaMA/Groq
            // On cherche le JSON seulement APRES la fermeture de </think>
            let textToSearch = content;
            const thinkCloseIdx = content.indexOf('</think>');
            if (thinkCloseIdx !== -1) {
                // Balise fermée → on prend ce qui suit
                textToSearch = content.substring(thinkCloseIdx + '</think>'.length).trim();
            } else if (content.includes('<think>')) {
                // Balise encore ouverte → on attend la fin du raisonnement
                return;
            }

            if (!textToSearch) return;

            // 2. Extraire le JSON depuis textToSearch (après </think>)
            let jsonString: string;

            // Cas 1 : ```json [...] ``` ou ``` [...] ```
            const codeBlockMatch = textToSearch.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                jsonString = codeBlockMatch[1].trim();
            } else {
                // Cas 2 : chercher le premier '[' dans le texte
                const startIdx = textToSearch.indexOf('[');
                if (startIdx === -1) return;
                jsonString = textToSearch.substring(startIdx);
            }

            // 3. Compléter le JSON incomplet pendant le streaming
            if (!jsonString.trimEnd().endsWith(']')) {
                if (jsonString.lastIndexOf('{') > jsonString.lastIndexOf('}')) {
                    jsonString += '}';
                }
                jsonString += ']';
            }

            try {
                const parsedBlocks = JSON.parse(jsonString);
                if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
                    const safeBlocks = sanitizeBlocks(parsedBlocks);
                    if (safeBlocks.length === 0) return;

                    // Auto-fix white text on white bg
                    const isWhiteBg = (theme?.backgroundColor || '').toLowerCase() === '#ffffff'
                        || (theme?.backgroundColor || '').toLowerCase() === '#fff';
                    const finalBlocks = safeBlocks.map((b) => {
                        if (isWhiteBg && b.color && ['#ffffff', '#fff'].includes(b.color.toLowerCase())) {
                            const { color, ...rest } = b;
                            return rest;
                        }
                        return b;
                    });

                    onPreviewLayout(finalBlocks, theme);
                    lastParsedContentRef.current = content;
                }
            } catch {
                // JSON incomplet pendant le stream, ignore silencieusement
            }
        } catch (err) {
            console.error('[parseAndApply] Erreur extraction JSON:', err);
        }
    }, [theme, onPreviewLayout]);

    const handleSuggestionClick = (suggestion: string) => { setLocalInput(suggestion); };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const safeInput = localInput.trim();
        if (!safeInput || isLoading) return;
        const finalContent = imageBase64
            ? [{ type: 'text', text: safeInput }, { type: 'image_url', image_url: { url: imageBase64 } }]
            : safeInput;
        setLocalInput('');
        clearImage();
        actualAppend({ role: 'user', content: finalContent });
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingReasoning]);

    // Cleanup timer on unmount
    useEffect(() => () => { stopReasoningAnimation(); }, [stopReasoningAnimation]);

    return (
        <LazyMotion features={domAnimation}>
            <div className="flex flex-col h-full bg-white relative">

                {/* Header */}
                <div className="flex-none p-5 border-b border-indigo-50 bg-gradient-to-r from-indigo-50/50 to-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                        <Wand2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-indigo-950 font-serif">OpenClawd</h2>
                        <p className="text-xs text-indigo-900/60">Architecte Studio IA</p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
                    {messages.map((msg: Message) => {
                        const isMultimodal = Array.isArray(msg.content);
                        const contentArr = isMultimodal ? (msg.content as any[]) : [];
                        const textContent = isMultimodal
                            ? (contentArr.find((c: any) => c.type === 'text')?.text || '')
                            : (msg.content as string);
                        const displayContent = typeof textContent === 'string'
                            ? textContent
                                // Supprimer les balises <think>...</think> du texte visible
                                .replace(/<think>[\s\S]*?<\/think>/g, '')
                                // Remplacer le JSON array par une confirmation lisible
                                .replace(/\[[\s\S]*\]/, '[Structure générée → aperçu à droite ✓]')
                                .trim()
                            || (msg.role === 'assistant' ? '[Structure générée → aperçu à droite ✓]' : '')
                            : textContent;
                        // Extraire le raisonnement <think> pour l'afficher dans ReasoningSnippet
                        const thinkMatch = typeof textContent === 'string' ? textContent.match(/<think>([\s\S]*?)<\/think>/) : null;
                        const inlineReasoning = thinkMatch ? thinkMatch[1].trim() : null;
                        const imageUrl = isMultimodal ? contentArr.find((c: any) => c.type === 'image_url')?.image_url?.url : null;

                        return (
                            <m.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white border border-gray-100/80 text-slate-700 rounded-bl-sm ring-1 ring-black/5'
                                        }`}
                                >
                                    {/* Reasoning snippet dans la bulle assistant (Gemini ou LLaMA/Groq) */}
                                    {msg.role === 'assistant' && (msg.reasoning || inlineReasoning) && (
                                        <ReasoningSnippet reasoning={msg.reasoning || inlineReasoning!} />
                                    )}
                                    {imageUrl && (
                                        <div className="mb-3">
                                            <img src={imageUrl} alt="Pièce jointe" className="rounded-lg max-h-48 object-contain bg-white/10" />
                                        </div>
                                    )}
                                    {displayContent}
                                </div>
                            </m.div>
                        );
                    })}

                    {/* Panneau de raisonnement en temps réel */}
                    <AnimatePresence>
                        {isLoading && showReasoning && (
                            <m.div
                                key="reasoning-panel"
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-gradient-to-br from-indigo-50 to-violet-50/60 border border-indigo-100 p-4 space-y-3">
                                    {/* Header thinking */}
                                    <div className="flex items-center gap-2">
                                        <m.div
                                            animate={{ rotate: [0, 15, -15, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <Brain className="w-4 h-4 text-indigo-500" />
                                        </m.div>
                                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">OpenClawd réfléchit…</span>
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-1.5">
                                        {REASONING_STEPS.map((step, idx) => (
                                            <m.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: idx <= reasoningStep ? 1 : 0.25, x: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-sm">{step.icon}</span>
                                                <span className={`text-xs ${idx <= reasoningStep ? 'text-indigo-800 font-medium' : 'text-indigo-400'}`}>
                                                    {step.label}
                                                </span>
                                                {idx === reasoningStep && (
                                                    <m.span
                                                        animate={{ opacity: [1, 0.3, 1] }}
                                                        transition={{ duration: 0.8, repeat: Infinity }}
                                                        className="w-1 h-3 bg-indigo-400 rounded-sm inline-block"
                                                    />
                                                )}
                                                {idx < reasoningStep && (
                                                    <span className="text-[10px] text-emerald-500 font-bold ml-1">✓</span>
                                                )}
                                            </m.div>
                                        ))}
                                    </div>

                                    {/* Raisonnement textuel streamé */}
                                    {streamingReasoning && (
                                        <div className="pt-2 border-t border-indigo-100/80">
                                            <p className="text-[11px] text-indigo-600/80 italic leading-relaxed line-clamp-4">
                                                {streamingReasoning}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Action Bar (Commit) */}
                {blocks.length > 0 && onCommitLayout && (
                    <div className="flex-none px-4 pt-3 pb-1 bg-white border-t border-slate-100">
                        <button
                            onClick={onCommitLayout}
                            disabled={isCommitting || isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 active:scale-[0.98]"
                            aria-label="Appliquer et publier ce design"
                        >
                            {isCommitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 text-indigo-200" />
                                    Appliquer ce design
                                    <span className="ml-1 text-xs bg-black/20 px-2 py-0.5 rounded-full font-semibold border border-white/10 text-indigo-50">
                                        500 tokens
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex-none p-4 bg-white border-t border-slate-100">
                    {imagePreview && (
                        <div className="relative inline-block mb-3 ml-2">
                            <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                            <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-0.5 shadow-md hover:bg-slate-700 transition" aria-label="Supprimer l'image">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Suggestions initiales */}
                    {messages.length <= 1 && !isLoading && (
                        <div className="flex flex-col gap-1.5 mb-3">
                            {SUGGESTIONS.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="text-[11px] px-3 py-2 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700/90 rounded-lg transition-colors border border-indigo-100 text-left leading-snug"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative flex items-end w-full">
                        <div className="relative w-full">
                            <textarea
                                value={localInput}
                                onChange={(e) => setLocalInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="Ex: Fais-moi un portfolio élégant avec un thème minimaliste…"
                                className="w-full resize-none rounded-xl border-slate-200 bg-slate-50/50 pr-12 pl-12 py-3.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-400"
                                rows={2}
                                aria-label="Message à envoyer à l'IA"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 bottom-0 top-0 my-auto h-fit p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Joindre une image de référence"
                                aria-label="Joindre une image"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={!localInput.trim() || isLoading}
                            className="absolute right-3 bottom-3 p-2 text-white bg-indigo-600 rounded-lg disabled:opacity-50 disabled:bg-slate-300 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-600/20"
                            aria-label="Générer avec l'IA"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>

                    <div className="mt-3 text-center flex items-center justify-center gap-1.5 opacity-70">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Propulsé par OpenClawd
                            {activeProvider !== 'OpenClawd' && (
                                <span className="ml-1 opacity-60">· {activeProvider.startsWith('gemini') ? 'Gemini Flash' : 'Groq LLaMA 3.3'}</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </LazyMotion>
    );
}

// Composant collapsible pour afficher le raisonnement dans les messages passés
function ReasoningSnippet({ reasoning }: { reasoning: string }) {
    const [open, setOpen] = useState(false);
    if (!reasoning || reasoning.trim().length < 10) return null;
    return (
        <div className="mb-3 rounded-xl bg-indigo-50/60 border border-indigo-100 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-indigo-50 transition-colors"
                aria-expanded={open}
                aria-label="Afficher le raisonnement de l'IA"
            >
                <Brain className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-indigo-600 flex-1">Raisonnement de l'IA</span>
                <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="px-3 pb-3 text-[11px] text-indigo-700/80 italic leading-relaxed">{reasoning}</p>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
