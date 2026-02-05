import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { ensureArtistProfile } from '@/lib/artist-profile';
import Stripe from 'stripe';

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = await ensureArtistProfile(session as Session);
    if (!artist || !artist.stripeAccountId) {
      return NextResponse.json({ error: 'Compte Stripe non connecté' }, { status: 400 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeSecret) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    const link = await stripe.accounts.createLoginLink(artist.stripeAccountId);
    return NextResponse.json({ url: link.url }, { status: 200 });
  } catch (e) {
    console.error('Erreur POST /api/artist/stripe/login-link', e);
    return NextResponse.json({ error: 'Erreur création login link' }, { status: 500 });
  }
}
