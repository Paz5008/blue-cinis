import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ensureArtistProfile } from '@/lib/artist-profile';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'artist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const artist = await ensureArtistProfile(session as Session);
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  let leads: Prisma.LeadGetPayload<{}>[] = [];
  try {
    leads = await prisma.lead.findMany({ where: { artistId: artist.id }, orderBy: { createdAt: 'desc' } });
  } catch {
    const headers = ['id', 'createdAt', 'name', 'email', 'phone', 'artworkId', 'artworkTitle'];
    const csv = headers.join(',') + '\n';
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mes-demandes-achat.csv"',
      },
    });
  }

  const ids = Array.from(new Set(leads.map(l => l.artworkId).filter(Boolean) as string[]));
  const artworks = await prisma.artwork.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
  const titleById = new Map(artworks.map(a => [a.id, a.title] as const));

  const headers = ['id', 'createdAt', 'name', 'email', 'phone', 'artworkId', 'artworkTitle'];
  const rows = [headers.join(',')].concat(
    leads.map(l => [
      l.id,
      l.createdAt.toISOString(),
      l.name,
      l.email,
      l.phone || '',
      l.artworkId || '',
      (l.artworkId ? (titleById.get(l.artworkId) || '') : ''),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ).join('\n');

  return new NextResponse(rows + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mes-demandes-achat.csv"',
    },
  });
}
