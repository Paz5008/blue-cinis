import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ensureArtistFeaturedColumnReady } from '@/lib/schemaGuards';

export const revalidate = 120;

type ArtistListItem = {
  id: string;
  name: string | null;
  isFeatured?: boolean | null;
  photoUrl: string | null;
  artStyle: string | null;
};

const MAX_PAGE_SIZE = 200;

function buildCacheHeaders() {
  return {
    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
  } as const;
}

// Liste simple d'artistes actifs (utilitaire admin ou CMS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') ?? '', 10);
    const cursor = searchParams.get('cursor') || undefined;
    const format = searchParams.get('format');

    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 50, 1), MAX_PAGE_SIZE);
    const take = limit + 1;

    const orderBy: Prisma.ArtistOrderByWithRelationInput[] = [
      { isFeatured: 'desc' },
      { name: 'asc' },
    ];

    await ensureArtistFeaturedColumnReady();

    const baseQuery: Prisma.ArtistFindManyArgs = {
      where: { isActive: true },
      orderBy,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take,
    };

    const selectWithFeature = {
      id: true,
      name: true,
      isFeatured: true,
      photoUrl: true,
      artStyle: true,
    } satisfies Prisma.ArtistSelect;

    const records: ArtistListItem[] = await prisma.artist.findMany({
      ...baseQuery,
      select: selectWithFeature,
    });

    const items = records.slice(0, limit);
    const hasMore = records.length > limit;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    const payload = format === 'flat' ? items : { items, nextCursor, hasMore };

    return NextResponse.json(payload, {
      headers: buildCacheHeaders(),
    });
  } catch (error) {
    console.error('Erreur GET /api/artist/list', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
