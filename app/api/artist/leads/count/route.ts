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
  if (!artist) return NextResponse.json({ count: 0 });
  try {
    const count = await prisma.lead.count({ where: { artistId: artist.id } });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
