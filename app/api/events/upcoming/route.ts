import { NextRequest, NextResponse } from "next/server";
import { queryUpcomingEvents } from "@/lib/data/events";

export const revalidate = 120;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 3;
        const events = await queryUpcomingEvents({
            limit: Number.isFinite(limit) ? limit : undefined,
        });

        return NextResponse.json(events, {
            headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des événements:", error);
        // Ne pas casser l'UI si la DB est indisponible: renvoyer un tableau vide
        return NextResponse.json([], { status: 200 });
    }
}
