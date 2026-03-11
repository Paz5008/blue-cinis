/**
 * Blue Cinis - Stripe Connect Integration
 * Permet aux artistes de recevoir leurs paiements directement
 */

import Stripe from 'stripe';
import { env } from '@/env';

const stripe = env.STRIPE_SECRET_KEY 
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

const PLATFORM_FEE_PERCENT = 10; // 10% de commission plateforme

/**
 * Crée un compte Stripe Connect pour un artiste
 */
export async function createConnectedAccount(artistEmail: string, artistName: string): Promise<{
  accountId: string;
  onboardingUrl: string;
}> {
  if (!stripe) throw new Error('Stripe non configuré');

  // Créer un compte Stripe Express pour l'artiste
  const account = await stripe.accounts.create({
    type: 'express',
    email: artistEmail,
    business_profile: {
      name: artistName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      type: 'artist',
    },
  });

  // Créer le lien d'onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${env.DOMAIN}/dashboard-artist/parametres/stripe?refresh=true`,
    return_url: `${env.DOMAIN}/dashboard-artist/parametres/stripe?success=true`,
    type: 'account_onboarding',
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}

/**
 * Vérifie si le compte Connect est actif
 */
export async function checkConnectedAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  if (!stripe) throw new Error('Stripe non configuré');

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/**
 * Effectue un transfert vers l'artiste après une vente
 */
export async function transferToArtist(params: {
  amount: number; // en centimes
  artistStripeAccountId: string;
  artworkTitle: string;
  orderId: string;
}): Promise<{ transferId: string }> {
  if (!stripe) throw new Error('Stripe non configuré');

  const { amount, artistStripeAccountId, artworkTitle, orderId } = params;
  
  // Le montant déjà décomposé (application le prend sa commission)
  const transfer = await stripe.transfers.create({
    amount,
    currency: 'eur',
    destination: artistStripeAccountId,
    metadata: {
      orderId,
      artworkTitle,
      type: 'artist_payout',
    },
  });

  return { transferId: transfer.id };
}

/**
 * Calcule les frais de plateforme
 */
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
}

/**
 * Crée un checkout avec Split Payment (Direct Charges)
 * L'argent va directement sur le compte de l'artiste moins la commission
 */
export async function createSplitPaymentCheckout(params: {
  artworkTitle: string;
  artworkImageUrl: string;
  amount: number; // prix en centimes
  artistStripeAccountId: string;
  quantity: number;
  baseUrl: string;
  artworkId: string;
  orderId: string;
}): Promise<{ url: string; sessionId: string }> {
  if (!stripe) throw new Error('Stripe non configuré');

  const platformFee = calculatePlatformFee(params.amount * params.quantity);
  const artistAmount = (params.amount * params.quantity) - platformFee;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: params.artworkTitle,
            images: params.artworkImageUrl ? [params.artworkImageUrl] : [],
          },
          unit_amount: params.amount,
        },
        quantity: params.quantity,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: params.artistStripeAccountId,
      },
      metadata: {
        orderId: params.orderId,
        artworkId: params.artworkId,
      },
    },
    success_url: `${params.baseUrl}/success?order=${params.orderId}`,
    cancel_url: `${params.baseUrl}/cancel`,
    metadata: {
      orderId: params.orderId,
      artworkId: params.artworkId,
    },
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Récupère le solde d'un artiste
 */
export async function getArtistBalance(accountId: string): Promise<{
  available: number;
  pending: number;
}> {
  if (!stripe) throw new Error('Stripe non configuré');

  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  });

  const eur = balance.available.find(b => b.currency === 'eur');
  const eurPending = balance.pending.find(b => b.currency === 'eur');

  return {
    available: eur?.amount ?? 0,
    pending: eurPending?.amount ?? 0,
  };
}

/**
 * Crée un lien de dashboard pour l'artiste
 */
export async function createArtistDashboardLink(accountId: string): Promise<string> {
  if (!stripe) throw new Error('Stripe non configuré');

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}
