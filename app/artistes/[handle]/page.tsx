import React from 'react'
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { verifyPreviewToken } from '@/lib/previewToken';
import ArtistProfileView from '@/components/artist/ArtistProfileView';

const slugifyHandle = (input: string) => {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

type FetchMode = 'slug' | 'slugInsensitive' | 'id' | 'nameExact' | 'nameLoose';

const buildArtistSelect = (includeArtworks: boolean) => ({
  id: true,
  slug: true,
  userId: true,
  name: true,
  biography: true,
  artStyle: true,
  photoUrl: true,
  bannerLayout: true,
  bannerPalette: true,
  bannerAesthetic: true,
  bannerCaption: true,
  bannerTextureUrl: true,
  bannerBackgroundImage: true,
  bannerOverlayOpacity: true,
  bannerCtaText: true,
  bannerCtaUrl: true,
  bannerCtaStyle: true,
  user: {
    select: {
      artistPages: {
        where: { key: 'banner' },
        select: { publishedContent: true, draftContent: true }
      }
    }
  },
  ...(includeArtworks
    ? {
      artworks: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          price: true,
          description: true,
          artistName: true,
          status: true,
          dimensions: true,
          year: true,
        },
      },
    }
    : {}),
});

async function fetchArtist(handle: string, mode: FetchMode, includeArtworks: boolean) {
  const select = buildArtistSelect(includeArtworks);
  try {
    if (mode === 'id') {
      return await prisma.artist.findUnique({ where: { id: handle }, select } as any);
    }
    if (mode === 'slug') {
      return await prisma.artist.findUnique({ where: { slug: handle }, select } as any);
    }
    if (mode === 'nameExact') {
      return await prisma.artist.findFirst({ where: { name: { equals: handle, mode: 'insensitive' } }, select } as any);
    }
    if (mode === 'nameLoose') {
      return await prisma.artist.findFirst({ where: { name: { contains: handle, mode: 'insensitive' } }, select } as any);
    }
    return await prisma.artist.findFirst({ where: { slug: { equals: handle, mode: 'insensitive' } }, select } as any);
  } catch {
    return null;
  }
}

async function resolveArtist(handle: string, includeArtworks: boolean) {
  const trimmed = (handle || '').trim();
  const attempts: { value: string; mode: FetchMode }[] = [];
  const pushAttempt = (value?: string, mode: FetchMode = 'slug') => {
    if (!value) return;
    const key = `${mode}::${value}`;
    if (attempts.some(entry => `${entry.mode}::${entry.value}` === key)) return;
    attempts.push({ value, mode });
  };

  if (trimmed) {
    pushAttempt(trimmed, 'slug');
    pushAttempt(trimmed, 'slugInsensitive');
    pushAttempt(trimmed, 'nameExact');

    const condensed = trimmed.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    pushAttempt(condensed, 'nameExact');
    pushAttempt(condensed, 'nameLoose');

    const lower = trimmed.toLowerCase();
    pushAttempt(lower, 'slug');
    pushAttempt(lower, 'slugInsensitive');
    pushAttempt(lower, 'nameExact');

    const slugified = slugifyHandle(trimmed);
    pushAttempt(slugified, 'slug');
    pushAttempt(slugified, 'slugInsensitive');

    const expanded = slugifyHandle(trimmed.replace(/-/g, ' '));
    pushAttempt(expanded, 'slug');
    pushAttempt(expanded, 'slugInsensitive');

    const tokens = trimmed.split(/-+/).map(part => part.trim()).filter(Boolean);
    for (let len = tokens.length; len > 0; len--) {
      const subset = tokens.slice(0, len);
      const hyphen = subset.join('-');
      const spaced = subset.join(' ');
      pushAttempt(hyphen, 'slug');
      pushAttempt(hyphen.toLowerCase(), 'slugInsensitive');
      pushAttempt(slugifyHandle(hyphen), 'slug');
      pushAttempt(spaced, 'nameExact');
      pushAttempt(spaced, 'nameLoose');
    }
  }

  for (const attempt of attempts) {
    if (!attempt.value) continue;
    const artist = await fetchArtist(attempt.value, attempt.mode, includeArtworks);
    if (artist) return { artist, resolvedFrom: 'slug' as const };
  }

  if (trimmed) {
    const tokens = trimmed.split(/-+/).map(part => part.trim()).filter(Boolean);
    for (const token of tokens) {
      const candidate = await prisma.artist.findFirst({
        where: {
          slug: { contains: token, mode: 'insensitive' },
        },
        select: buildArtistSelect(includeArtworks),
      } as any);
      if (candidate) return { artist: candidate, resolvedFrom: 'slug' as const };
    }

    const loose = trimmed.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    if (loose) {
      const byLooseName = await fetchArtist(loose, 'nameLoose', includeArtworks);
      if (byLooseName) return { artist: byLooseName, resolvedFrom: 'slug' as const };
    }
    const byId = await fetchArtist(trimmed, 'id', includeArtworks);
    if (byId) return { artist: byId, resolvedFrom: 'id' as const };
  }
  return null;
}

export default async function ArtistDetailPage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;


  const { handle } = params;
  const result = await resolveArtist(handle, true);

  if (!result) {
    notFound();
  }

  const { artist } = result as any;

  // Extract CMS Content
  let content: any = {};
  if (artist.userId) {
    const page = await prisma.artistPage.findUnique({
      where: { userId_key: { userId: artist.userId, key: 'profile' } },
      select: { publishedContent: true, draftContent: true }
    });
    content = page?.publishedContent || {};
  }

  return <ArtistProfileView artist={artist} content={content} />;
}



export async function generateMetadata(props: { params: Promise<{ handle: string }>, searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const handle = params.handle;
  if (!handle || typeof handle !== 'string') {
    return {} as any;
  }
  const resolved = await resolveArtist(handle, false);
  if (!resolved) return {} as any;
  const artist = resolved.artist;
  let meta: any = null;
  try {
    if (artist.userId) {
      let useDraft = false;
      const rawPrev = searchParams?.preview as any;
      const token = typeof rawPrev === 'string' ? rawPrev : (Array.isArray(rawPrev) ? rawPrev[0] : undefined);
      if (token) {
        const claims = verifyPreviewToken(token);
        if (claims && claims.sub === artist.userId && (claims.key || 'profile') === 'profile') useDraft = true;
      }
      const page = await prisma.artistPage.findUnique({ where: { userId_key: { userId: artist.userId, key: 'profile' } }, select: { draftContent: true, publishedContent: true } });
      const content = page ? (useDraft ? (page as any).draftContent : (page as any).publishedContent) : null;
      meta = (content as any)?.meta || null;
    }
  } catch { }
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
  const path = `/artistes/${artist.slug || artist.id}`;
  const title = (meta?.title && String(meta.title)) || `${artist.name} — Blue Cinis`;
  const description = (meta?.description && String(meta.description)) || (artist.biography ? String(artist.biography).slice(0, 160) : undefined);
  const canonical = (meta?.canonicalUrl && String(meta.canonicalUrl)) || (base ? `${base}${path}` : undefined);
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, url: canonical, images: artist.photoUrl ? [{ url: artist.photoUrl }] : undefined, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description, images: artist.photoUrl ? [artist.photoUrl] : undefined },
  } as any;
}
