import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { ensureArtistProfile } from '@/lib/artist-profile';
import Stripe from 'stripe';

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    const artist = await ensureArtistProfile(session as Session, {
      select: { id: true, stripeAccountId: true },
    });
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    let accountId = artist.stripeAccountId || null;
    if (!accountId) {
      const acct = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email: user?.email || session.user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        default_currency: 'eur',
      });
      accountId = acct.id;
      await prisma.artist.update({ where: { id: artist.id }, data: { stripeAccountId: accountId } });
    }

    const baseUrl = process.env.DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard-artist?connect=refresh`,
      return_url: `${baseUrl}/dashboard-artist?connect=return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: link.url }, { status: 201 });
  } catch (e) {
    console.error('Erreur POST /api/artist/stripe/account-link', e);
    return NextResponse.json({ error: 'Erreur lors de la création du lien Connect' }, { status: 500 });
  }
}
