import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { ensureArtistProfile } from '@/lib/artist-profile';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'artist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const artist = await ensureArtistProfile(session as Session);
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
  const orders = await prisma.order.findMany({ where: { artistId: artist.id }, orderBy: { createdAt: 'desc' } });
  const headers = ['id', 'createdAt', 'status', 'artworkId', 'buyerEmail', 'amount', 'currency', 'fee', 'net', 'stripeSessionId', 'paymentIntentId'];
  const rows = [headers.join(',')].concat(
    orders.map(o => [
      o.id,
      o.createdAt.toISOString(),
      o.status,
      o.artworkId,
      o.buyerEmail || '',
      String(o.amount),
      (o.currency || 'eur').toUpperCase(),
      String(o.fee),
      String(o.net),
      o.stripeSessionId,
      o.paymentIntentId || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ).join('\n');
  return new NextResponse(rows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mes-commandes.csv"`,
    },
  });
}
