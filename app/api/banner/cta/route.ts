import { NextRequest, NextResponse } from "next/server";
import { recordBannerCtaClick } from "@/lib/data/bannerInsights";
import { bannerCtaLimiter, getIpFromHeaders } from "@/lib/ratelimit";
import { verifyBannerCtaSignature } from "@/lib/bannerSignature";
import { createInMemorySlidingWindowLimiter } from "@/lib/localRateLimit";
import { env } from "@/env";

const fallbackLimiter = createInMemorySlidingWindowLimiter({ max: 60, windowMs: 60_000 });

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const artistId = typeof payload?.artistId === "string" ? payload.artistId.trim() : "";
  const ctaHref = typeof payload?.ctaHref === "string" ? payload.ctaHref.trim() : "";
  if (!artistId || !ctaHref) {
    return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
  }
  const placement = typeof payload?.placement === "string" ? payload.placement : "default";
  const signature = typeof payload?.signature === "string" ? payload.signature : null;
  const signatureValid = verifyBannerCtaSignature({ artistId, ctaHref, placement }, signature);
  if (!signatureValid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Apply a sliding-window throttle per IP + artist + placement to avoid metric flooding.
  const ip = getIpFromHeaders(request.headers);
  const identifier = `${artistId}:${placement}:${ip}`;
  if (!bannerCtaLimiter && env.NODE_ENV === "production") {
    return NextResponse.json({ error: "rate_limiter_unavailable" }, { status: 503 });
  }
  const limit = bannerCtaLimiter ? await bannerCtaLimiter.limit(identifier) : fallbackLimiter.limit(identifier);
  if (!limit.success) {
    return NextResponse.json(
      { error: "rate_limited", reset: limit.reset },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)).toString(),
        },
      }
    );
  }

  try {
    await recordBannerCtaClick({
      artistId,
      ctaHref,
      ctaLabel: payload?.ctaLabel,
      placement: payload?.placement,
      presetId: payload?.presetId,
      source: payload?.source,
      timestamp: payload?.timestamp,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Failed to record banner CTA click", error);
    return NextResponse.json({ error: "tracking_failed" }, { status: 500 });
  }
}
