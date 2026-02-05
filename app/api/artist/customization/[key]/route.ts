// ... imports
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// revalidatePath/Tag removed as we don't publish here anymore
import bcrypt from 'bcrypt';
import { ContentPayloadSchema } from '@/lib/cmsSchema';
import { sanitizeTextHtml } from '@/lib/sanitize'
import { sanitizeBlockStylesDeep } from '@/lib/cms/style'
import { sanitizeEmbedBlock } from '@/lib/cms/embed'
import { logger } from '@/lib/logger'
import { ensureArtistSession } from '@/lib/artistGuard';
import { mailer } from '@/lib/mailer';
import { env } from '@/env';

const allowDevAutoUser = process.env.ENABLE_DEV_AUTO_USER === '1';

// GET: Fetch artist page content with validation
export async function GET(req: NextRequest, { params }: { params: { key: string } | Promise<{ key: string }> }) {
  const session = await ensureArtistSession({ allowAdmin: true });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { key: rawKey } = await (params as any);
  const key = (rawKey || 'profile').toLowerCase();
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
      const rawData = page.draftContent || page.publishedContent || {};

      // Validate data from DB using Zod for type safety
      const parsed = ContentPayloadSchema.safeParse(rawData);
      if (!parsed.success) {
        // Log validation failure but return safe fallback
        logger.warn({
          err: parsed.error,
          userId: effectiveUserId,
          key,
          msg: 'CMS data validation failed on read, returning raw data'
        });
        // Return raw data anyway - validation on write is the primary gate
        return NextResponse.json(rawData);
      }
      return NextResponse.json(parsed.data);
    }
    return NextResponse.json({});
  } catch (error) {
    logger.error({ err: error, msg: 'artist_customization_get_failed' });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// PUT /api/artist/customization/[key]
export async function PUT(req: NextRequest, { params }: { params: { key: string } | Promise<{ key: string }> }) {
  const session = await ensureArtistSession({ allowAdmin: true });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { key: rawKey } = await (params as any);
  const key = (rawKey || 'profile').toLowerCase();
  let newConfig: any;
  try { newConfig = await req.json(); } catch { return NextResponse.json({ error: 'Données invalides' }, { status: 400 }); }

  try {
    let effectiveUserId: string | null = session.user.id;
    let user = await prisma.user.findUnique({ where: { id: effectiveUserId! }, select: { id: true, email: true, name: true } });
    if (!user && session.user.email) {
      const byEmail = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true, name: true } });
      if (byEmail) { effectiveUserId = byEmail.id; user = byEmail as any; }
    }
    // ... (dev auto user logic omitted for brevity, assuming standard flow)
    if (!user || !effectiveUserId) {
      // Fallback or error
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 400 });
    }

    const parsed = ContentPayloadSchema.safeParse(newConfig);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload invalide', details: parsed.error.flatten() },
        { status: 422 }
      );
    }
    const { blocks, theme, meta, settings, action } = parsed.data;

    // Sanitization
    const safeBlocks = (blocks || []).map((b: any) => {
      if (b?.type === 'text' && typeof b.content === 'string') {
        return sanitizeBlockStylesDeep({ ...b, content: sanitizeTextHtml(b.content, key as any) })
      }
      if (b?.type === 'artistBio' && typeof b.content === 'string') {
        return sanitizeBlockStylesDeep({ ...b, content: sanitizeTextHtml(b.content, key as any) })
      }
      if (b?.type === 'embed') {
        const sanitized = sanitizeEmbedBlock(b);
        return sanitized ? sanitizeBlockStylesDeep(sanitized) : null;
      }
      return sanitizeBlockStylesDeep(b)
    }).filter(Boolean)

    const payload = { blocks: safeBlocks, theme, meta, settings } as any;
    const isPublish = action === 'publish';

    // Validation logic
    if (safeBlocks.length > 160) {
      return NextResponse.json({ error: 'Trop de blocs' }, { status: 413 });
    }
    if (isPublish && safeBlocks.length === 0) {
      return NextResponse.json({ error: 'Impossible de publier une page vide.' }, { status: 400 });
    }
    if (isPublish && (!meta?.title || String(meta.title).trim().length === 0)) {
      return NextResponse.json({ error: 'Titre SEO manquant' }, { status: 400 });
    }

    // Database Update
    // Validation Gate Logic:
    // - Always update draftContent
    // - NEVER update publishedContent directly
    // - If isPublish: status -> 'pending_review'

    const upserted = await prisma.artistPage.upsert({
      where: { userId_key: { userId: effectiveUserId!, key } },
      create: {
        userId: effectiveUserId!,
        key,
        draftContent: payload,
        status: isPublish ? 'pending_review' : 'draft', // New page: draft or pending
        // publishedContent is null
      },
      update: {
        draftContent: payload,
        // Only change status if requesting review
        ...(isPublish ? { status: 'pending_review' } : {}),
      },
      select: { draftContent: true, status: true, id: true },
    });

    // Notification Logic
    if (isPublish) {
      const adminEmail = env.SALES_EMAIL || env.SMTP_USER;
      if (adminEmail) {
        const adminUrl = `${env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/reviews/${upserted.id}`; // Hypothetical URL
        await mailer.send({
          to: adminEmail,
          subject: `[Validation Requise] Nouvelle page artiste : ${user.name || 'Artiste'}`,
          text: `L'artiste ${user.name} (${user.email}) a soumis une modification pour sa page "${key}".\n\nID: ${upserted.id}\n\nVeuillez valider ou rejeter cette demande via le back-office admin.`,
        }).catch(e => logger.error({ err: e }, 'Failed to send admin notification'));
      }
    }

    // Return draft content (preview)
    return NextResponse.json({
      ...upserted.draftContent as object,
      _status: upserted.status // Return status so frontend knows it's pending
    });

  } catch (error) {
    logger.error({ err: error, msg: 'artist_customization_put_failed' });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

