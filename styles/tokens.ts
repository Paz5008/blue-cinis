export const colors = {
  backgroundCanvas: "var(--color-bg-canvas)",
  backgroundSubtle: "var(--color-bg-subtle)",
  textHeading: "var(--color-text-heading)",
  textBody: "var(--color-text-body)",
  textBodySubtle: "var(--color-text-body-subtle)",
  iconSubtle: "var(--color-icon-subtle)",
  accent: "var(--color-accent)",
  accentHover: "var(--color-accent-hover)",
  accentContrast: "var(--color-accent-contrast)",
  accentFocus: "var(--color-accent-focus)",
  surfaceGlass: "var(--color-surface-glass)",
  surfaceStrong: "var(--color-surface-strong)",
  surfaceMuted: "var(--color-surface-muted)",
  surfaceBorderSoft: "var(--color-surface-border-soft)",
  surfaceBorderStrong: "var(--color-surface-border-strong)",
} as const;

export const spacing = {
  space8: "var(--space-8)",
  space12: "var(--space-12)",
  space16: "var(--space-16)",
  space24: "var(--space-24)",
  space32: "var(--space-32)",
  space40: "var(--space-40)",
  space48: "var(--space-48)",
  space64: "var(--space-64)",
} as const;

export const radii = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  pill: "var(--radius-pill)",
  full: "var(--radius-full)",
} as const;

export const shadows = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
} as const;

export const gradients = {
  heroOverlay: "var(--gradient-hero-overlay)",
  artistPattern: "var(--gradient-artist-pattern)",
  artworksAccent: "var(--gradient-artworks-accent)",
} as const;

export const timings = {
  fast: "var(--time-fast)",
  medium: "var(--time-medium)",
  slow: "var(--time-slow)",
} as const;

export type TokenGroup<T extends Record<string, string>> = T;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Shadows = typeof shadows;
export type Gradients = typeof gradients;
export type Timings = typeof timings;

export const tokens = {
  colors,
  spacing,
  radii,
  shadows,
  gradients,
  timings,
} as const;

export type DesignTokens = typeof tokens;