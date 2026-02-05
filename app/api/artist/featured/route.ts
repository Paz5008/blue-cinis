import { NextRequest, NextResponse } from 'next/server';
import { queryFeaturedArtists } from '@/lib/data/artists';

export const revalidate = 180;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 3;

    try {
        if (isNaN(limit) || limit <= 0) {
            return NextResponse.json([], { status: 200 });
        }

        const artists = await queryFeaturedArtists({ limit });

        return NextResponse.json(artists, {
            status: 200,
            headers: { 'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=600' },
        });
    } catch (error) {
        console.error('ERREUR /api/artist/featured', error);
        return NextResponse.json([], { status: 200 });
    }
}
