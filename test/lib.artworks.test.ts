import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    artwork: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

import { getFeaturedArtworks, FALLBACK_FEATURED_ARTWORKS } from "@/lib/data/artworks";

describe("getFeaturedArtworks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns fallback artworks when the database lookup fails", async () => {
    findManyMock.mockRejectedValueOnce(new Error("db error"));

    const result = await getFeaturedArtworks(2);

    expect(result.items).toEqual(FALLBACK_FEATURED_ARTWORKS.slice(0, 2));
    expect(result.hasMore).toBe(FALLBACK_FEATURED_ARTWORKS.length > 2);
    expect(result.nextCursor).toBe(
      FALLBACK_FEATURED_ARTWORKS.length > 2
        ? FALLBACK_FEATURED_ARTWORKS[1].id
        : null,
    );
  });
});
