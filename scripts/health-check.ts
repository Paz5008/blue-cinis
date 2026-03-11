/**
 * Blue Cinis - Health Check Automatisé
 * Script de diagnostic complet pour vérifier la santé de l'application
 * Usage: npx tsx scripts/health-check.js [--notify] [--fix]
 */

import { prisma } from '@/lib/prisma';
import { env } from '@/env';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface HealthReport {
  timestamp: string;
  overall: 'ok' | 'warning' | 'error';
  checks: HealthCheck[];
}

/**
 * Vérification complète de la santé de l'application
 */
export async function performHealthCheck(): Promise<HealthReport> {
  const checks: HealthCheck[] = [];
  let overallStatus: 'ok' | 'warning' | 'error' = 'ok';

  // -------------------------------------------------------------------------
  // 1. Base de données
  // -------------------------------------------------------------------------
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'database', status: 'ok', message: 'Connexion DB OK' });
  } catch (e) {
    checks.push({ name: 'database', status: 'error', message: `Erreur DB: ${e}` });
    overallStatus = 'error';
  }

  // -------------------------------------------------------------------------
  // 2. Stripe
  // -------------------------------------------------------------------------
  if (env.STRIPE_SECRET_KEY) {
    checks.push({ name: 'stripe', status: 'ok', message: 'Stripe configuré' });
  } else {
    checks.push({ name: 'stripe', status: 'warning', message: 'Stripe non configuré' });
    if (overallStatus !== 'error') overallStatus = 'warning';
  }

  // -------------------------------------------------------------------------
  // 3. Stripe Connect - Artistes sans compte
  // -------------------------------------------------------------------------
  try {
    const artistsWithCommerce = await prisma.artist.count({
      where: { enableCommerce: true },
    });
    const artistsWithStripe = await prisma.artist.count({
      where: { 
        enableCommerce: true,
        stripeAccountId: { not: null },
      },
    });

    if (artistsWithCommerce > artistsWithStripe) {
      const missing = artistsWithCommerce - artistsWithStripe;
      checks.push({ 
        name: 'stripe-connect', 
        status: 'warning', 
        message: `${missing} artiste(s) sans compte Stripe`,
        details: { total: artistsWithCommerce, connected: artistsWithStripe }
      });
      overallStatus = 'warning';
    } else {
      checks.push({ 
        name: 'stripe-connect', 
        status: 'ok', 
        message: 'Tous les artistes com-commerce ont Stripe',
        details: { total: artistsWithCommerce, connected: artistsWithStripe }
      });
    }
  } catch (e) {
    checks.push({ name: 'stripe-connect', status: 'error', message: `Erreur: ${e}` });
    overallStatus = 'error';
  }

  // -------------------------------------------------------------------------
  // 4. Réservations expirées
  // -------------------------------------------------------------------------
  try {
    const expiredReservations = await prisma.reservation.count({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() },
      },
    });

    if (expiredReservations > 0) {
      checks.push({
        name: 'reservations',
        status: 'warning',
        message: `${expiredReservations} réservation(s) expirée(s) à nettoyer`,
        details: { count: expiredReservations }
      });
      overallStatus = 'warning';
    } else {
      checks.push({ name: 'reservations', status: 'ok', message: 'Aucune rés. expirée' });
    }
  } catch (e) {
    checks.push({ name: 'reservations', status: 'error', message: `Erreur: ${e}` });
    overallStatus = 'error';
  }

  // -------------------------------------------------------------------------
  // 5. Œuvres en double (même titre + même artiste)
  // -------------------------------------------------------------------------
  try {
    const duplicateArtworks = await prisma.artwork.groupBy({
      by: ['artistId', 'title'],
      where: { status: 'available' },
      having: {
        id: { _count: { gt: 1 } },
      },
    });

    if (duplicateArtworks.length > 0) {
      checks.push({
        name: 'artworks-duplicates',
        status: 'warning',
        message: `${duplicateArtworks.length} groupe(s) d'œuvres en double`,
        details: { groups: duplicateArtworks.length }
      });
      overallStatus = 'warning';
    } else {
      checks.push({ name: 'artworks-duplicates', status: 'ok', message: 'Pas de duplicatas' });
    }
  } catch (e) {
    checks.push({ name: 'artworks-duplicates', status: 'error', message: `Erreur: ${e}` });
    overallStatus = 'error';
  }

  // -------------------------------------------------------------------------
  // 6. Commandes en attente depuis longtemps
  // -------------------------------------------------------------------------
  try {
    const oldOrders = await prisma.order.count({
      where: {
        status: 'paid',
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        fulfillmentStatus: 'pending_shipment',
      },
    });

    if (oldOrders > 0) {
      checks.push({
        name: 'old-orders',
        status: 'warning',
        message: `${oldOrders} commande(s) payée(s) non expédiée(s) depuis 7+ jours`,
        details: { count: oldOrders }
      });
      overallStatus = 'warning';
    } else {
      checks.push({ name: 'old-orders', status: 'ok', message: 'Toutes les commandes OK' });
    }
  } catch (e) {
    checks.push({ name: 'old-orders', status: 'error', message: `Erreur: ${e}` });
    overallStatus = 'error';
  }

  // -------------------------------------------------------------------------
  // 7. Utilisateurs inactifs
  // -------------------------------------------------------------------------
  try {
    const inactiveUsers = await prisma.user.count({
      where: { isActive: false },
    });

    if (inactiveUsers > 100) {
      checks.push({
        name: 'inactive-users',
        status: 'warning',
        message: `${inactiveUsers} utilisateur(s) inactif(s)`,
        details: { count: inactiveUsers }
      });
      overallStatus = 'warning';
    } else {
      checks.push({ name: 'inactive-users', status: 'ok', message: 'Utilisateurs OK' });
    }
  } catch (e) {
    checks.push({ name: 'inactive-users', status: 'error', message: `Erreur: ${e}` });
    overallStatus = 'error';
  }

  // -------------------------------------------------------------------------
  // 8. Vérification des variables d'environnement critiques
  // -------------------------------------------------------------------------
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missing: string[] = [];
  
  for (const key of required) {
    if (!env[key as keyof typeof env]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    checks.push({
      name: 'env-vars',
      status: 'error',
      message: `Variables manquantes: ${missing.join(', ')}`,
      details: { missing }
    });
    overallStatus = 'error';
  } else {
    checks.push({ name: 'env-vars', status: 'ok', message: 'Variables OK' });
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  return {
    timestamp: new Date().toISOString(),
    overall: overallStatus,
    checks,
  };
}

/**
 * Nettoie les réservations expirées
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const result = await prisma.reservation.updateMany({
    where: {
      status: 'active',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'expired' },
  });

  return result.count;
}

/**
 * Script CLI
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const notify = args.includes('--notify');
  const fix = args.includes('--fix');

  console.log('🔍 Blue Cinis - Health Check\n');

  performHealthCheck()
    .then(async (report) => {
      // Afficher le rapport
      console.log(`Status: ${report.overall.toUpperCase()}\n`);
      
      for (const check of report.checks) {
        const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
        console.log(`${icon} ${check.name}: ${check.message}`);
        if (check.details) {
          console.log(`   Details: ${JSON.stringify(check.details)}`);
        }
      }

      // Appliquer les fixes si demandé
      if (fix && report.overall !== 'error') {
        console.log('\n🧹 Nettoyage des réservations expirées...');
        const cleaned = await cleanupExpiredReservations();
        console.log(`   ✓ ${cleaned} réservation(s) marquée(s) comme expirée(s)`);
      }

      // Notifications
      if (notify && report.overall !== 'ok') {
        console.log('\n📧 Notification envoyée (à implémenter)');
      }

      process.exit(report.overall === 'error' ? 1 : 0);
    })
    .catch((e) => {
      console.error('❌ Erreur:', e);
      process.exit(1);
    });
}
