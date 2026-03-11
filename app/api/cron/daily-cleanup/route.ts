/**
 * Cron job: Nettoyage quotidien de la base de données
 * Supprime les réservations expirées, maintient la DB propre
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/jobs/cleanupReservations';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = env.CRON_CLEANUP_SECRET;
  const providedSecret = req.headers.get('x-cron-secret');
  const isVercelCron = Boolean(req.headers.get('x-vercel-cron'));

  if (secret) {
    if (providedSecret !== secret && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (!isVercelCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: Record<string, any> = {};

  try {
    // 1. Nettoyer les réservations expirées
    results.reservations = await cleanupExpiredReservations();

    // 2. Désactiver les utilisateurs avec tokens expirés
    const expiredTokens = await prisma.user.updateMany({
      where: {
        resetTokenExpiresAt: { lt: new Date() },
        resetToken: { not: null },
      },
      data: { resetToken: null, resetTokenExpiresAt: null },
    });
    results.expiredTokens = expiredTokens.count;

    // 3. Nettoyer les anciens WebhookEvent (garder 30 jours)
    const deletedWebhooks = await prisma.webhookEvent.deleteMany({
      where: {
        receivedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    results.oldWebhooks = deletedWebhooks.count;

    // 4. Stats
    const stats = {
      users: await prisma.user.count(),
      artists: await prisma.artist.count(),
      artworks: await prisma.artwork.count(),
      orders: await prisma.order.count(),
      activeReservations: await prisma.reservation.count({
        where: { status: 'active', expiresAt: { gt: new Date() } },
      }),
    };
    results.stats = stats;

    logger.info({ source: 'cron.daily-cleanup', ...results }, '[cron] Daily cleanup executed');
    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    logger.error({ source: 'cron.daily-cleanup', error }, '[cron] Daily cleanup failed');
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
