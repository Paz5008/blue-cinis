import { prisma } from '@/lib/prisma';
import type { MetadataRoute } from 'next';

import { ARTIST_SITEMAP_PAGE_SIZE, getSitemapBaseUrl } from '@/lib/sitemap';
import { buildArtworkPath } from '@/lib/artworkSlug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSitemapBaseUrl();
  const staticUrls: MetadataRoute.Sitemap = [
    '',
    '/galerie',
    '/artistes',
    '/contact',
    '/mentions-legales',
  ].map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 }));

  let artworks: { id: string; title: string; updatedAt: Date }[] = [];
  let artists: { id: string; slug: string | null; updatedAt: Date }[] = [];
  let artistCount = 0;
  let artistSitemapEntries: MetadataRoute.Sitemap = [];

  try {
    const [artworkData, count] = await Promise.all([
      prisma.artwork.findMany({ select: { id: true, title: true, updatedAt: true } }),
      prisma.artist.count({ where: { isActive: true } }),
    ]);

    artworks = artworkData;
    artistCount = count;

    if (artistCount > 0 && artistCount <= ARTIST_SITEMAP_PAGE_SIZE) {
      artists = await prisma.artist.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (artistCount > ARTIST_SITEMAP_PAGE_SIZE) {
      const totalPages = Math.ceil(artistCount / ARTIST_SITEMAP_PAGE_SIZE);
      const paginatedEntries: MetadataRoute.Sitemap = Array.from({ length: totalPages }, (_, index) =>
        ({
          url: `${baseUrl}/sitemaps/artistes/${index + 1}/sitemap.xml`,
          changeFrequency: 'daily',
          priority: 0.3,
        } satisfies MetadataRoute.Sitemap[number]),
      );
      const indexEntry: MetadataRoute.Sitemap[number] = {
        url: `${baseUrl}/sitemaps/artistes/sitemap.xml`,
        changeFrequency: 'daily',
        priority: 0.4,
      };
      artistSitemapEntries = [indexEntry, ...paginatedEntries];
    }
  } catch {
    return staticUrls;
  }

  const artworkUrls: MetadataRoute.Sitemap = artworks.map((a) => ({
    url: `${baseUrl}${buildArtworkPath({ id: a.id, title: a.title })}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const artistUrls: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${baseUrl}/artistes/${a.slug || a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return artistCount > ARTIST_SITEMAP_PAGE_SIZE
    ? [...staticUrls, ...artworkUrls, ...artistSitemapEntries]
    : [...staticUrls, ...artworkUrls, ...artistUrls];
}
