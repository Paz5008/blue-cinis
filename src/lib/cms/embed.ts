import type { EmbedBlock } from '@/types/cms';

export type EmbedProvider = 'youtube' | 'vimeo' | 'soundcloud';

const HOST_PROVIDER_MAP: Record<string, EmbedProvider> = {
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'm.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'vimeo.com': 'vimeo',
  'www.vimeo.com': 'vimeo',
  'player.vimeo.com': 'vimeo',
  'soundcloud.com': 'soundcloud',
  'www.soundcloud.com': 'soundcloud',
  'w.soundcloud.com': 'soundcloud',
  'api.soundcloud.com': 'soundcloud',
  'player.soundcloud.com': 'soundcloud',
};

const normaliseHost = (host: string) => host.replace(/^www\./, '').toLowerCase();

export const resolveEmbedProvider = (rawUrl: string | undefined | null): EmbedProvider | undefined => {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    const host = normaliseHost(url.hostname);
    if (HOST_PROVIDER_MAP[host]) return HOST_PROVIDER_MAP[host];
    return undefined;
  } catch {
    return undefined;
  }
};

const extractYouTubeId = (url: URL): string | null => {
  if (url.hostname.includes('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id || null;
  }
  if (url.pathname.startsWith('/embed/')) {
    const id = url.pathname.split('/')[2];
    return id || null;
  }
  const id = url.searchParams.get('v');
  return id || null;
};

const extractVimeoId = (url: URL): string | null => {
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts.pop();
  if (!id) return null;
  return /^\d+$/.test(id) ? id : null;
};

export const buildEmbedUrl = (rawUrl: string, provider?: EmbedProvider): string | null => {
  if (!rawUrl) return null;
  let resolved: EmbedProvider | undefined = provider;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    resolved = resolved ?? resolveEmbedProvider(rawUrl);
  } catch {
    return null;
  }
  if (!resolved) return null;

  switch (resolved) {
    case 'youtube': {
      const id = extractYouTubeId(parsed);
      if (!id) return null;
      const params = new URLSearchParams();
      if (parsed.searchParams.get('t')) params.set('start', parsed.searchParams.get('t')!.replace(/\D/g, ''));
      params.set('rel', '0');
      params.set('modestbranding', '1');
      const query = params.toString();
      return `https://www.youtube.com/embed/${id}${query ? `?${query}` : ''}`;
    }
    case 'vimeo': {
      const id = extractVimeoId(parsed);
      if (!id) return null;
      const params = new URLSearchParams();
      params.set('byline', '0');
      params.set('portrait', '0');
      params.set('dnt', '1');
      return `https://player.vimeo.com/video/${id}?${params.toString()}`;
    }
    case 'soundcloud': {
      const params = new URLSearchParams();
      params.set('url', rawUrl);
      params.set('color', '#ff5500');
      params.set('inverse', 'false');
      params.set('auto_play', 'false');
      params.set('show_user', 'true');
      return `https://w.soundcloud.com/player/?${params.toString()}`;
    }
    default:
      return null;
  }
};

export const isEmbedUrlAllowed = (rawUrl: string | undefined | null): boolean =>
  resolveEmbedProvider(rawUrl || '') !== undefined;

export const sanitizeEmbedBlock = (block: EmbedBlock): EmbedBlock | null => {
  const url = typeof block.url === 'string' ? block.url.trim() : '';
  if (!url || !isEmbedUrlAllowed(url)) return null;
  const provider = block.provider || resolveEmbedProvider(url);
  const embedUrl = buildEmbedUrl(url, provider);
  if (!embedUrl) return null;

  return {
    ...block,
    url,
    provider,
    allowFullscreen: block.allowFullscreen !== false,
    aspectRatio: block.aspectRatio || '16:9',
    width: block.width || '100%',
    height: block.height,
    thumbnailUrl: block.thumbnailUrl || undefined,
  };
};

