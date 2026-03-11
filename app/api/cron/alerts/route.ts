/**
 * Cron job: Alertes et notifications automatiques
 * Envoie des rappels pour les commandes en attente, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
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

  try {
    const results: Record<string, any> = { alerts: [] };

    // 1. Commandes payées non expédiées depuis 5+ jours
    const oldOrders = await prisma.order.findMany({
      where: {
        status: 'paid',
        fulfillmentStatus: 'pending_shipment',
        createdAt: { lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      },
      include: { artist: true },
    });

    if (oldOrders.length > 0) {
      results.alerts.push({
        type: 'old_orders',
        count: oldOrders.length,
        message: `${oldOrders.length} commande(s) non expédiée(s) depuis 5+ jours`,
      });
    }

    // 2. Nouveaux artistes sans Stripe (vente activée)
    const artistsWithoutStripe = await prisma.artist.count({
      where: {
        enableCommerce: true,
        stripeAccountId: null,
        isActive: true,
      },
    });

    if (artistsWithoutStripe > 0) {
      results.alerts.push({
        type: 'artists_without_stripe',
        count: artistsWithoutStripe,
        message: `${artistsWithoutStripe} artiste(s) sans compte Stripe`,
      });
    }

    // 3. Réservations actives expirées (non nettoyées)
    const stuckReservations = await prisma.reservation.count({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
    });

    if (stuckReservations > 0) {
      results.alerts.push({
        type: 'stuck_reservations',
        count: stuckReservations,
        message: `${stuckReservations} réservation(s) bloquée(s)`,
      });
    }

    // 4. Stats globales
    results.stats = {
      totalOrders: await prisma.order.count(),
      pendingShipments: await prisma.order.count({
        where: { status: 'paid', fulfillmentStatus: 'pending_shipment' },
      }),
      totalArtworks: await prisma.artwork.count({ where: { status: 'available' } }),
      totalArtists: await prisma.artist.count({ where: { isActive: true } }),
    };

    // Envoyer notification si alertes critiques
    if (results.alerts.length > 0 && env.SLACK_WEBHOOK_URL) {
      // Ici tu pourras ajouter l'envoi vers Slack
      logger.warn({ source: 'cron.alerts', alerts: results.alerts }, '[cron] Alerts detected');
    }

    logger.info({ source: 'cron.alerts', ...results }, '[cron] Alerts check executed');
    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    logger.error({ source: 'cron.alerts', error }, '[cron] Alerts check failed');
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
