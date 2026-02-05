import { NextRequest, NextResponse } from "next/server";
import { queryFeaturedArtworks } from "@/lib/data/artworks";

export const revalidate = 180;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 8;
    const cursor = searchParams.get('cursor');

    const result = await queryFeaturedArtworks({
      limit: Number.isFinite(limit) ? limit : undefined,
      cursor: cursor || undefined,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des œuvres:", error);
    // Ne pas casser l'UI si la DB est indisponible
    return NextResponse.json({ items: [], nextCursor: null, hasMore: false }, { status: 200 });
  }
}
