import { NextRequest, NextResponse } from "next/server";
import { getBannerInsightsForArtist } from "@/lib/data/bannerInsights";
import { ensureArtistSession } from "@/lib/artistGuard";
import { ensureArtistProfile } from "@/lib/artist-profile";

export const dynamic = "force-dynamic";

const emptyResponse = {
  artistId: null as string | null,
  windowDays: 30,
  totalClicks: 0,
  lastSevenDays: 0,
  lastClickAt: null as string | null,
  ctaCount: 0,
  daily: [] as Array<{ date: string; clicks: number }>,
  topCtas: [] as Array<{
    ctaKey: string;
    ctaLabel: string | null;
    ctaHref: string;
    placement: string | null;
    presetId: string | null;
    source: string | null;
    clicks: number;
    lastClickAt: string | null;
  }>,
};

export async function GET(_request: NextRequest) {
  try {
    const session = await ensureArtistSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const artist = await ensureArtistProfile(session, {
      select: { id: true },
      createIfMissing: false,
    });
    if (!artist?.id) {
      return NextResponse.json({ ...emptyResponse });
    }

    const insights = await getBannerInsightsForArtist(artist.id, { windowDays: 30 });
    if (!insights) {
      return NextResponse.json({ ...emptyResponse, artistId: artist.id });
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Failed to load banner insights", error);
    return NextResponse.json({ ...emptyResponse }, { status: 500 });
  }
}
