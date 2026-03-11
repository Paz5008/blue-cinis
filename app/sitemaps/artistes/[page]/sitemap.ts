import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';
import { ARTIST_SITEMAP_PAGE_SIZE, getSitemapBaseUrl } from '@/lib/sitemap';

export const revalidate = 3600;

export default async function artistsSitemap({ params }: { params: { page: string } }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSitemapBaseUrl();
  const pageNumber = Number(params.page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return [];
  }

  try {
    const artists = await prisma.artist.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      skip: (pageNumber - 1) * ARTIST_SITEMAP_PAGE_SIZE,
      take: ARTIST_SITEMAP_PAGE_SIZE,
    });

    if (artists.length === 0) {
      return [];
    }

    return artists.map((artist) => ({
      url: `${baseUrl}/artistes/${artist.slug || artist.id}`,
      lastModified: artist.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}
