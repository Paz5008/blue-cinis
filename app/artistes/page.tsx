import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import ArtistesPageClient from "@/components/artistes/ArtistesPageClient";
import ArtistesToolbar from "@/components/artistes/ArtistesToolbar";
import {
  ARTISTS_DESCRIPTION,
  ARTISTS_TITLE,
  ARTISTS_PAGE_URL,
  ARTISTS_CANONICAL_PATH,
  ARTISTS_OG_IMAGE,
} from "./seo";
import { CACHE_TAGS } from "@/lib/cacheTags";

export const revalidate = 60;

type ArtistSort =
  | "name_asc"
  | "name_desc"
  | "date_asc"
  | "date_desc"
  | "artStyle_asc"
  | "artStyle_desc"
  | "artworks_asc"
  | "artworks_desc";

type ArtistsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type ArtistWithStats = Prisma.ArtistGetPayload<{
  include: {
    _count: { select: { artworks: true } };
    artworks: { select: { imageUrl: true } };
  };
}>;

const PAGE_SIZE = 12;

function pickParam(value?: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function resolveSort(rawSort?: string): ArtistSort {
  const allowed: ArtistSort[] = [
    "name_asc",
    "name_desc",
    "date_asc",
    "date_desc",
    "artStyle_asc",
    "artStyle_desc",
    "artworks_asc",
    "artworks_desc",
  ];
  return allowed.includes(rawSort as ArtistSort) ? (rawSort as ArtistSort) : "name_asc";
}

function resolveOrderBy(sort: ArtistSort): Prisma.ArtistOrderByWithRelationInput {
  switch (sort) {
    case "name_desc":
      return { name: "desc" };
    case "date_asc":
      return { createdAt: "asc" };
    case "date_desc":
      return { createdAt: "desc" };
    case "artStyle_asc":
      return { artStyle: "asc" };
    case "artStyle_desc":
      return { artStyle: "desc" };
    case "artworks_asc":
      return { artworks: { _count: "asc" } } as Prisma.ArtistOrderByWithRelationInput;
    case "artworks_desc":
      return { artworks: { _count: "desc" } } as Prisma.ArtistOrderByWithRelationInput;
    case "name_asc":
    default:
      return { name: "asc" };
  }
}

async function getPagedArtists(args: {
  page: number;
  pageSize: number;
  orderBy: Prisma.ArtistOrderByWithRelationInput;
  search?: string;
}): Promise<{ total: number; artists: ArtistWithStats[] }> {
  const key = [CACHE_TAGS.artistsList, JSON.stringify(args)];
  const cached = unstable_cache(
    async () => {
      const { page, pageSize, orderBy, search } = args;
      const where: Prisma.ArtistWhereInput = {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { artStyle: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };
      const total = await prisma.artist.count({ where });
      const artists = await prisma.artist.findMany({
        where,
        include: {
          _count: { select: { artworks: true } },
          artworks: {
            take: 3,
            select: { imageUrl: true },
            where: { status: 'available' },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return { total, artists };
    },
    key,
    { revalidate: 60, tags: [CACHE_TAGS.artistsList] }
  );
  return cached();
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const sort = resolveSort(pickParam(searchParams?.sort));
  const orderBy = resolveOrderBy(sort);
  const pageParam = pickParam(searchParams?.page);
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const search = pickParam(searchParams?.search)?.trim() || undefined;

  let total = 0;
  let rawArtists: ArtistWithStats[] = [];

  try {
    const res = await getPagedArtists({ page, pageSize: PAGE_SIZE, orderBy, search });
    total = res.total;
    rawArtists = res.artists;
  } catch (error) {
    console.error("[ArtistsPage] Failed to fetch artists:", error);
  }

  // Transform artists to include works array for thumbnails
  const artists = rawArtists.map((artist) => ({
    ...artist,
    works: artist.artworks.map((a) => a.imageUrl).filter(Boolean) as string[],
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-[#030303] pb-32">
      {/* Client component with animated header and grid */}
      <ArtistesPageClient artists={artists} totalCount={total} />

      {/* Search, Sort + Pagination - Fixed at bottom, hidden when menu open */}
      <ArtistesToolbar
        sort={sort}
        page={page}
        totalPages={totalPages}
        search={search}
      />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ARTISTS_TITLE,
    description: ARTISTS_DESCRIPTION,
    alternates: {
      canonical: ARTISTS_CANONICAL_PATH,
    },
    openGraph: {
      title: ARTISTS_TITLE,
      description: ARTISTS_DESCRIPTION,
      url: ARTISTS_PAGE_URL,
      type: "website",
      images: [
        {
          url: ARTISTS_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: ARTISTS_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ARTISTS_TITLE,
      description: ARTISTS_DESCRIPTION,
      images: [ARTISTS_OG_IMAGE],
    },
  };
}
