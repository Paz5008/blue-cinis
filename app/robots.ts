import type { MetadataRoute } from 'next';

import { getSitemapBaseUrl } from '@/lib/sitemap';

export default function robots(): MetadataRoute.Robots {
  const base = getSitemapBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: [`${base}/sitemap.xml`, `${base}/sitemaps/artistes/sitemap.xml`],
    host: base,
  };
}
