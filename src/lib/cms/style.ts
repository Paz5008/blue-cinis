import type { Block } from '@/types/cms';
import { normalizeCmsUrl } from '@/lib/url';
import { z } from 'zod';

export const STYLE_FIELD_SCHEMAS: Record<string, z.ZodTypeAny> = {
  margin: z.string(),
  marginTop: z.string(),
  marginBottom: z.string(),
  marginLeft: z.string(),
  marginRight: z.string(),
  padding: z.string(),
  paddingTop: z.string(),
  paddingBottom: z.string(),
  paddingLeft: z.string(),
  paddingRight: z.string(),
  background: z.string(),
  backgroundColor: z.string(),
  backgroundImage: z.string(),
  backgroundImageUrl: z.string(),
  backgroundSize: z.string(),
  backgroundSizeCustom: z.string(),
  backgroundPosition: z.string(),
  backgroundPositionCustom: z.string(),
  backgroundRepeat: z.string(),
  backgroundAttachment: z.string(),
  backgroundBlendMode: z.string(),
  overlayColor: z.string(),
  overlayOpacity: z.number(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  gradientDirection: z.string(),
  gradientMid: z.string(),
  gradientType: z.string(),
  parallax: z.boolean(),
  border: z.string(),
  borderColor: z.string(),
  borderWidth: z.string(),
  borderStyle: z.string(),
  borderRadius: z.string(),
  boxShadow: z.string(),
  gap: z.union([z.string(), z.number()]),
  display: z.string(),
  flex: z.string(),
  flexDirection: z.string(),
  justifyContent: z.string(),
  alignItems: z.string(),
  alignContent: z.string(),
  justifyItems: z.string(),
  textAlign: z.string(),
  position: z.string(),
  top: z.string(),
  right: z.string(),
  bottom: z.string(),
  left: z.string(),
  zIndex: z.union([z.string(), z.number()]),
  width: z.string(),
  height: z.string(),
  minWidth: z.string(),
  minHeight: z.string(),
  maxWidth: z.string(),
  maxHeight: z.string(),
  color: z.string(),
  fontFamily: z.string(),
  fontSize: z.string(),
  lineHeight: z.string(),
  letterSpacing: z.string(),
  fontWeight: z.string(),
  textTransform: z.string(),
  objectFit: z.string(),
  objectPosition: z.string(),
  overflow: z.string(),
  opacity: z.union([z.string(), z.number()]),
  filter: z.string(),
  transform: z.string(),
  transformOrigin: z.string(),
  transition: z.string(),
  hoverOpacity: z.number(),
  hoverScale: z.number(),
  hoverShadow: z.string(),
  hoverTransitionMs: z.number(),
  imageScale: z.number(),
  widthResp: z.object({
    desktop: z.string().optional(),
    mobile: z.string().optional(),
    tablet: z.string().optional(),
  }),
  canvasAlign: z.enum(['left', 'center', 'right']),
};

export const ALLOWED_STYLE_KEYS = new Set<keyof any>(Object.keys(STYLE_FIELD_SCHEMAS));

const sanitizePrimitive = (value: unknown) => {
  if (typeof value === 'string') return value.length <= 500 ? value : value.slice(0, 500);
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'boolean') return value;
  return undefined;
};

const normalizeAltText = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && !/^image\d+$/i.test(trimmed)) {
      return trimmed.slice(0, 160);
    }
  }
  return fallback;
};

export const sanitizeStyleObject = (style: any): Record<string, any> => {
  if (!style || typeof style !== 'object') return {};
  const safe: Record<string, any> = {};
  for (const key of Object.keys(style)) {
    if (!ALLOWED_STYLE_KEYS.has(key)) continue;
    const rawValue = (style as any)[key];
    if (typeof rawValue === 'string' && /url$/i.test(key)) {
      const safeUrl = normalizeCmsUrl(rawValue, { allowRelative: true, allowData: true });
      if (safeUrl) {
        safe[key] = safeUrl;
      }
      continue;
    }
    if (key === 'widthResp' && rawValue && typeof rawValue === 'object') {
      const desktop = sanitizePrimitive(rawValue.desktop);
      const mobile = sanitizePrimitive(rawValue.mobile);
      const tablet = sanitizePrimitive(rawValue.tablet);
      const widthResp: Record<string, any> = {};
      if (desktop !== undefined && desktop !== '') widthResp.desktop = desktop;
      if (mobile !== undefined && mobile !== '') widthResp.mobile = mobile;
      if (tablet !== undefined && tablet !== '') widthResp.tablet = tablet;
      if (Object.keys(widthResp).length > 0) safe.widthResp = widthResp;
      continue;
    }
    if (key === 'overlayOpacity' || key === 'hoverOpacity') {
      const num = Number(rawValue);
      if (Number.isFinite(num)) {
        safe[key] = Math.min(1, Math.max(0, num));
      }
      continue;
    }
    const value = sanitizePrimitive(rawValue);
    if (value !== undefined) {
      safe[key] = value;
    }
  }
  return safe;
};

export const sanitizeBlockStylesDeep = <T extends Block | any>(block: T): T => {
  if (!block || typeof block !== 'object') return block;
  const next: any = { ...block };
  if (next.style) {
    next.style = sanitizeStyleObject(next.style);
  }
  if (next.type === 'image') {
    const fallback = typeof next.caption === 'string' && next.caption.trim().length > 0 ? next.caption.trim() : 'Visuel artistique';
    next.altText = normalizeAltText(next.altText, fallback);
  }
  if (next.type === 'gallery' && Array.isArray(next.images)) {
    next.images = next.images.map((img: any, index: number) => {
      if (!img || typeof img !== 'object') return img;
      const fallback = typeof img.caption === 'string' && img.caption.trim().length > 0
        ? img.caption.trim()
        : `Visuel ${index + 1}`;
      return {
        ...img,
        altText: normalizeAltText(img.altText, fallback),
      };
    });
  }
  if (Array.isArray(next.children)) {
    next.children = next.children.map((child: any) => sanitizeBlockStylesDeep(child));
  }
  if (Array.isArray(next.columns)) {
    next.columns = next.columns.map((col: any) =>
      Array.isArray(col) ? col.map((child: any) => sanitizeBlockStylesDeep(child)) : col,
    );
  }
  return next;
};

/**
 * Composes the final React CSSProperties for a block, handling complex background logic
 * (gradients, overlays, images) and standardizing style properties.
 */
export const composeBlockStyle = (style: Record<string, any> = {}): React.CSSProperties => {
  const st: Record<string, any> = { ...(style || {}) };
  const layers: string[] = [];

  // Helper to calculate overlay color
  if (typeof st.overlayColor === "string" && st.overlayColor) {
    let alpha = typeof st.overlayOpacity === "number"
      ? Math.max(0, Math.min(1, st.overlayOpacity))
      : undefined;
    let color = st.overlayColor as string;

    // If alpha is provided and color is hex, convert to rgba
    if (alpha !== undefined && /^#/.test(color)) {
      const hex = color.replace("#", "");
      const bigint = parseInt(
        hex.length === 3 ? hex.split("").map((c: string) => c + c).join("") : hex,
        16
      );
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      color = `rgba(${r},${g},${b},${alpha})`;
    }
    layers.push(`linear-gradient(${color}, ${color})`);
  }

  // Gradient logic
  if (st.gradientFrom && st.gradientTo) {
    const dir = st.gradientDirection || "to bottom";
    const mid = st.gradientMid;
    if (st.gradientType === "radial") {
      const stops = mid
        ? `${st.gradientFrom}, ${mid}, ${st.gradientTo}`
        : `${st.gradientFrom}, ${st.gradientTo}`;
      layers.push(`radial-gradient(circle at center, ${stops})`);
    } else {
      const stops = mid
        ? `${st.gradientFrom}, ${mid}, ${st.gradientTo}`
        : `${st.gradientFrom}, ${st.gradientTo}`;
      layers.push(`linear-gradient(${dir}, ${stops})`);
    }
  }

  // Background Image
  if (st.backgroundImageUrl) layers.push(`url(${st.backgroundImageUrl})`);

  // Combine Layers
  if (layers.length > 0) {
    st.backgroundImage = layers.join(", ");
    if (st.blendMode) st.backgroundBlendMode = st.blendMode;

    st.backgroundSize = st.backgroundImageUrl
      ? st.backgroundSize === "custom"
        ? st.backgroundSizeCustom || "auto"
        : st.backgroundSize || "cover"
      : st.backgroundSize || undefined;

    st.backgroundPosition = st.backgroundImageUrl
      ? st.backgroundPosition === "custom"
        ? st.backgroundPositionCustom || "center"
        : st.backgroundPosition || "center"
      : st.backgroundPosition || undefined;

    st.backgroundRepeat = st.backgroundImageUrl
      ? st.backgroundRepeat || "no-repeat"
      : st.backgroundRepeat || undefined;

    if (st.parallax) st.backgroundAttachment = "fixed";
  }

  return st as React.CSSProperties;
};

import { getBlockPositionStyle } from '@/lib/cms/blockPositioning';

/**
 * Composes the full wrapper style for a block, combining:
 * 1. Absolute positioning (if x/y present)
 * 2. Visuals (Backgrounds, Border - via composeBlockStyle)
 * 3. Canvas Alignment (for Editor/Flow blocks)
 */
export const composeWrapperStyle = (block: Block, enableAbsolutePositioning: boolean = false): React.CSSProperties => {
  // 1. Get Base Visuals (Background, etc)
  const visualStyle = composeBlockStyle(block.style);

  // 2. Get Positioning (Absolute or standard flow dimensions)
  const posStyle = getBlockPositionStyle(block, enableAbsolutePositioning);

  // 3. Canvas Alignment (Margin Auto logic)
  // Only applies if not absolute and has width
  const alignStyle: React.CSSProperties = {};
  if (!posStyle.position || posStyle.position !== 'absolute') {
    const align = block.style?.canvasAlign as 'left' | 'center' | 'right' | undefined;
    if (block.style?.width || block.width) {
      if (align === 'center') { alignStyle.marginLeft = 'auto'; alignStyle.marginRight = 'auto'; }
      else if (align === 'right') { alignStyle.marginLeft = 'auto'; alignStyle.marginRight = undefined; }
      else { alignStyle.marginLeft = undefined; alignStyle.marginRight = undefined; }
    }
  }

  // Debug: Ensure zIndex is respected from block root if present
  const zIndexStyle = block.zIndex !== undefined ? { zIndex: block.zIndex } : {};

  return {
    ...visualStyle,
    ...posStyle,
    ...alignStyle,
    ...zIndexStyle,
    // Ensure width/height from block root override style if present (standardizing on root props for dims)
    ...(block.width ? { width: block.width } : {}),
    ...(block.height ? { height: block.height } : {}),
  } as React.CSSProperties;
};

/**
 * Resolves a CMS dimension value (which can be a number representing %, or a 'px' string)
 * into a concrete pixel value relative to a container size.
 */
export const resolveMeasurement = (value: number | string | undefined, containerSize: number, defaultSize = 50): number => {
  if (typeof value === 'number') {
    // Return raw number as pixels (standardized behavior for drag checks)
    return value;
  }
  if (typeof value === 'string' && value.endsWith('px')) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultSize : parsed;
  }
  // Fallback or explicit % string
  if (typeof value === 'string' && value.endsWith('%')) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultSize : (parsed / 100) * containerSize;
  }
  return defaultSize;
};
