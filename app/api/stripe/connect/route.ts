/**
 * Blue Cinis - API Routes pour Stripe Connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createConnectedAccount, checkConnectedAccountStatus, createArtistDashboardLink, getArtistBalance } from '@/lib/payments/stripe-connect';

/**
 * POST /api/stripe/connect/onboard
 * Crée un compte Stripe Connect pour l'artiste
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist) {
      return NextResponse.json({ error: 'Profil artiste introuvable' }, { status: 404 });
    }

    // Si déjà connecté, retourner le statut
    if (artist.stripeAccountId) {
      const status = await checkConnectedAccountStatus(artist.stripeAccountId);
      return NextResponse.json({ 
        accountId: artist.stripeAccountId, 
        status 
      });
    }

    // Créer un nouveau compte
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Email non trouvé' }, { status: 400 });
    }

    const { accountId, onboardingUrl } = await createConnectedAccount(
      user.email,
      artist.name
    );

    // Sauvegarder le compte ID
    await prisma.artist.update({
      where: { id: artist.id },
      data: { stripeAccountId: accountId },
    });

    return NextResponse.json({ 
      accountId, 
      onboardingUrl,
      message: 'Compte Stripe créé' 
    });
  } catch (error) {
    console.error('Erreur onboarding Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET /api/stripe/connect/status
 * Récupère le statut du compte Stripe Connect
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
    });

    if (!artist?.stripeAccountId) {
      return NextResponse.json({ connected: false });
    }

    const status = await checkConnectedAccountStatus(artist.stripeAccountId);
    let balance = null;
    let dashboardUrl = null;

    // Si le compte est actif, récupérer le solde et le lien dashboard
    if (status.chargesEnabled && status.payoutsEnabled) {
      try {
        balance = await getArtistBalance(artist.stripeAccountId);
        dashboardUrl = await createArtistDashboardLink(artist.stripeAccountId);
      } catch (e) {
        console.error('Erreur récupération solde:', e);
      }
    }

    return NextResponse.json({
      connected: true,
      accountId: artist.stripeAccountId,
      status,
      balance,
      dashboardUrl,
    });
  } catch (error) {
    console.error('Erreur statut Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
