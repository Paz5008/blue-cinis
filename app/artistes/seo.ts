import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { FALLBACK_NEW_ARTISTS } from "@/lib/data/artists";

const SITE_URL = process.env.NEXTAUTH_URL || "https://blue-cinis.com";
const CANONICAL_PATH = "/artistes";
const PAGE_SIZE = 12;

export const ARTISTS_PAGE_URL = `${SITE_URL}${CANONICAL_PATH}`;
export const ARTISTS_CANONICAL_PATH = CANONICAL_PATH;
export const ARTISTS_TITLE = "Artistes Blue Cinis — Talents contemporains";
export const ARTISTS_DESCRIPTION =
  "Rencontrez les artistes qui façonnent le visage contemporain de la scène artistique et découvrez leurs univers singuliers.";
export const ARTISTS_OG_IMAGE = "/artist.webp";

type ArtistPreview = {
  id: string;
  slug: string | null;
  name: string | null;
};

const fetchArtistPreviewItems = cache(async () => {
  try {
    const artists = await prisma.artist.findMany({
      select: { id: true, slug: true, name: true },
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
    });
    return artists as ArtistPreview[];
  } catch (error) {
    console.warn("Failed to load artist preview items for metadata.", error);
    return FALLBACK_NEW_ARTISTS.slice(0, PAGE_SIZE).map((artist) => ({
      id: artist.id,
      slug: artist.slug,
      name: artist.name,
    }));
  }
});

export async function getArtistsJsonLd() {
  const items = await fetchArtistPreviewItems();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Artistes Blue Cinis",
    description: ARTISTS_DESCRIPTION,
    url: ARTISTS_PAGE_URL,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: item.slug ? `${ARTISTS_PAGE_URL}/${item.slug}` : `${ARTISTS_PAGE_URL}/${item.id}`,
        name: item.name ?? "Artiste invité",
      })),
    },
  };
}

