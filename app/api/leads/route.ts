import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { leadsLimiter, getIpFromHeaders } from '@/lib/ratelimit';
import { env } from '@/env';
import { logger } from '@/lib/logger'
import { getRequestId } from '@/lib/req'
import { mailer } from '@/lib/mailer';
import { createInMemorySlidingWindowLimiter } from '@/lib/localRateLimit';
import { verifyServerRecaptcha, isRecaptchaRequired } from '@/lib/serverRecaptcha';
import * as Sentry from '@sentry/nextjs';

const LeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  artworkId: z.string().optional(),
  // Optionnel: fournir directement l'artistId si la demande n'est pas liée à une œuvre
  artistId: z.string().optional(),
  recaptchaToken: z.string().optional(),
  manualHumanCheck: z.boolean().optional(),
});

const isProd = env.NODE_ENV === 'production';
const fallbackLeadsLimiter = createInMemorySlidingWindowLimiter({ max: 5, windowMs: 60_000 });

function escapeHtml(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessage(value?: string | null) {
  if (!value) return '';
  return escapeHtml(value).replace(/\r?\n/g, '<br/>');
}

export async function POST(req: NextRequest) {
  const rid = getRequestId(req.headers as any)
  try {
    logger.info({ rid, path: '/api/leads', msg: 'incoming' })
    const contentType = req.headers.get('content-type') || '';
    let payload: any = {};
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      payload = Object.fromEntries(Array.from(form.entries()) as any);
    } else {
      // tenter JSON par défaut
      try { payload = await req.json(); } catch { }
    }

    const parsed = LeadSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, phone, message, artworkId, artistId, recaptchaToken, manualHumanCheck } = parsed.data;
    const captchaBypassed = !isProd && Boolean(manualHumanCheck);

    if (isRecaptchaRequired() && !recaptchaToken && !captchaBypassed) {
      return NextResponse.json({ error: 'reCAPTCHA requis' }, { status: 400 });
    }

    const captchaOk = captchaBypassed
      ? true
      : await verifyServerRecaptcha({ token: recaptchaToken, manualBypass: captchaBypassed, rid, scope: 'api.leads' });
    if (!captchaOk) {
      return NextResponse.json({ error: 'reCAPTCHA invalide' }, { status: 400 });
    }

    // Rate limiting par IP
    const ip = getIpFromHeaders(req.headers);
    const identifier = `leads:${ip}`;
    const rl = leadsLimiter
      ? await leadsLimiter.limit(identifier)
      : fallbackLeadsLimiter.limit(identifier);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Trop de demandes, réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } },
      );
    }

    // Enrichir avec œuvre/artiste si disponible
    let targetArtistId: string | undefined = artistId;
    let artworkTitle: string | undefined;
    if (artworkId) {
      const art = await prisma.artwork.findUnique({ where: { id: artworkId }, include: { artist: { include: { user: true } } } });
      if (art) {
        targetArtistId = art.artistId;
        artworkTitle = art.title;
      }
    }

    const lead = await prisma.lead.create({
      data: { name, email, phone, message, artworkId: artworkId || null, artistId: targetArtistId || null },
    });
    logger.info({ rid, leadId: lead.id, msg: 'lead_created' })

    const adminEmail = env.SALES_EMAIL || env.SMTP_USER || '';
    if (!adminEmail) {
      const errPayload = { rid, msg: 'lead_notification_missing_email' };
      logger.error(errPayload);
      Sentry.captureMessage('Lead notification email missing', {
        level: 'fatal',
        tags: { surface: 'api.leads' },
        extra: errPayload,
      })
      const status = isProd ? 503 : 202;
      return NextResponse.json({ error: 'Notifications indisponibles' }, { status });
    }
    if (isProd && !mailer.isConfigured()) {
      logger.error({ rid, msg: 'lead_mailer_unconfigured' });
      Sentry.captureMessage('Lead mailer unavailable in production', {
        level: 'fatal',
        tags: { surface: 'api.leads' },
      })
      return NextResponse.json({ error: 'Notifications indisponibles' }, { status: 503 });
    }

    const subject = artworkTitle ? `Nouvelle demande d'achat: ${artworkTitle}` : `Nouvelle demande d'achat`;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : '';
    const safeArtworkTitle = artworkTitle ? escapeHtml(artworkTitle) : '';
    const safeArtworkId = artworkId ? escapeHtml(artworkId) : '';
    const safeArtistId = targetArtistId ? escapeHtml(targetArtistId) : '';
    const safeMessage = message ? formatMessage(message) : '';
    const html = `
      <p>Une nouvelle demande d'achat a été soumise.</p>
      <ul>
        <li><strong>Nom:</strong> ${safeName}</li>
        <li><strong>Email:</strong> ${safeEmail}</li>
        ${safePhone ? `<li><strong>Téléphone:</strong> ${safePhone}</li>` : ''}
        ${safeArtworkTitle ? `<li><strong>Œuvre:</strong> ${safeArtworkTitle}${safeArtworkId ? ` (id: ${safeArtworkId})` : ''}</li>` : ''}
        ${safeArtistId ? `<li><strong>Artiste ID:</strong> ${safeArtistId}</li>` : ''}
      </ul>
      ${safeMessage ? `<p><strong>Message:</strong><br/>${safeMessage}</p>` : ''}
    `;

    const notify = async () => {
      const jobs: Promise<unknown>[] = []
      jobs.push(mailer.send({ to: adminEmail, subject, html }))

      if (targetArtistId) {
        const artist = await prisma.artist.findUnique({ where: { id: targetArtistId }, include: { user: true } });
        const artistEmail = artist?.user?.email;
        if (artistEmail) {
          jobs.push(mailer.send({ to: artistEmail, subject, html }));
        }
      }

      jobs.push(
        mailer.send({
          to: email,
          subject: 'Votre demande a bien été reçue',
          text: `Bonjour ${name},\n\nNous avons bien reçu votre demande concernant ${artworkTitle || 'une œuvre'}. Notre équipe vous recontactera rapidement.\n\nCordialement,\nBlue Cinis`,
        }),
      );

      const results = await Promise.allSettled(jobs)
      results.forEach((result) => {
        if (result.status === 'rejected') {
          logger.error({ rid, err: result.reason }, '[leads] notification dispatch failed')
        }
      })
    }

    notify().catch((err) => {
      logger.error({ rid, err }, '[leads] async notify crashed')
    })

    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (e) {
    logger.error({ rid, err: (e as any)?.message || e, msg: 'leads_error' })
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
