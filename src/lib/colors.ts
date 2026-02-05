export type RgbColor = { r: number; g: number; b: number };

const HEX_SHORT = /^#([0-9a-f]{3})$/i;
const HEX_LONG = /^#([0-9a-f]{6})$/i;
const HEX_ALPHA = /^#([0-9a-f]{8})$/i;
const RGB = /^rgba?\(([^)]+)\)$/i;

/**
 * Parse a CSS color string (#rgb[a], rgb[a]()) into an RGB object.
 * Returns null when parsing fails so callers can gracefully fallback.
 */
export function parseColorToRgb(value?: string | null): RgbColor | null {
  if (!value || typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const short = raw.match(HEX_SHORT);
  if (short) {
    const expanded = short[1]
      .split("")
      .map((char) => char + char)
      .join("");
    const r = Number.parseInt(expanded.slice(0, 2), 16);
    const g = Number.parseInt(expanded.slice(2, 4), 16);
    const b = Number.parseInt(expanded.slice(4, 6), 16);
    return { r, g, b };
  }

  const long = raw.match(HEX_LONG);
  if (long) {
    const hex = long[1];
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }

  const withAlpha = raw.match(HEX_ALPHA);
  if (withAlpha) {
    const hex = withAlpha[1];
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }

  const rgb = raw.match(RGB);
  if (rgb) {
    const [r, g, b] = rgb[1]
      .split(",")
      .map((part) => Number(part.trim()))
      .slice(0, 3);
    if ([r, g, b].every((channel) => Number.isFinite(channel))) {
      return { r, g, b };
    }
  }

  return null;
}

/**
 * Compute relative luminance according to WCAG 2.1.
 */
export function relativeLuminance({ r, g, b }: RgbColor): number {
  const normalize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  const R = normalize(r);
  const G = normalize(g);
  const B = normalize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Return contrast ratio between two colors (>=1) or null when computation fails.
 */
export function getContrastRatio(colorA?: string | null, colorB?: string | null): number | null {
  if (!colorA || !colorB) return null;
  const parsedA = parseColorToRgb(colorA);
  const parsedB = parseColorToRgb(colorB);
  if (!parsedA || !parsedB) return null;
  const lumA = relativeLuminance(parsedA);
  const lumB = relativeLuminance(parsedB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return (brightest + 0.05) / (darkest + 0.05);
}

