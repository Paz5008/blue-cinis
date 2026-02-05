import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { FALLBACK_FEATURED_ARTWORKS } from "@/lib/data/artworks";
import { buildArtworkPath } from "@/lib/artworkSlug";
import { resolveLocale } from "@/lib/i18n/server";
import type { AppLocale } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXTAUTH_URL || "https://blue-cinis.com";
const CANONICAL_PATH = "/galerie";
const PAGE_SIZE = 12;

export const GALLERY_PAGE_URL = `${SITE_URL}${CANONICAL_PATH}`;
export const GALLERY_CANONICAL_PATH = CANONICAL_PATH;
export const GALLERY_OG_IMAGE = "/gallery.webp";

type GalleryCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string; variant?: "primary" | "secondary" | "ghost" };
  };
};

const GALLERY_COPY: Record<AppLocale, GalleryCopy> = {
  fr: {
    metadata: {
      title: "Galerie Blue Cinis — Collection permanente",
      description:
        "Explorez une sélection d’œuvres contemporaines, préparée avec soin par notre équipe de curation.",
    },
    hero: {
      eyebrow: "Collection permanente",
      title: "Galerie Blue Cinis",
      description:
        "Notre équipe accompagne chaque artiste pour garantir des œuvres authentiques, documentées et prêtes à rejoindre votre collection.",
      primaryCta: { label: "Parler à un conseiller", href: "/contact" },
      secondaryCta: { label: "Voir les vernissages", href: "/evenements", variant: "secondary" },
    },
  },
  en: {
    metadata: {
      title: "Blue Cinis — Curated Collection",
      description:
        "Browse a rotating selection of contemporary works, curated and documented by the Blue Cinis team.",
    },
    hero: {
      eyebrow: "Permanent collection",
      title: "Blue Cinis",
      description:
        "Every piece is inspected, catalogued and handled with museum-level care so you can acquire with total confidence.",
      primaryCta: { label: "Speak with an advisor", href: "/contact" },
      secondaryCta: { label: "Upcoming viewings", href: "/evenements", variant: "secondary" },
    },
  },
};

export function getGalleryCopy(locale: AppLocale): GalleryCopy {
  return GALLERY_COPY[locale] ?? GALLERY_COPY.fr;
}

type GalleryPreviewItem =
  | {
    id: string;
    title: string | null;
  }
  | {
    id: string;
    title: string;
  };

const fetchGalleryPreviewItems = cache(async () => {
  try {
    const artworks = await prisma.artwork.findMany({
      select: {
        id: true,
        title: true,
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    });
    return artworks as GalleryPreviewItem[];
  } catch (error) {
    console.warn("Failed to load gallery preview items for metadata.", error);
    return FALLBACK_FEATURED_ARTWORKS.slice(0, PAGE_SIZE).map((artwork) => ({
      id: artwork.id,
      title: artwork.title,
    }));
  }
});

export async function getGalleryJsonLd() {
  const locale = await resolveLocale();
  const copy = getGalleryCopy(locale);
  const items = await fetchGalleryPreviewItems();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.metadata.title,
    description: copy.metadata.description,
    url: GALLERY_PAGE_URL,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => {
        const itemPath = buildArtworkPath({ id: item.id, title: item.title ?? undefined });
        return {
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}${itemPath}`,
          name: item.title ?? "Œuvre Blue Cinis",
        };
      }),
    },
  };
}
