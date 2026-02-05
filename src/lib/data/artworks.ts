import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cacheTags";

const MAX_LIMIT = 50;

export type FeaturedArtwork = {
  id: string;
  title: string;
  imageUrl?: string | null;
  price: number | null;
  artistId: string;
  artistName: string;
  artistSlug?: string | null;
  artistHasStripe: boolean;
  artistEnableCommerce: boolean;
  year?: number | null;
  dimensions?: string | null;
  description?: string | null;
};

export type PaginatedFeaturedArtworks = {
  items: FeaturedArtwork[];
  nextCursor: string | null;
  hasMore: boolean;
};

type QueryParams = {
  limit?: number;
  cursor?: string | null;
};

async function fetchFeaturedArtworks({ limit = 6, cursor }: QueryParams): Promise<PaginatedFeaturedArtworks> {
  const take = Math.min(Math.max(Number(limit) || 6, 1), MAX_LIMIT);

  const baseQuery = {
    orderBy: { createdAt: "desc" as const },
    take: take + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : undefined,
  } as const;

  try {
    const records = await prisma.artwork.findMany({
      ...baseQuery,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        price: true,
        artistId: true,
        year: true,
        dimensions: true,
        description: true,
        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeAccountId: true,
            enableCommerce: true,
          },
        },
      },
    });

    const hasMore = records.length > take;
    const sliced = hasMore ? records.slice(0, take) : records;
    const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;

    const items: FeaturedArtwork[] = sliced.map((artwork) => ({
      id: artwork.id,
      title: artwork.title ?? "",
      imageUrl:
        artwork.imageUrl && !artwork.imageUrl.includes("example.com")
          ? artwork.imageUrl
          : "/liam-work1.webp",
      price:
        typeof artwork.price === "number"
          ? artwork.price
          : artwork.price === null
            ? null
            : Number(artwork.price ?? 0),
      artistId: artwork.artistId,
      artistName: artwork.artist?.name ?? "",
      artistSlug: artwork.artist?.slug ?? undefined,
      artistHasStripe: Boolean(artwork.artist?.stripeAccountId),
      artistEnableCommerce: artwork.artist?.enableCommerce !== false,
      year: artwork.year,
      dimensions: typeof artwork.dimensions === "string" ? artwork.dimensions : null,
      description: artwork.description,
    }));

    return { items, nextCursor, hasMore };
  } catch (error) {
    console.warn("Failed to load featured artworks, using fallback list.", error);
    if (cursor) {
      return { items: [], nextCursor: null, hasMore: false };
    }
    const fallbackItems = FALLBACK_FEATURED_ARTWORKS.slice(0, take);
    const hasMoreFallback = FALLBACK_FEATURED_ARTWORKS.length > take;
    const nextCursorFallback = hasMoreFallback ? fallbackItems[fallbackItems.length - 1]?.id ?? null : null;
    return {
      items: fallbackItems,
      nextCursor: nextCursorFallback,
      hasMore: hasMoreFallback,
    };
  }
}

export async function queryFeaturedArtworks(params: QueryParams): Promise<PaginatedFeaturedArtworks> {
  return fetchFeaturedArtworks(params);
}

export const getFeaturedArtworks = unstable_cache(
  async (limit: number) => fetchFeaturedArtworks({ limit }),
  [CACHE_TAGS.featuredArtworks],
  { revalidate: 180, tags: [CACHE_TAGS.featuredArtworks] }
);

export const FALLBACK_FEATURED_ARTWORKS: FeaturedArtwork[] = [
  {
    id: "fallback-artwork-hero",
    title: "Reflets de Loire",
    imageUrl: "/liam-work1.webp",
    price: 1200,
    artistId: "fallback-artist-liam",
    artistName: "Liam Voisin",
    artistSlug: null,
    artistHasStripe: false,
    artistEnableCommerce: false,
    year: 2023,
    dimensions: "80 × 60 cm",
    description: "Acrylique sur toile inspirée des lumières du fleuve.",
  },
  {
    id: "fallback-artwork-dawn",
    title: "Aurore sur la Loire",
    imageUrl: "/aurore-work1.webp",
    price: 980,
    artistId: "fallback-artist-aurore",
    artistName: "Aurore Garnier",
    artistSlug: null,
    artistHasStripe: false,
    artistEnableCommerce: false,
    year: 2022,
    dimensions: "70 × 50 cm",
    description: "Huile sur toile capturant les brumes matinales.",
  },
  {
    id: "fallback-artwork-stone",
    title: "Pierres et Vignes",
    imageUrl: "/paysage1.webp",
    price: 640,
    artistId: "fallback-artist-maelle",
    artistName: "Maëlle Tissier",
    artistSlug: null,
    artistHasStripe: false,
    artistEnableCommerce: false,
    year: 2021,
    dimensions: "60 × 45 cm",
    description: "Technique mixte sur papier texturé.",
  },
];
