import { env } from '@/env';

export const ARTIST_SITEMAP_PAGE_SIZE = 5000;

export function getSitemapBaseUrl(): string {
  const domain = env.DOMAIN || env.NEXTAUTH_URL || 'https://blue-cinis.com';
  return domain.endsWith('/') ? domain.slice(0, -1) : domain;
}
