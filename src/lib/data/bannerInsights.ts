import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_LABEL_LENGTH = 140;
const MAX_HREF_LENGTH = 1024;
const MAX_STRING_LENGTH = 120;

const sanitizeString = (value: unknown, max = MAX_STRING_LENGTH): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const sanitizeHref = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_HREF_LENGTH ? trimmed.slice(0, MAX_HREF_LENGTH) : trimmed;
};

const sanitizeLabel = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_LABEL_LENGTH ? `${trimmed.slice(0, MAX_LABEL_LENGTH - 1)}…` : trimmed;
};

const computeCtaKey = (input: { href: string; label?: string | null; placement?: string | null; presetId?: string | null }): string => {
  const hash = createHash("sha1");
  hash.update(input.href || "");
  hash.update("||");
  hash.update(input.label || "");
  hash.update("||");
  hash.update(input.placement || "");
  hash.update("||");
  hash.update(input.presetId || "");
  return hash.digest("hex");
};

const startOfUtcDay = (value: Date): Date => {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
};

const toIsoString = (value: Date | null | undefined): string | null => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString();
  }
  return null;
};

export type BannerCtaTrackPayload = {
  artistId: string;
  ctaHref: string;
  ctaLabel?: string | null;
  placement?: string | null;
  presetId?: string | null;
  source?: string | null;
  timestamp?: Date | string | number | null;
};

export async function recordBannerCtaClick(event: BannerCtaTrackPayload): Promise<void> {
  const artistId = sanitizeString(event.artistId, 64);
  const ctaHref = sanitizeHref(event.ctaHref);
  if (!artistId || !ctaHref) {
    return;
  }

  const ctaLabel = sanitizeLabel(event.ctaLabel);
  const placement = sanitizeString(event.placement);
  const presetId = sanitizeString(event.presetId);
  const source = sanitizeString(event.source);

  let timestamp = new Date();
  if (event.timestamp instanceof Date && !Number.isNaN(event.timestamp.valueOf())) {
    timestamp = event.timestamp;
  } else if (typeof event.timestamp === "string" || typeof event.timestamp === "number") {
    const derived = new Date(event.timestamp);
    if (!Number.isNaN(derived.valueOf())) {
      timestamp = derived;
    }
  }
  const day = startOfUtcDay(timestamp);
  const ctaKey = computeCtaKey({ href: ctaHref, label: ctaLabel ?? null, placement: placement ?? null, presetId: presetId ?? null });

  try {
    await prisma.bannerCtaMetric.upsert({
      where: {
        artistId_ctaKey_date: {
          artistId,
          ctaKey,
          date: day,
        },
      },
      create: {
        artistId,
        ctaKey,
        ctaLabel,
        ctaHref,
        placement,
        presetId,
        source,
        date: day,
        clicks: 1,
      },
      update: {
        clicks: { increment: 1 },
        ctaLabel,
        ctaHref,
        placement,
        presetId,
        source,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Swallow FK constraint errors silently to avoid breaking navigation
      if (error.code === "P2003" || error.code === "P2002") {
        return;
      }
    }
    throw error;
  }
}

export type BannerInsights = {
  artistId: string;
  windowDays: number;
  totalClicks: number;
  lastSevenDays: number;
  lastClickAt: string | null;
  ctaCount: number;
  daily: Array<{ date: string; clicks: number }>;
  topCtas: Array<{
    ctaKey: string;
    ctaLabel: string | null;
    ctaHref: string;
    placement: string | null;
    presetId: string | null;
    source: string | null;
    clicks: number;
    lastClickAt: string | null;
  }>;
};

const buildDateRange = (start: Date, end: Date): string[] => {
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

export async function getBannerInsightsForArtist(artistId: string, options: { windowDays?: number } = {}): Promise<BannerInsights | null> {
  const normalizedArtistId = sanitizeString(artistId, 64);
  if (!normalizedArtistId) return null;
  const windowDays = Math.max(7, Math.min(options.windowDays ?? 30, 90));

  const today = startOfUtcDay(new Date());
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - (windowDays - 1));

  const metrics = await prisma.bannerCtaMetric.findMany({
    where: {
      artistId: normalizedArtistId,
      date: {
        gte: start,
        lte: today,
      },
    },
    orderBy: [{ date: "asc" }],
  });

  const dailyMap = new Map<string, number>();
  const baseDates = buildDateRange(start, today);
  baseDates.forEach((key) => dailyMap.set(key, 0));

  const ctaMap = new Map<
    string,
    {
      ctaKey: string;
      ctaLabel: string | null;
      ctaHref: string;
      placement: string | null;
      presetId: string | null;
      source: string | null;
      clicks: number;
      lastClickAt: Date | null;
    }
  >();

  let totalClicks = 0;
  let lastClickAt: Date | null = null;

  metrics.forEach((metric) => {
    const dateKey = startOfUtcDay(metric.date).toISOString().slice(0, 10);
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + metric.clicks);
    totalClicks += metric.clicks;
    const lastSeen = metric.updatedAt ?? metric.createdAt ?? metric.date;
    if (!lastClickAt || lastSeen > lastClickAt) {
      lastClickAt = lastSeen;
    }
    const existing = ctaMap.get(metric.ctaKey);
    if (existing) {
      existing.clicks += metric.clicks;
      if (!existing.ctaLabel && metric.ctaLabel) {
        existing.ctaLabel = metric.ctaLabel;
      }
      if (!existing.placement && metric.placement) {
        existing.placement = metric.placement;
      }
      if (!existing.presetId && metric.presetId) {
        existing.presetId = metric.presetId;
      }
      if (!existing.source && metric.source) {
        existing.source = metric.source;
      }
      if (!existing.ctaHref && metric.ctaHref) {
        existing.ctaHref = metric.ctaHref;
      }
      if (!existing.lastClickAt || lastSeen > existing.lastClickAt) {
        existing.lastClickAt = lastSeen;
      }
    } else {
      ctaMap.set(metric.ctaKey, {
        ctaKey: metric.ctaKey,
        ctaLabel: metric.ctaLabel,
        ctaHref: metric.ctaHref,
        placement: metric.placement,
        presetId: metric.presetId,
        source: metric.source,
        clicks: metric.clicks,
        lastClickAt: lastSeen,
      });
    }
  });

  const daily = Array.from(dailyMap.entries()).map(([date, clicks]) => ({ date, clicks }));
  const lastSevenDays = daily.slice(-7).reduce((sum, entry) => sum + entry.clicks, 0);

  const topCtas = Array.from(ctaMap.values())
    .sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      const aTime = a.lastClickAt?.valueOf() ?? 0;
      const bTime = b.lastClickAt?.valueOf() ?? 0;
      return bTime - aTime;
    })
    .map((entry) => ({
      ctaKey: entry.ctaKey,
      ctaLabel: entry.ctaLabel,
      ctaHref: entry.ctaHref,
      placement: entry.placement,
      presetId: entry.presetId,
      source: entry.source,
      clicks: entry.clicks,
      lastClickAt: toIsoString(entry.lastClickAt),
    }));

  return {
    artistId: normalizedArtistId,
    windowDays,
    totalClicks,
    lastSevenDays,
    lastClickAt: toIsoString(lastClickAt),
    ctaCount: topCtas.length,
    daily,
    topCtas,
  };
}
