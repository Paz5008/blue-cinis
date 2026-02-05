import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentPayloadSchema } from '@/lib/cmsSchema';
import { sanitizeTextHtml } from '@/lib/sanitize';
import { sanitizeBlockStylesDeep } from '@/lib/cms/style';
import { sanitizeEmbedBlock } from '@/lib/cms/embed';
import { logger } from '@/lib/logger';
import { ensureArtistSession } from '@/lib/artistGuard';
import { mailer } from '@/lib/mailer';
import { env } from '@/env';

// GET /api/artist/customization
// Returns the profile configuration (key='profile')
export async function GET(req: NextRequest) {
    const session = await ensureArtistSession({ allowAdmin: true });
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const key = 'profile';

    try {
        let effectiveUserId: string | null = session.user.id;
        const user = await prisma.user.findUnique({ where: { id: effectiveUserId! }, select: { id: true, email: true } });
        if (!user && session.user.email) {
            const byEmail = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true } });
            if (byEmail) effectiveUserId = byEmail.id;
        }

        const page = await prisma.artistPage.findUnique({
            where: { userId_key: { userId: effectiveUserId!, key } },
            select: { draftContent: true, publishedContent: true, status: true },
        });

        if (page) {
            return NextResponse.json(page.draftContent || page.publishedContent || {});
        }
        return NextResponse.json({});
    } catch (error) {
        logger.error({ err: error, msg: 'artist_customization_get_failed' });
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

// PUT /api/artist/customization
// Updates the profile configuration (key='profile')
export async function PUT(req: NextRequest) {
    const session = await ensureArtistSession({ allowAdmin: true });
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const key = 'profile';
    let newConfig: any;
    try { newConfig = await req.json(); } catch { return NextResponse.json({ error: 'Données invalides' }, { status: 400 }); }

    try {
        let effectiveUserId: string | null = session.user.id;
        let user = await prisma.user.findUnique({ where: { id: effectiveUserId! }, select: { id: true, email: true, name: true } });
        if (!user && session.user.email) {
            const byEmail = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true, name: true } });
            if (byEmail) { effectiveUserId = byEmail.id; user = byEmail as any; }
        }

        if (!user || !effectiveUserId) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 400 });
        }

        const parsed = ContentPayloadSchema.safeParse(newConfig);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Payload invalide', details: parsed.error.flatten() },
                { status: 422 }
            );
        }
        const { blocks, blocksData, layout, theme, meta, settings, action } = parsed.data;

        // Helper function to sanitize a single block
        const sanitizeBlock = (b: any) => {
            if (b?.type === 'text' && typeof b.content === 'string') {
                return sanitizeBlockStylesDeep({ ...b, content: sanitizeTextHtml(b.content, key as any) });
            }
            if (b?.type === 'artistBio' && typeof b.content === 'string') {
                return sanitizeBlockStylesDeep({ ...b, content: sanitizeTextHtml(b.content, key as any) });
            }
            if (b?.type === 'embed') {
                const sanitized = sanitizeEmbedBlock(b);
                return sanitized ? sanitizeBlockStylesDeep(sanitized) : null;
            }
            return sanitizeBlockStylesDeep(b);
        };

        // Handle both NEW format (blocksData + layout) and LEGACY format (blocks array)
        let safeContent: any;
        let totalBlocks = 0;

        if (blocksData && layout) {
            // NEW FORMAT: Structured layout
            const sanitizedData = Object.fromEntries(
                Object.entries(blocksData).map(([id, block]) => [
                    id,
                    sanitizeBlock(block)
                ]).filter(([, b]) => b !== null)
            );
            safeContent = {
                blocksData: sanitizedData,
                layout: {
                    desktop: layout.desktop || [],
                    mobile: layout.mobile || layout.desktop || [],
                },
                theme,
                meta,
                settings,
            };
            totalBlocks = Object.keys(sanitizedData).length;
        } else if (blocks) {
            // LEGACY FORMAT: Single blocks array - migrate to new format
            const safeBlocks = (blocks || []).map(sanitizeBlock).filter(Boolean);
            const blockIds = safeBlocks.map((b: any) => b.id);
            const dataMap = Object.fromEntries(safeBlocks.map((b: any) => [b.id, b]));

            safeContent = {
                blocksData: dataMap,
                layout: {
                    desktop: blockIds,
                    mobile: blockIds,  // Auto-sync for legacy
                },
                theme,
                meta,
                settings,
            };
            totalBlocks = safeBlocks.length;
        } else {
            return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
        }

        const payload = safeContent;
        const isPublish = action === 'publish';

        // Validation logic
        if (totalBlocks > 160) {
            return NextResponse.json({ error: 'Trop de blocs' }, { status: 413 });
        }
        if (isPublish && totalBlocks === 0) {
            return NextResponse.json({ error: 'Impossible de publier une page vide.' }, { status: 400 });
        }
        if (isPublish && (!meta?.title || String(meta.title).trim().length === 0)) {
            return NextResponse.json({ error: 'Titre SEO manquant' }, { status: 400 });
        }

        const upserted = await prisma.artistPage.upsert({
            where: { userId_key: { userId: effectiveUserId!, key } },
            create: {
                userId: effectiveUserId!,
                key,
                draftContent: payload,
                status: isPublish ? 'pending_review' : 'draft',
            },
            update: {
                draftContent: payload,
                ...(isPublish ? { status: 'pending_review' } : {}),
            },
            select: { draftContent: true, status: true, id: true },
        });

        // Notification Logic
        if (isPublish) {
            const adminEmail = env.SALES_EMAIL || env.SMTP_USER;
            if (adminEmail) {
                await mailer.send({
                    to: adminEmail,
                    subject: `[Validation Requise] Nouvelle page artiste : ${user.name || 'Artiste'}`,
                    text: `L'artiste ${user.name} (${user.email}) a soumis une modification pour sa page "${key}".\n\nID: ${upserted.id}\n\nVeuillez valider ou rejeter cette demande via le back-office admin.`,
                }).catch(e => logger.error({ err: e }, 'Failed to send admin notification'));
            }
        }

        return NextResponse.json({
            ...upserted.draftContent as object,
            _status: upserted.status
        });

    } catch (error) {
        logger.error({ err: error, msg: 'artist_customization_put_failed' });
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
