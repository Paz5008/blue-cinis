import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';
import { ARTIST_SITEMAP_PAGE_SIZE, getSitemapBaseUrl } from '@/lib/sitemap';

export const revalidate = 3600;

export default async function artistsSitemapIndex(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSitemapBaseUrl();

  let artistCount = 0;
  try {
    artistCount = await prisma.artist.count({ where: { isActive: true } });
  } catch {
    return [];
  }

  if (artistCount <= ARTIST_SITEMAP_PAGE_SIZE) {
    return [];
  }

  const totalPages = Math.ceil(artistCount / ARTIST_SITEMAP_PAGE_SIZE);

  return Array.from({ length: totalPages }, (_, index) => ({
    url: `${baseUrl}/sitemaps/artistes/${index + 1}/sitemap.xml`,
  }));
}
