import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import Stripe from 'stripe';
import { ensureArtistProfile } from '@/lib/artist-profile';

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = await ensureArtistProfile(session as Session, {
      select: { id: true, name: true, stripeAccountId: true },
    });
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }
    if (!artist.stripeAccountId) {
      return NextResponse.json({ error: 'Stripe non connecté' }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY || '';
    if (!secret) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }

    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });
    const baseUrl = process.env.DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const amountCents = 500;

    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'eur',
      payment_method_types: ['card'],
      success_url: `${baseUrl}/dashboard-artist/parametres?test=stripe_success`,
      cancel_url: `${baseUrl}/dashboard-artist/parametres?test=stripe_cancel`,
      customer_email: session.user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Commande test Blue Cinis',
              description: 'Simulation de paiement pour vérifier votre configuration Stripe.',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(amountCents * 0.07),
        transfer_data: { destination: artist.stripeAccountId },
        metadata: {
          testSession: 'true',
          artistId: artist.id,
        },
      },
      metadata: {
        artistId: artist.id,
        testSession: 'true',
      },
    });

    return NextResponse.json({ url: sessionCheckout.url }, { status: 201 });
  } catch (error) {
    console.error('POST /api/artist/stripe/test-session error', error);
    return NextResponse.json({ error: 'Impossible de créer la session de test' }, { status: 500 });
  }
}
