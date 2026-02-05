import sanitizeHtml from 'sanitize-html';
import { normalizeCmsUrl } from './url';

export type PageKey = 'profile' | 'poster' | 'banner' | string;

// Build sanitize-html options depending on public page type
const sanitizeHref = (href?: string): string | undefined =>
  normalizeCmsUrl(href, { allowRelative: true, allowData: false, allowMailto: true });

export function getSanitizeOptions(page: PageKey): any {
  const colorHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const colorRgb = /^rgb(a)?\([0-9.,\s]+\)$/i;
  const baseTags = ['b', 'i', 'em', 'strong', 'u', 's', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'];
  // Banner: ultra minimal (petit bandeau public)
  const bannerTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'a', 'h1', 'h2', 'h3'];

  /* eslint-disable no-useless-escape */
  const commonStyles = {
    color: [colorHex, colorRgb],
    'background-color': [colorHex, colorRgb, 'transparent'],
    'background-image': [/^url\(['"]?https:\/\/.+['"]?\)$/i], // Allow safe HTTPS images
    'text-align': [/^(left|right|center|justify)$/],
    'font-size': [/^\d+(px|em|rem|%)$/],
    'font-weight': [/^(normal|bold|[1-9]00)$/],
    'font-style': [/^(normal|italic|oblique)$/],
    'text-decoration': [/^(none|underline|line-through)$/],
    // Free-Form / Antigravity Support
    'position': [/^(static|relative|absolute|fixed|sticky)$/],
    'top': [/^-?\d+(px|%|em|rem|vh|vw|calc\(.+\))$/],
    'left': [/^-?\d+(px|%|em|rem|vh|vw|calc\(.+\))$/],
    'right': [/^-?\d+(px|%|em|rem|vh|vw|calc\(.+\))$/],
    'bottom': [/^-?\d+(px|%|em|rem|vh|vw|calc\(.+\))$/],
    'width': [/^\d+(px|%|em|rem|vh|vw|auto)$/],
    'height': [/^\d+(px|%|em|rem|vh|vw|auto)$/],
    'z-index': [/^-?\d+$/],
    'transform': [/[^;]+/], // Permissive but checked by browser parser usually
    'opacity': [/^[0-1](\.\d+)?$/],
    'overflow': [/^(visible|hidden|scroll|auto)$/],
    'border-radius': [/[^;]+/],
    'box-shadow': [/[^;]+/]
  };

  const iframeAllowed = page !== 'banner'; // No iframes in banners
  const allowedTags = [...(page === 'banner' ? bannerTags : baseTags), ...(iframeAllowed ? ['iframe'] : [])];

  return {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder'],
      '*': ['style', 'class', 'id'], // Allow class/id for advanced styling
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com', 'soundcloud.com'],
    allowProtocolRelative: false, // Strict on protocol
    allowedStyles: {
      '*': commonStyles,
    },
    transformTags: {
      a: (tagName: string, attribs: Record<string, string>) => {
        const href = sanitizeHref(attribs.href);
        const attrs: Record<string, string> = {};
        if (href) attrs.href = href;
        if (attribs.title) {
          const title = attribs.title.trim().slice(0, 120);
          if (title) attrs.title = title;
        }
        attrs.rel = 'noopener noreferrer';
        if (attribs.target === '_blank') {
          attrs.target = '_blank';
        }
        return {
          tagName: 'a',
          attribs: attrs,
        };
      },
    },
  };
}

export function sanitizeTextHtml(html: string, page: PageKey = 'profile'): string {
  return sanitizeHtml(html || '', getSanitizeOptions(page));
}
