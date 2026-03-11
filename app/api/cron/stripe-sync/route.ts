/**
 * Cron job: Synchronisation Stripe Connect
 * Vérifie le statut des comptes Stripe des artistes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';
import { logger } from '@/lib/logger';
import { checkConnectedAccountStatus } from '@/lib/payments/stripe-connect';

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

  try {
    // Récupérer tous les artistes avec un compte Stripe
    const artists = await prisma.artist.findMany({
      where: { stripeAccountId: { not: null } },
      select: { id: true, name: true, stripeAccountId: true },
    });

    const results = {
      total: artists.length,
      synced: 0,
      errors: [] as string[],
    };

    for (const artist of artists) {
      if (!artist.stripeAccountId) continue;

      try {
        const status = await checkConnectedAccountStatus(artist.stripeAccountId);

        // Mettre à jour les préférences avec le statut
        await prisma.artist.update({
          where: { id: artist.id },
          data: {
            notificationPreferences: {
              stripeStatus: status,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        });

        results.synced++;
      } catch (error) {
        results.errors.push(`${artist.name}: ${error}`);
      }
    }

    logger.info({ source: 'cron.stripe-sync', ...results }, '[cron] Stripe sync executed');
    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    logger.error({ source: 'cron.stripe-sync', error }, '[cron] Stripe sync failed');
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
