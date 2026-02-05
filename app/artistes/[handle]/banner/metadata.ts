import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyPreviewToken } from '@/lib/previewToken';

type BannerMetadataProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

type PageMeta = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
};

const extractMeta = (content: Prisma.JsonValue | null | undefined): PageMeta | null => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const meta = (content as Record<string, unknown>).meta;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const metaRecord = meta as Record<string, unknown>;
  const normalized: PageMeta = {};
  if (typeof metaRecord.title === 'string') normalized.title = metaRecord.title;
  if (typeof metaRecord.description === 'string') normalized.description = metaRecord.description;
  if (typeof metaRecord.canonicalUrl === 'string') normalized.canonicalUrl = metaRecord.canonicalUrl;
  return Object.keys(normalized).length ? normalized : null;
};

const firstValue = (value?: string | string[]): string | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

export async function generateMetadata({ params, searchParams }: BannerMetadataProps): Promise<Metadata> {
  const artist = await prisma.artist.findUnique({ where: { id: params.id } });
  if (!artist) return {};

  let meta: PageMeta | null = null;
  if (artist.userId) {
    const previewToken = firstValue(searchParams?.preview);
    const claims = previewToken ? verifyPreviewToken(previewToken) : null;
    const useDraft = !!(claims && claims.sub === artist.userId && (claims.key ?? 'banner') === 'banner');
    const page = await prisma.artistPage.findUnique({
      where: { userId_key: { userId: artist.userId, key: 'banner' } },
      select: { draftContent: true, publishedContent: true },
    });
    meta = extractMeta(useDraft ? page?.draftContent : page?.publishedContent);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
  const path = `/artistes/${artist.id}/banner`;
  const title = meta?.title || `${artist.name ?? ''} — Bandeau`;
  const description = meta?.description;
  const canonical = meta?.canonicalUrl || (baseUrl ? `${baseUrl}${path}` : undefined);
  const images = artist.photoUrl ? [{ url: artist.photoUrl }] : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, url: canonical, images, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}
