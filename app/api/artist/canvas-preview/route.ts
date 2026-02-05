import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { ArtistBannerCanvasProps } from "@/components/artist/ArtistBannerCanvas";
import { renderArtistCanvasToHtml } from "@/lib/data/artists";
import { verifyPreviewToken } from "@/lib/previewToken";
import { env } from "@/env";

type PreviewPayload = {
  pageKey?: string;
  artist?: ArtistBannerCanvasProps["artist"];
  content?: ArtistBannerCanvasProps["content"];
  previewToken?: string | null;
};

const allowAnonymousCanvasPreview = env.NODE_ENV !== 'production' && env.ALLOW_ANONYMOUS_CANVAS_PREVIEW === "1";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as PreviewPayload;
    const requestedKey = (payload.pageKey ?? "banner").toLowerCase();
    const pageKey = requestedKey === "poster" ? "poster" : "banner";
    const previewToken =
      (typeof payload.previewToken === "string" ? payload.previewToken : null) ||
      request.headers.get("x-preview-token");
    const session = await auth();
    let claims = null;
    if (!session?.user?.id) {
      if (previewToken) {
        claims = verifyPreviewToken(previewToken);
        if (!claims) {
          return NextResponse.json({ error: "invalid_preview_token" }, { status: 401 });
        }
        if (claims.key !== pageKey) {
          return NextResponse.json({ error: "mismatched_preview_scope" }, { status: 403 });
        }
      } else if (!allowAnonymousCanvasPreview) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
    const artist = payload.artist;
    const content = payload.content ?? null;
    if (!artist || !artist.id) {
      return NextResponse.json({ error: "missing_artist" }, { status: 400 });
    }
    const html = renderArtistCanvasToHtml({
      artist,
      content,
      pageKey,
      variant: "preview",
      showBackLink: false,
    });
    return NextResponse.json({ html });
  } catch (error) {
    console.error("Failed to generate canvas preview", error);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
