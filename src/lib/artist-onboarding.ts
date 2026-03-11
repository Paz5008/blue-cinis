/**
 * Blue Cinis - Automatisation onboarding artiste
 * Script d'onboarding automatisé pour les nouveaux artistes
 */

import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/emailTemplates';
import { createConnectedAccount } from '@/lib/payments/stripe-connect';
import { env } from '@/env';

interface OnboardArtistParams {
  userId: string;
  sendEmail?: boolean;
}

/**
 * Processus complet d'onboarding artiste
 */
export async function onboardArtist({ userId, sendEmail = true }: OnboardArtistParams) {
  // 1. Récupérer l'utilisateur et son profil artiste
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { artist: true },
  });

  if (!user) {
    throw new Error(`Utilisateur ${userId} introuvable`);
  }

  if (!user.artist) {
    throw new Error(`Profil artiste introuvable pour ${userId}`);
  }

  const results: {
    emailSent: boolean;
    stripeAccountCreated: boolean;
    stripeOnboardingUrl: string | null;
    profileActivated: boolean;
    defaultPageCreated: boolean;
  } = {
    emailSent: false,
    stripeAccountCreated: false,
    stripeOnboardingUrl: null,
    profileActivated: false,
    defaultPageCreated: false,
  };

  // 2. Activer le compte utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });
  results.profileActivated = true;

  // 3. Créer une page profile par défaut si pas existante
  const existingPage = await prisma.artistPage.findUnique({
    where: { userId_key: { userId, key: 'profile' } },
  });

  if (!existingPage) {
    await prisma.artistPage.create({
      data: {
        userId,
        key: 'profile',
        status: 'draft',
        draftContent: getDefaultPageContent(user.name || 'Artiste'),
      },
    });
    results.defaultPageCreated = true;
  }

  // 4. Créer un compte Stripe Connect si pas encore fait
  if (!user.artist.stripeAccountId && env.STRIPE_SECRET_KEY) {
    try {
      const { accountId, onboardingUrl } = await createConnectedAccount(
        user.email,
        user.artist.name
      );

      await prisma.artist.update({
        where: { id: user.artist.id },
        data: { stripeAccountId: accountId },
      });

      results.stripeAccountCreated = true;
      results.stripeOnboardingUrl = onboardingUrl;
    } catch (error) {
      console.error('Erreur création compte Stripe:', error);
    }
  }

  // 5. Envoyer l'email de bienvenue
  if (sendEmail && user.email) {
    try {
      await sendWelcomeEmail({
        to: user.email,
        artistName: user.name || user.artist.name,
        loginUrl: `${env.DOMAIN}/auth/signin`,
        stripeOnboardingUrl: results.stripeOnboardingUrl || undefined,
      });
      results.emailSent = true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  }

  return results;
}

/**
 * Contenu de page par défaut pour un nouvel artiste
 */
function getDefaultPageContent(artistName: string) {
  return {
    blocksData: {
      'hero-1': {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: `Bienvenue dans mon univers`,
          subtitle: `Découvrez mes dernières créations`,
          ctaText: 'Voir la galerie',
          ctaLink: '#gallery',
        },
        style: {
          backgroundColor: '#000000',
          textColor: '#ffffff',
          textAlign: 'center',
          paddingTop: '120px',
          paddingBottom: '120px',
        },
      },
      'gallery-1': {
        id: 'gallery-1',
        type: 'gallery',
        content: {
          artworkIds: [],
        },
        style: {
          columns: 3,
          gap: '24px',
          padding: '80px 5%',
        },
      },
      'bio-1': {
        id: 'bio-1',
        type: 'artistBio',
        content: {},
        style: {
          padding: '80px 10%',
          backgroundColor: '#0a0a0a',
        },
      },
    },
    layout: {
      desktop: ['hero-1', 'gallery-1', 'bio-1'],
      mobile: ['hero-1', 'gallery-1', 'bio-1'],
    },
    theme: {
      primaryColor: '#3b82f6',
      fontFamily: 'Geist',
    },
  };
}

/**
 * Script de migration pour les artistes existants sans Stripe
 */
export async function migrateExistingArtistsToStripe() {
  const artistsWithoutStripe = await prisma.artist.findMany({
    where: {
      stripeAccountId: null,
      enableCommerce: true,
      user: { isActive: true },
    },
    include: { user: true },
  });

  console.log(`Migration de ${artistsWithoutStripe.length} artistes vers Stripe Connect...`);

  for (const artist of artistsWithoutStripe) {
    if (!artist.user?.email || !env.STRIPE_SECRET_KEY) continue;

    try {
      const { accountId, onboardingUrl } = await createConnectedAccount(
        artist.user.email,
        artist.name
      );

      await prisma.artist.update({
        where: { id: artist.id },
        data: { stripeAccountId: accountId },
      });

      console.log(`✓ Stripe créé pour ${artist.name}: ${accountId}`);
      console.log(`  URL onboarding: ${onboardingUrl}`);
    } catch (error) {
      console.error(`✗ Erreur pour ${artist.name}:`, error);
    }
  }

  return { migrated: artistsWithoutStripe.length };
}

/**
 * Vérifie et met à jour le statut des comptes Stripe
 */
export async function syncStripeAccountStatuses() {
  const artistsWithStripe = await prisma.artist.findMany({
    where: {
      stripeAccountId: { not: null },
    },
    include: { user: true },
  });

  const { checkConnectedAccountStatus } = await import('@/lib/payments/stripe-connect');

  for (const artist of artistsWithStripe) {
    if (!artist.stripeAccountId) continue;

    try {
      const status = await checkConnectedAccountStatus(artist.stripeAccountId);
      
      // Stocker le statut dans les métadonnées pour affichage dashboard
      await prisma.artist.update({
        where: { id: artist.id },
        data: {
          notificationPreferences: {
            ...(artist.notificationPreferences as object || {}),
            stripeStatus: status,
          },
        },
      });
    } catch (error) {
      console.error(`Erreur sync Stripe pour ${artist.name}:`, error);
    }
  }

  return { synced: artistsWithStripe.length };
}
