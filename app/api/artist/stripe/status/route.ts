import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { ensureArtistProfile } from '@/lib/artist-profile';
import Stripe from 'stripe';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const artist = await ensureArtistProfile(session as Session, {
      select: { id: true, stripeAccountId: true },
    });
    if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    const connected = !!artist.stripeAccountId;
    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    if (!connected) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }
    if (!stripeSecret) {
      // Stripe non configuré côté serveur, mais l'artiste a un accountId enregistré
      return NextResponse.json({ connected: true, stripeApiAvailable: false }, { status: 200 });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    const acct = await stripe.accounts.retrieve(artist.stripeAccountId!);
    const payload = {
      connected: true,
      stripeApiAvailable: true,
      id: acct.id,
      country: acct.country,
      business_type: acct.business_type,
      email: (acct.email as string) || null,
      details_submitted: acct.details_submitted,
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      capabilities: acct.capabilities || {},
      requirements: {
        disabled_reason: acct.requirements?.disabled_reason || null,
        current_deadline: acct.requirements?.current_deadline || null,
        currently_due_count: acct.requirements?.currently_due?.length || 0,
        eventually_due_count: acct.requirements?.eventually_due?.length || 0,
      },
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    console.error('GET /api/artist/stripe/status error', e);
    return NextResponse.json({ error: 'Erreur statut Stripe' }, { status: 500 });
  }
}
