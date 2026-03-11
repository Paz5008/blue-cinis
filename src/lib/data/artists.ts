import React from "react";
import { createRequire } from "module";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  ArtistPosterStructure,
  type ArtistPosterCanvasProps,
  type ArtistContext as BannerArtistContext,
  type BannerContent,
} from "@/components/artist/ArtistPosterStructure";

import { CACHE_TAGS } from "@/lib/cacheTags";
import { clearRuntimeAlert, markRuntimeAlert } from "@/lib/runtimeAlerts";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as typeof import("react-dom/server");

const DEFAULT_LIMIT = 3;

import { ToastContext } from "@/context/ToastContext";

export function renderArtistCanvasToHtml(props: ArtistPosterCanvasProps) {
  const mockToast = { addToast: () => "", removeToast: () => { } };
  return renderToStaticMarkup(
    React.createElement(
      ToastContext.Provider,
      { value: mockToast },
      React.createElement(ArtistPosterStructure, {
        ...props,
        isMobile: false,
        LinkComponent: "a",
        contactForm: null
      })
    )
  );
}

function renderPosterCanvasToHtml(props: Omit<ArtistPosterCanvasProps, "pageKey">) {
  return renderArtistCanvasToHtml({ ...props, pageKey: "poster" });
}

export type FeaturedArtist = {
  id: string;
  name: string | null;
  slug: string | null;
  photoUrl: string | null;
  biography: string | null;
  artStyle?: string | null;
  portfolio?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  artworks?: Array<{
    id: string;
    title: string | null;
    imageUrl: string | null;
  }>;
  homeSnippet?: string | null;
  homeCtaLabel?: string | null;
  homeCtaUrl?: string | null;
  homeBanner?: HomeBannerPreview | null;
  homeBannerPresetId?: string | null;
  homeBannerHtml?: string | null;
  bannerLayout?: string | null;
  bannerPalette?: any | null;
  bannerAesthetic?: string | null;
  bannerCaption?: string | null;
  bannerTextureUrl?: string | null;
  bannerBackgroundImage?: string | null;
  bannerOverlayOpacity?: number | null;
  bannerCtaText?: string | null;
  bannerCtaUrl?: string | null;
  bannerCtaStyle?: string | null;
};

export type HomeBannerPreview = {
  heading: string;
  body?: string | null;
  badgeLabel?: string | null;
  accentColor: string;
  textColor: string;
  styles: Record<string, string>;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string | null;
};

export type ArtistPosterSpotlight = {
  artistId: string;
  artistName: string;
  artistSlug?: string | null;
  posterImageUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  tagline: string;
  posterHtml?: string | null;
};

type QueryParams = {
  limit?: number;
  includeArtworks?: boolean;
  artworksLimit?: number;
};

const stripHtml = (input: unknown): string => {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

const firstSentence = (input: unknown, fallback: string | null): string => {
  const source = typeof input === "string" && input.trim().length > 0 ? input.trim() : fallback || "";
  if (!source) return "";
  const sentence = source.split(/[\.\!\?]/).find((part) => part && part.trim().length > 0);
  return (sentence || source).trim();
};

const truncate = (value: string, max = 160): string => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
};

const sanitizeColor = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};







const asJsonRecord = (value: Prisma.JsonValue | null | undefined): Record<string, any> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, any>;
};





type CanvasLikeBlock = {
  id?: string;
  type?: string;
  alignment?: string;
  content?: string;
  text?: string;
  label?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  backgroundImageUrl?: string;
  url?: string;
  src?: string;
  style?: Record<string, any>;
  columns?: any[];
  blocks?: any[];
  children?: any[];
  items?: any[];
  rows?: any[];
  hero?: any;
  layout?: any;
  ctas?: any[];
  buttonGroup?: any;
  overlay?: any;
  backgroundImage?: any;
  html?: string;
  component?: string;
  props?: Record<string, any>;
  artwork?: any;
};

const flattenBlocks = (blocks: any[]): CanvasLikeBlock[] => {
  const result: any[] = [];
  const visit = (block: any) => {
    if (!block || typeof block !== "object") return;
    result.push(block);
    const nestedCollections = [
      (block as any).blocks,
      (block as any).children,
      (block as any).items,
      (block as any).rows,
    ];
    for (const collection of nestedCollections) {
      if (Array.isArray(collection)) {
        collection.forEach(visit);
      }
    }
    if (Array.isArray((block as any).columns)) {
      (block as any).columns.forEach((col: any) => {
        if (Array.isArray(col)) {
          col.forEach(visit);
        }
      });
    }
  };
  if (Array.isArray(blocks)) {
    blocks.forEach(visit);
  }
  return result;
};













async function loadArtists(params: QueryParams): Promise<FeaturedArtist[]> {
  const limit = Math.max(1, Math.min(Number(params.limit) || DEFAULT_LIMIT, 24));
  const includeArtworks = params.includeArtworks ?? false;
  const artworksLimit = Math.max(1, Math.min(Number(params.artworksLimit) || 4, 12));

  const select: Prisma.ArtistSelect = {
    id: true,
    name: true,
    slug: true,
    photoUrl: true,
    biography: true,
    artStyle: true,
    portfolio: true,
    instagramUrl: true,
    facebookUrl: true,
    artworks: includeArtworks
      ? {
        take: artworksLimit,
        orderBy: { createdAt: "desc" as const },
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      }
      : false,
  };

  let artists: FeaturedArtist[] = [];

  try {
    artists = await prisma.artist.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      orderBy: { createdAt: "desc" },
      select,
    });

    if (artists.length < limit) {
      const remaining = limit - artists.length;
      const more = await prisma.artist.findMany({
        where: { isActive: true, isFeatured: false },
        take: remaining,
        orderBy: { createdAt: "desc" },
        select,
      });
      artists = [...artists, ...more];
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      artists = await prisma.artist.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { createdAt: "desc" },
        select,
      });
    } else {
      console.warn("Failed to load featured artists, using fallback list.", error);
      markRuntimeAlert("data.artists.featuredFallback", "Impossible de charger les artistes mis en avant – fallback statique", "critical");
      return FALLBACK_NEW_ARTISTS.slice(0, limit);
    }
  }

  clearRuntimeAlert("data.artists.featuredFallback");
  return artists;
}

export async function queryFeaturedArtists(params: QueryParams = {}): Promise<FeaturedArtist[]> {
  return loadArtists(params);
}

export const getFeaturedArtists = unstable_cache(
  async (limit: number) => loadArtists({ limit, includeArtworks: true }),
  [CACHE_TAGS.featuredArtists],
  { revalidate: 180, tags: [CACHE_TAGS.featuredArtists] }
);

async function loadNewestArtists(limit: number): Promise<FeaturedArtist[]> {
  const take = Math.max(1, Math.min(limit, 12));
  try {
    const raw = await prisma.artist.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take,

      select: {
        id: true,
        name: true,
        slug: true,
        photoUrl: true,
        biography: true,
        artStyle: true,
        portfolio: true,
        instagramUrl: true,
        facebookUrl: true,
        bannerLayout: true,
        bannerPalette: true,
        bannerAesthetic: true,
        bannerCaption: true,
        bannerTextureUrl: true,
        artworks: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, imageUrl: true },
        },
        user: {
          select: {
            artistPages: {
              where: { key: { in: ["profile", "banner"] } },
              select: {
                key: true,
                publishedContent: true,
              },
            },
          },
        },
      },
    });

    const buildSnippet = (content: any, fallback: string | null): string | null => {
      if (!content || typeof content !== "object") {
        return fallback && fallback.trim().length > 0 ? fallback.trim() : null;
      }
      const settingsSnippet = (() => {
        const raw = (content as any)?.settings?.homeSnippet;
        return typeof raw === "string" ? raw.trim() : null;
      })();
      if (settingsSnippet) {
        const sanitized = settingsSnippet.replace(/\s+/g, " ").trim();
        if (sanitized) return sanitized.length > 180 ? `${sanitized.slice(0, 177)}…` : sanitized;
      }
      const blocks = Array.isArray((content as any)?.blocks) ? (content as any).blocks : [];
      const searchableBlocks = flattenBlocks(blocks);
      for (const block of searchableBlocks) {
        if (!block || typeof block !== "object") continue;
        const type = String(block.type || "").toLowerCase();
        if (type === "text" && typeof block.content === "string") {
          const text = stripHtml(block.content);
          if (text) return text.length > 180 ? `${text.slice(0, 177)}…` : text;
        }
        if (type === "artistbio" && typeof block.content === "string") {
          const text = stripHtml(block.content);
          if (text) return text.length > 180 ? `${text.slice(0, 177)}…` : text;
        }
      }
      if (fallback && fallback.trim().length > 0) {
        const clean = fallback.trim();
        return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
      }
      return null;
    };

    const buildCta = (content: any): { label: string | null; href: string | null } => {
      const settings = content && typeof content === "object" ? (content as any).settings : null;
      if (settings && typeof settings === "object") {
        const label = typeof settings.homeCtaLabel === "string" ? settings.homeCtaLabel.trim() : null;
        const hrefRaw = typeof settings.homeCtaUrl === "string" ? settings.homeCtaUrl.trim() : null;
        const href = hrefRaw && hrefRaw.length > 0 ? hrefRaw : null;
        if (label || href) {
          return { label: label || null, href };
        }
        if (settings.homeCta && typeof settings.homeCta === "object") {
          const nestedLabel = typeof settings.homeCta.label === "string" ? settings.homeCta.label.trim() : null;
          const nestedHref = typeof settings.homeCta.href === "string" ? settings.homeCta.href.trim() : null;
          if (nestedLabel || nestedHref) {
            return { label: nestedLabel || null, href: nestedHref || null };
          }
        }
        const altLabel = typeof settings.ctaLabel === "string" ? settings.ctaLabel.trim() : null;
        const altHrefRaw = typeof settings.ctaUrl === "string" ? settings.ctaUrl.trim() : null;
        const altHref = altHrefRaw && altHrefRaw.length > 0 ? altHrefRaw : null;
        if (altLabel || altHref) {
          return { label: altLabel || null, href: altHref };
        }
        if (settings.cta && typeof settings.cta === "object") {
          const nestedLabel = typeof settings.cta.label === "string" ? settings.cta.label.trim() : null;
          const nestedHref = typeof settings.cta.href === "string" ? settings.cta.href.trim() : null;
          if (nestedLabel || nestedHref) {
            return { label: nestedLabel || null, href: nestedHref || null };
          }
        }
        if (settings.primaryCta && typeof settings.primaryCta === "object") {
          const primaryLabel = typeof settings.primaryCta.label === "string" ? settings.primaryCta.label.trim() : null;
          const primaryHref = typeof settings.primaryCta.href === "string" ? settings.primaryCta.href.trim() : null;
          if (primaryLabel || primaryHref) {
            return { label: primaryLabel || null, href: primaryHref || null };
          }
        }
      }
      return { label: null, href: null };
    };

    const resolvePageContent = (page: any) => {
      if (!page || typeof page !== "object") return null;
      const published = (page as any).publishedContent;
      if (published && typeof published === "object" && Object.keys(published as Record<string, unknown>).length > 0) {
        return published;
      }
      return null;
    };

    const newest = raw.map((artistItem) => {
      const artist = artistItem as any;
      const pages = Array.isArray(artist.user?.artistPages) ? artist.user?.artistPages : [];
      const profilePage = pages.find((page: any) => page?.key === "profile") || null;
      const bannerPage = pages.find((page: any) => page?.key === "banner") || null;

      const profileContent = resolvePageContent(profilePage);
      const bannerContent = resolvePageContent(bannerPage);

      const homeSnippet = buildSnippet(profileContent ?? bannerContent, artist.biography);
      const profileCta = buildCta(profileContent);


      const fallbackHref = artist.slug ? `/artistes/${artist.slug}` : `/artistes/${artist.id}`;


      const { user: _user, ...rest } = artist;
      return {
        ...rest,
        homeSnippet: homeSnippet || artist.biography || null,
        homeCtaLabel: profileCta.label || null,
        homeCtaUrl: profileCta.href || fallbackHref,
        homeBanner: null,
        homeBannerPresetId: null,
        homeBannerHtml: null,
        bannerLayout: artist.bannerLayout,
        bannerPalette: artist.bannerPalette,
        bannerAesthetic: artist.bannerAesthetic,
        bannerCaption: artist.bannerCaption,
        bannerTextureUrl: artist.bannerTextureUrl,
      };
    });
    clearRuntimeAlert("data.artists.newestFallback");
    return newest;
  } catch (error) {
    console.warn("Failed to load newest artists, using fallback list.", error);
    markRuntimeAlert("data.artists.newestFallback", "Impossible de charger les artistes récents – fallback statique", "critical");
    return FALLBACK_NEW_ARTISTS.slice(0, take);
  }
}

export const getNewestArtists =
  process.env.NODE_ENV === "development"
    ? (limit: number) => loadNewestArtists(limit)
    : unstable_cache(async (limit: number) => loadNewestArtists(limit), [CACHE_TAGS.newestArtists], {
      revalidate: 30,
      tags: [CACHE_TAGS.artists],
    });

const createFallbackArtists = (): FeaturedArtist[] => {
  const placeholderStyles = { backgroundColor: "rgba(248,250,252,0.94)" };
  const entries = [
    {
      id: "fallback-artist-1",
      name: "Artiste en vitrine",
      heading: "Bannière en préparation",
      body: "Publiez votre bandeau pour activer cette vitrine sur la page d’accueil.",
      accent: "#334155",
    },
    {
      id: "fallback-artist-2",
      name: "Artiste invité·e",
      heading: "Mettez votre univers en avant",
      body: "Depuis le CMS, personnalisez un canevas 1000×320 px pour apparaître ici.",
      accent: "#2563eb",
    },
    {
      id: "fallback-artist-3",
      name: "Créateur·trice Partenaire",
      heading: "Espace disponible",
      body: "Ajoutez une image, du texte et un appel à l’action pour compléter la bannière.",
      accent: "#7c3aed",
    },
  ];

  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    slug: null,
    photoUrl: null,
    biography: null,
    artStyle: null,
    portfolio: null,
    instagramUrl: null,
    facebookUrl: null,
    artworks: [],
    homeSnippet: null,
    homeCtaLabel: null,
    homeCtaUrl: null,
    homeBanner: {
      heading: entry.heading,
      body: entry.body,
      badgeLabel: null,
      accentColor: entry.accent,
      textColor: "#0f172a",
      styles: placeholderStyles,
      ctaLabel: "Découvrir l’artiste",
      ctaHref: "/inscription-artiste",
      imageUrl: null,
    },
    homeBannerPresetId: null,
    homeBannerHtml: null,
  }));
};

export const FALLBACK_NEW_ARTISTS: FeaturedArtist[] = createFallbackArtists();

export const FALLBACK_ARTIST_POSTERS: ArtistPosterSpotlight[] = [
  {
    artistId: "artist-lea-montfort",
    artistName: "Léa Montfort",
    artistSlug: "lea-montfort",
    posterImageUrl: "/uploads/566024ff-076c-4788-9168-c4ba70451406.png",
    primaryColor: "#b67229",
    secondaryColor: "#d97706",
    backgroundColor: "#fdf6e3",
    textColor: "#13212f",
    tagline: "Affiche sérigraphiée « Manifestes minéraux » sur papier coton 300 g, dorure à chaud cuivre.",
    posterHtml: null,
  },
  {
    artistId: "artist-jonas-perrin",
    artistName: "Jonas Perrin",
    artistSlug: "jonas-perrin",
    posterImageUrl: "/uploads/8e60c7cf-83fa-4e33-9ba6-56b81d4de7f1.webp",
    primaryColor: "#1f2937",
    secondaryColor: "#1f6feb",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
    tagline: "Poster grand format « Nocturnes argentiques » imprimé en tirage limité, vernis sélectif.",
    posterHtml: null,
  },
  {
    artistId: "artist-aya-nouvel",
    artistName: "Aya Nouvel",
    artistSlug: "aya-nouvel",
    posterImageUrl: "/uploads/365e45f3-9e96-4c6e-b883-3f8694b2569f.webp",
    primaryColor: "#7c3aed",
    secondaryColor: "#38bdf8",
    backgroundColor: "#f3f4ff",
    textColor: "#1e1b4b",
    tagline: "Affiche translucide « Cristallographies » imprimée sur film rétroéclairé et papier mat.",
    posterHtml: null,
  },
  {
    artistId: "artist-milo-caradec",
    artistName: "Milo Caradec",
    artistSlug: "milo-caradec",
    posterImageUrl: "/uploads/7626ab05-5548-4a28-8657-bb37c60398b1.png",
    primaryColor: "#f97316",
    secondaryColor: "#0284c7",
    backgroundColor: "#fff7ed",
    textColor: "#1f2937",
    tagline: "Affiche collage « Cartographies hybrides » imprimée en risographie quadricolore.",
    posterHtml: null,
  },
  {
    artistId: "artist-sanae-doucet",
    artistName: "Sanaé Doucet",
    artistSlug: "sanae-doucet",
    posterImageUrl: "/uploads/6a596e69-767e-452e-a938-9c9c89f6b8d4.jpg",
    primaryColor: "#0f766e",
    secondaryColor: "#10b981",
    backgroundColor: "#ecfdf5",
    textColor: "#0b322b",
    tagline: "Affiche cyanotype « Herbier indigo » tirée à 40 exemplaires, embossage artisanal.",
    posterHtml: null,
  },
  {
    artistId: "artist-noor-vallon",
    artistName: "Noor Vallon",
    artistSlug: "noor-vallon",
    posterImageUrl: "/uploads/1589be68-d355-41fb-a85f-4dc89e70eb77.webp",
    primaryColor: "#7f1d1d",
    secondaryColor: "#dc2626",
    backgroundColor: "#fff5f5",
    textColor: "#2b132f",
    tagline: "Affiche « Halos au fil de l’eau » impression pigmentaire, encres nacrées et vernis mat.",
    posterHtml: null,
  },
];

const extractPosterImage = (
  theme: Record<string, any>,
  blocks: any[],
  artist: { photoUrl?: string | null }
): string | null => {
  const cover = typeof theme?.coverImageUrl === "string" ? theme.coverImageUrl.trim() : "";
  if (cover) return cover;
  const background = typeof theme?.backgroundImageUrl === "string" ? theme.backgroundImageUrl.trim() : "";
  if (background) return background;

  const tryFromBlock = (block: any): string | null => {
    if (!block || typeof block !== "object") return null;
    const directKeys = ["src", "image", "poster", "coverImageUrl"];
    for (const key of directKeys) {
      const value = block[key as keyof typeof block];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    if (Array.isArray(block.images)) {
      for (const img of block.images) {
        if (img && typeof img === "object" && typeof img.src === "string" && img.src.trim()) {
          return img.src.trim();
        }
      }
    }
    const nestedKeys = ["children", "columns", "blocks"] as const;
    for (const key of nestedKeys) {
      const nested = block[key];
      if (Array.isArray(nested)) {
        for (const child of nested) {
          const found = tryFromBlock(child);
          if (found) return found;
        }
      }
    }
    return null;
  };

  for (const block of blocks) {
    const candidate = tryFromBlock(block);
    if (candidate) return candidate;
  }

  const photo = artist?.photoUrl;
  if (typeof photo === "string" && photo.trim().length > 0) {
    return photo.trim();
  }

  return null;
};

const extractPosterTagline = (
  blocks: any[],
  artistName: string | null,
  biography: string | null
): string => {
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const titleFields = [block.title, block.heading, block.tagline] as Array<unknown>;
    for (const field of titleFields) {
      if (typeof field === "string" && field.trim().length > 0) {
        return truncate(field.trim(), 140);
      }
    }
    if (typeof block.content === "string" && block.content.trim().length > 0) {
      const text = stripHtml(block.content).trim();
      if (text) return truncate(text, 140);
    }
  }

  const fallbackSentence = firstSentence(biography, artistName ? `${artistName} présente sa nouvelle affiche personnalisée.` : null);
  const safeFallback = fallbackSentence || "Affiche personnalisée disponible en édition limitée.";
  return truncate(safeFallback, 140);
};

const extractPosterColors = (theme: Record<string, any>) => {
  return {
    primaryColor: sanitizeColor(theme?.primaryColor, "#1f2937"),
    secondaryColor: sanitizeColor(theme?.secondaryColor, "#d4a25a"),
    backgroundColor: sanitizeColor(theme?.backgroundColor, "#f8fafc"),
    textColor: sanitizeColor(theme?.textColor, "#0f172a"),
  };
};

async function loadArtistPosterSpotlights(limit: number): Promise<ArtistPosterSpotlight[]> {
  const take = Math.max(1, Math.min(limit, 8));
  try {
    const pages = await prisma.artistPage.findMany({
      where: {
        key: "poster",
        publishedContent: { not: Prisma.JsonNull },
        user: {
          artist: {
            isActive: true,
          },
        },
      },
      select: {
        publishedContent: true,
        updatedAt: true,
        user: {
          select: {
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                biography: true,
                photoUrl: true,
                artworks: {
                  take: 12,
                  orderBy: { createdAt: "desc" as const },
                  select: { id: true, title: true, imageUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: Math.max(take * 2, take),
    });

    const posters: ArtistPosterSpotlight[] = [];
    for (const page of pages) {
      const artist = page.user?.artist;
      if (!artist) continue;
      const content = asJsonRecord(page.publishedContent) ?? {};
      const theme = asJsonRecord(content.theme) ?? {};
      const blocks = Array.isArray(content.blocks) ? (content.blocks as any[]) : [];

      const posterImageUrl = extractPosterImage(theme, blocks, artist);
      const tagline = extractPosterTagline(blocks, artist.name, artist.biography);
      const colors = extractPosterColors(theme);

      const artistContext: BannerArtistContext = {
        id: artist.id,
        name: artist.name ?? "Artiste invité",
        slug: artist.slug,
        biography: artist.biography,
        photoUrl: artist.photoUrl,
        artworks: Array.isArray((artist as any).artworks)
          ? ((artist as any).artworks as any[]).map((art) => ({
            id: art?.id,
            title: art?.title,
            imageUrl: art?.imageUrl,
          }))
          : [],
      };

      let posterHtml: string | null = null;
      try {
        posterHtml = renderPosterCanvasToHtml({
          artist: artistContext,
          content: content as BannerContent | null,
          variant: "preview",
          showBackLink: false,
        });
      } catch (error) {
        console.warn("Failed to render poster canvas for artist", artist.id, error);
        posterHtml = null;
      }

      posters.push({
        artistId: artist.id,
        artistName: artist.name ?? "Artiste invité",
        artistSlug: artist.slug,
        posterImageUrl,
        primaryColor: colors.primaryColor,
        secondaryColor: colors.secondaryColor,
        backgroundColor: colors.backgroundColor,
        textColor: colors.textColor,
        tagline,
        posterHtml,
      });

      if (posters.length >= take) {
        break;
      }
    }

    clearRuntimeAlert("data.artists.postersLoadFailure");
    return posters;
  } catch (error) {
    console.warn("Failed to load artist posters, using fallback list.", error);
    markRuntimeAlert("data.artists.postersLoadFailure", "Impossible de charger les posters artistes – fallback statique", "critical");
    return [];
  }
}

export const getArtistPosters = unstable_cache(
  async (limit: number) => {
    const normalizedLimit = Math.max(1, Math.min(limit || 4, 8));
    const posters = await loadArtistPosterSpotlights(normalizedLimit);
    if (!posters.length) {
      markRuntimeAlert("data.artists.postersFallback", "Aucun poster artiste actif – fallback statique", "warning");
      return FALLBACK_ARTIST_POSTERS.slice(0, normalizedLimit);
    }
    clearRuntimeAlert("data.artists.postersFallback");
    return posters;
  },
  ["artist-posters"],
  { revalidate: 180, tags: ["artist-posters", "artists"] }
);
