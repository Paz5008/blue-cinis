import type { ThemeConfig } from '@/types/cms';

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  tone: 'light' | 'dark' | 'contrast';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    accent: string;
    accentAlt: string;
    border: string;
  };
  gradients?: {
    hero?: string;
    accent?: string;
    overlay?: string;
  };
}

export interface TypographyPreset {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  ramps: {
    h1: { fontSize: string; lineHeight: string; letterSpacing?: string; fontWeight?: string };
    h2: { fontSize: string; lineHeight: string; letterSpacing?: string; fontWeight?: string };
    h3: { fontSize: string; lineHeight: string; letterSpacing?: string; fontWeight?: string };
    kicker: { fontSize: string; letterSpacing: string; fontWeight: string; textTransform: 'uppercase' | 'none' };
    lead: { fontSize: string; lineHeight: string };
    body: { fontSize: string; lineHeight: string };
    caption: { fontSize: string; lineHeight: string; letterSpacing?: string };
    button: { fontSize: string; letterSpacing?: string; fontWeight?: string };
  };
}

export interface SpacingPreset {
  id: 'compact' | 'balanced' | 'airy';
  name: string;
  description: string;
  scale: number[];
  sectionPadding: { tight: string; regular: string; spacious: string; hero: string };
  gap: { xs: string; sm: string; md: string; lg: string; xl: string };
}

export interface SurfaceStyleTokens {
  id: 'rounded' | 'soft' | 'sharp' | 'pill';
  name: string;
  description: string;
  radii: { xs: string; sm: string; md: string; lg: string; pill: string };
  shadows: { soft: string; medium: string; strong: string };
  border: { subtle: string; focus: string };
}

export interface ThemeStylePreset {
  id: string;
  name: string;
  description: string;
  badge?: string;
  colorPresetId: string;
  typographyPresetId: string;
  spacingPresetId: SpacingPreset['id'];
  surfaceStyleId: SurfaceStyleTokens['id'];
  recommendedTone?: 'light' | 'dark' | 'contrast';
}

export interface ThemeTokens {
  palette: PalettePreset;
  typography: TypographyPreset;
  spacing: SpacingPreset;
  surfaces: SurfaceStyleTokens;
  tone: 'light' | 'dark' | 'contrast';
  surfaceBackground: string;
  cardBackground: string;
  overlayColor: string;
  overlayOpacity: number;
  gradientHero?: string;
  gradientAccent?: string;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'cinis-editorial',
    name: 'Cinis Editorial',
    description: 'Bleus profonds et or patiné pour une ambiance magazine premium.',
    tone: 'dark',
    colors: {
      primary: '#1d3b62',
      secondary: '#f0b429',
      background: '#0f172a',
      surface: '#16233b',
      surfaceAlt: '#192b46',
      text: '#f8fafc',
      textMuted: '#cbd5f5',
      accent: '#2dd4bf',
      accentAlt: '#22d3ee',
      border: 'rgba(241,245,249,0.12)',
    },
    gradients: {
      hero: 'linear-gradient(135deg, #1d3b62 0%, #0f172a 48%, #312e81 100%)',
      accent: 'linear-gradient(120deg, #f0b429 0%, #fde68a 100%)',
      overlay: 'rgba(15,23,42,0.55)',
    },
  },
  {
    id: 'atelier-haze',
    name: 'Atelier Haze',
    description: 'Voile pastel et lumière diffuse pour scénographies matières.',
    tone: 'light',
    colors: {
      primary: '#d97706',
      secondary: '#fb923c',
      background: '#f6f2ed',
      surface: '#fdf8f1',
      surfaceAlt: '#f2e9df',
      text: '#2a1f15',
      textMuted: '#6b503d',
      accent: '#14b8a6',
      accentAlt: '#0ea5e9',
      border: 'rgba(105,81,62,0.16)',
    },
    gradients: {
      hero: 'linear-gradient(135deg, #ffd7ba 0%, #fbcfe8 45%, #bfdbfe 100%)',
      accent: 'linear-gradient(120deg, #c084fc 0%, #f472b6 100%)',
      overlay: 'rgba(255,255,255,0.45)',
    },
  },
  {
    id: 'chromatic-neon',
    name: 'Chromatic Neon',
    description: 'Contraste pop et énergie digitale pour collaborations contemporaines.',
    tone: 'contrast',
    colors: {
      primary: '#0ea5e9',
      secondary: '#f97316',
      background: '#0b1120',
      surface: '#111827',
      surfaceAlt: '#1f2937',
      text: '#fdf4ff',
      textMuted: '#cbd5f5',
      accent: '#a855f7',
      accentAlt: '#f472b6',
      border: 'rgba(148,163,184,0.25)',
    },
    gradients: {
      hero: 'radial-gradient(circle at 20% -10%, rgba(14,165,233,0.65), transparent 55%), radial-gradient(circle at 80% 0%, rgba(249,115,22,0.55), transparent 60%), linear-gradient(180deg, rgba(8,47,73,0.85) 0%, rgba(15,23,42,0.95) 100%)',
      accent: 'linear-gradient(120deg, #0ea5e9 0%, #a855f7 45%, #f472b6 100%)',
      overlay: 'rgba(8,47,73,0.45)',
    },
  },
  {
    id: 'white-cube',
    name: 'White Cube',
    description: 'Minimalisme lumineux inspiré des galeries contemporaines.',
    tone: 'light',
    colors: {
      primary: '#111827',
      secondary: '#475569',
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceAlt: '#e2e8f0',
      text: '#0f172a',
      textMuted: '#475569',
      accent: '#2563eb',
      accentAlt: '#a855f7',
      border: 'rgba(148,163,184,0.25)',
    },
    gradients: {
      hero: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(226,232,240,0.85) 100%)',
      accent: 'linear-gradient(120deg, #2563eb 0%, #38bdf8 100%)',
      overlay: 'rgba(15,23,42,0.35)',
    },
  },
  {
    id: 'tech-startup',
    name: 'Tech & Startup',
    description: 'Style moderne et dynamique pour startups, SaaS et entreprises tech.',
    tone: 'dark',
    colors: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      background: '#0a0a0f',
      surface: '#1a1a2e',
      surfaceAlt: '#23233e',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      accent: '#22d3ee',
      accentAlt: '#38bdf8',
      border: 'rgba(99,102,241,0.25)',
    },
    gradients: {
      hero: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #4f46e5 100%)',
      accent: 'linear-gradient(120deg, #6366f1 0%, #22d3ee 100%)',
      overlay: 'rgba(10,10,15,0.65)',
    },
  },
];

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'editorial-elegance',
    name: 'Editorial Élégance',
    description: 'Titres serif expressifs et corps humaniste.',
    headingFont: `'Playfair Display', 'Cormorant Garamond', serif`,
    bodyFont: `'Source Sans Pro', 'Work Sans', sans-serif`,
    ramps: {
      h1: { fontSize: '3rem', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' },
      h2: { fontSize: '2.25rem', lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' },
      h3: { fontSize: '1.5rem', lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '500' },
      kicker: { fontSize: '0.85rem', letterSpacing: '0.32em', fontWeight: '600', textTransform: 'uppercase' },
      lead: { fontSize: '1.25rem', lineHeight: '1.7' },
      body: { fontSize: '1rem', lineHeight: '1.8' },
      caption: { fontSize: '0.82rem', lineHeight: '1.4', letterSpacing: '0.05em' },
      button: { fontSize: '0.95rem', letterSpacing: '0.04em', fontWeight: '600' },
    },
  },
  {
    id: 'art-grotesk',
    name: 'Art Grotesk',
    description: 'Sans-serif structurée pour univers minimal et contemporain.',
    headingFont: `'Space Grotesk', 'Helvetica Neue', sans-serif`,
    bodyFont: `'Inter', system-ui, sans-serif`,
    ramps: {
      h1: { fontSize: '2.8rem', lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '600' },
      h2: { fontSize: '2rem', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' },
      h3: { fontSize: '1.35rem', lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' },
      kicker: { fontSize: '0.78rem', letterSpacing: '0.28em', fontWeight: '500', textTransform: 'uppercase' },
      lead: { fontSize: '1.1rem', lineHeight: '1.7' },
      body: { fontSize: '1rem', lineHeight: '1.65' },
      caption: { fontSize: '0.8rem', lineHeight: '1.35', letterSpacing: '0.08em' },
      button: { fontSize: '0.95rem', letterSpacing: '0.1em', fontWeight: '600' },
    },
  },
  {
    id: 'raku-display',
    name: 'Raku Display',
    description: 'Titres sculpturaux et corps élargi pour scénographies matières.',
    headingFont: `'Fraunces', 'Times New Roman', serif`,
    bodyFont: `'Work Sans', 'Gill Sans', sans-serif`,
    ramps: {
      h1: { fontSize: '3.1rem', lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '650' },
      h2: { fontSize: '2.3rem', lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' },
      h3: { fontSize: '1.45rem', lineHeight: '1.28', letterSpacing: '-0.01em', fontWeight: '500' },
      kicker: { fontSize: '0.82rem', letterSpacing: '0.38em', fontWeight: '600', textTransform: 'uppercase' },
      lead: { fontSize: '1.18rem', lineHeight: '1.75' },
      body: { fontSize: '1.02rem', lineHeight: '1.82' },
      caption: { fontSize: '0.78rem', lineHeight: '1.35', letterSpacing: '0.06em' },
      button: { fontSize: '1rem', letterSpacing: '0.08em', fontWeight: '600' },
    },
  },
  {
    id: 'nocturne-futura',
    name: 'Nocturne Futura',
    description: 'Couple un display futuriste et un corps géométrique pour univers nocturnes.',
    headingFont: `'Syncopate', 'Futura', sans-serif`,
    bodyFont: `'Roboto', 'Inter', sans-serif`,
    ramps: {
      h1: { fontSize: '2.9rem', lineHeight: '1.08', letterSpacing: '0.08em', fontWeight: '600' },
      h2: { fontSize: '2.1rem', lineHeight: '1.16', letterSpacing: '0.06em', fontWeight: '600' },
      h3: { fontSize: '1.4rem', lineHeight: '1.32', letterSpacing: '0.05em', fontWeight: '600' },
      kicker: { fontSize: '0.8rem', letterSpacing: '0.42em', fontWeight: '700', textTransform: 'uppercase' },
      lead: { fontSize: '1.15rem', lineHeight: '1.65' },
      body: { fontSize: '0.98rem', lineHeight: '1.7' },
      caption: { fontSize: '0.76rem', lineHeight: '1.3', letterSpacing: '0.14em' },
      button: { fontSize: '0.92rem', letterSpacing: '0.18em', fontWeight: '700' },
    },
  },
  {
    id: 'tech-grotesk',
    name: 'Tech Grotesk',
    description: 'Minimalisme technologique et efficacité digitale.',
    headingFont: `'Space Grotesk', 'Helvetica Neue', sans-serif`,
    bodyFont: `'Inter', system-ui, sans-serif`,
    ramps: {
      h1: { fontSize: '3.2rem', lineHeight: '1.1', letterSpacing: '-0.05em', fontWeight: '700' },
      h2: { fontSize: '2.4rem', lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '600' },
      h3: { fontSize: '1.6rem', lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' },
      kicker: { fontSize: '0.85rem', letterSpacing: '0.25em', fontWeight: '600', textTransform: 'uppercase' },
      lead: { fontSize: '1.25rem', lineHeight: '1.6' },
      body: { fontSize: '1rem', lineHeight: '1.7' },
      caption: { fontSize: '0.875rem', lineHeight: '1.4', letterSpacing: '0.02em' },
      button: { fontSize: '1rem', letterSpacing: '0.05em', fontWeight: '600' },
    },
  },
];

export const SPACING_PRESETS: SpacingPreset[] = [
  {
    id: 'compact',
    name: 'Rythme serré',
    description: 'Pour pages richement denses et catalogues.',
    scale: [4, 8, 16, 20, 24, 32],
    sectionPadding: { tight: '1.5rem', regular: '2.25rem', spacious: '2.75rem', hero: '3.5rem' },
    gap: { xs: '0.4rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2.25rem' },
  },
  {
    id: 'balanced',
    name: 'Rythme équilibré',
    description: 'Équilibre storytelling et respirations visuelles.',
    scale: [6, 12, 20, 28, 36, 48],
    sectionPadding: { tight: '2rem', regular: '2.8rem', spacious: '3.4rem', hero: '4.6rem' },
    gap: { xs: '0.6rem', sm: '1rem', md: '1.4rem', lg: '2rem', xl: '3rem' },
  },
  {
    id: 'airy',
    name: 'Rythme ample',
    description: 'Pour portfolios immersifs et expériences luxueuses.',
    scale: [8, 16, 24, 36, 48, 64],
    sectionPadding: { tight: '2.4rem', regular: '3.6rem', spacious: '4.6rem', hero: '6rem' },
    gap: { xs: '0.75rem', sm: '1.25rem', md: '1.75rem', lg: '2.5rem', xl: '3.75rem' },
  },
];

export const SURFACE_PRESETS: SurfaceStyleTokens[] = [
  {
    id: 'rounded',
    name: 'Angles arrondis',
    description: 'Arrondis généreux et ombres moelleuses.',
    radii: { xs: '10px', sm: '14px', md: '18px', lg: '26px', pill: '999px' },
    shadows: {
      soft: '0 12px 28px rgba(15,23,42,0.12)',
      medium: '0 20px 48px rgba(15,23,42,0.16)',
      strong: '0 30px 70px rgba(12,10,9,0.32)',
    },
    border: { subtle: '1px solid rgba(15,23,42,0.08)', focus: '1px solid rgba(37,99,235,0.85)' },
  },
  {
    id: 'soft',
    name: 'Angles doux',
    description: 'Rayon léger pour un rendu pro et polyvalent.',
    radii: { xs: '6px', sm: '10px', md: '14px', lg: '18px', pill: '999px' },
    shadows: {
      soft: '0 10px 26px rgba(15,23,42,0.1)',
      medium: '0 16px 40px rgba(15,23,42,0.14)',
      strong: '0 24px 60px rgba(15,23,42,0.2)',
    },
    border: { subtle: '1px solid rgba(15,23,42,0.08)', focus: '1px solid rgba(59,130,246,0.75)' },
  },
  {
    id: 'sharp',
    name: 'Angles nets',
    description: 'Silhouette architecturale et lignes franches.',
    radii: { xs: '0px', sm: '2px', md: '4px', lg: '6px', pill: '999px' },
    shadows: {
      soft: '0 12px 24px rgba(15,23,42,0.14)',
      medium: '0 18px 42px rgba(15,23,42,0.18)',
      strong: '0 26px 66px rgba(15,23,42,0.26)',
    },
    border: { subtle: '1px solid rgba(15,23,42,0.14)', focus: '1px solid rgba(14,165,233,0.85)' },
  },
  {
    id: 'pill',
    name: 'Pill sculpté',
    description: 'Pour boutons et badges ultra arrondis, look signature.',
    radii: { xs: '16px', sm: '22px', md: '28px', lg: '34px', pill: '999px' },
    shadows: {
      soft: '0 16px 40px rgba(15,23,42,0.22)',
      medium: '0 24px 55px rgba(15,23,42,0.28)',
      strong: '0 36px 80px rgba(15,23,42,0.36)',
    },
    border: { subtle: '1px solid rgba(255,255,255,0.35)', focus: '1px solid rgba(251,191,36,0.85)' },
  },
];

export const THEME_STYLE_PRESETS: ThemeStylePreset[] = [
  {
    id: 'editorial-galerie',
    name: 'Éditorial Galerie',
    description: 'Look magazine haut de gamme, idéal pour profils narratifs.',
    badge: 'Nouveau',
    colorPresetId: 'cinis-editorial',
    typographyPresetId: 'editorial-elegance',
    spacingPresetId: 'balanced',
    surfaceStyleId: 'rounded',
    recommendedTone: 'dark',
  },
  {
    id: 'atelier-chaleur',
    name: 'Atelier Chaleur',
    description: 'Textures soleil et typographies tactiles pour montrer la matière.',
    colorPresetId: 'atelier-haze',
    typographyPresetId: 'raku-display',
    spacingPresetId: 'airy',
    surfaceStyleId: 'soft',
    recommendedTone: 'light',
  },
  {
    id: 'galerie-minimal',
    name: 'Galerie Minimal',
    description: 'Sobriété lumineuse, idéal pour portfolios photographiques.',
    colorPresetId: 'white-cube',
    typographyPresetId: 'art-grotesk',
    spacingPresetId: 'balanced',
    surfaceStyleId: 'soft',
    recommendedTone: 'light',
  },
  {
    id: 'nocturne-digital',
    name: 'Nocturne Digital',
    description: 'Contrastes pop et esprit collaboration luxe/digitale.',
    badge: 'Coup de cœur',
    colorPresetId: 'chromatic-neon',
    typographyPresetId: 'nocturne-futura',
    spacingPresetId: 'compact',
    surfaceStyleId: 'sharp',
    recommendedTone: 'contrast',
  },
  {
    id: 'tech-startup',
    name: 'Tech & Startup',
    description: 'Immersion technologique, parfait pour l\'innovation.',
    badge: 'Nouveau',
    colorPresetId: 'tech-startup',
    typographyPresetId: 'tech-grotesk',
    spacingPresetId: 'airy',
    surfaceStyleId: 'soft',
    recommendedTone: 'dark',
  },
];

const paletteMap = new Map(PALETTE_PRESETS.map(p => [p.id, p]));
const typeMap = new Map(TYPOGRAPHY_PRESETS.map(p => [p.id, p]));
const spacingMap = new Map(SPACING_PRESETS.map(p => [p.id, p]));
const surfaceMap = new Map(SURFACE_PRESETS.map(p => [p.id, p]));
const styleMap = new Map(THEME_STYLE_PRESETS.map(p => [p.id, p]));

const DEFAULT_STYLE = THEME_STYLE_PRESETS[0];

export function resolveThemeTokens(theme: ThemeConfig): ThemeTokens {
  const baseStyle = styleMap.get(theme.stylePresetId || '') ?? DEFAULT_STYLE;

  const colorPreset =
    paletteMap.get(theme.colorPresetId || '') ??
    paletteMap.get(baseStyle.colorPresetId) ??
    PALETTE_PRESETS[0];

  const typographyPreset =
    typeMap.get(theme.typographyPresetId || '') ??
    typeMap.get(baseStyle.typographyPresetId) ??
    TYPOGRAPHY_PRESETS[0];

  const spacingPreset =
    (theme.spacingPresetId && spacingMap.get(theme.spacingPresetId)) ??
    spacingMap.get(baseStyle.spacingPresetId) ??
    SPACING_PRESETS[0];

  const surfacePreset =
    (theme.surfaceStyle && surfaceMap.get(theme.surfaceStyle)) ??
    surfaceMap.get(baseStyle.surfaceStyleId) ??
    SURFACE_PRESETS[0];

  const tone = theme.tone || baseStyle.recommendedTone || colorPreset.tone;

  const mergedPalette: PalettePreset = {
    ...colorPreset,
    colors: {
      ...colorPreset.colors,
      primary: theme.primaryColor || colorPreset.colors.primary,
      secondary: theme.secondaryColor || colorPreset.colors.secondary,
      background: theme.backgroundColor || colorPreset.colors.background,
      text: theme.textColor || colorPreset.colors.text,
    },
    gradients: {
      ...colorPreset.gradients,
      hero: theme.gradientFrom && theme.gradientTo
        ? `linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`
        : colorPreset.gradients?.hero,
      accent: colorPreset.gradients?.accent,
      overlay: theme.overlayColor || colorPreset.gradients?.overlay,
    },
  };

  return {
    palette: mergedPalette,
    typography: {
      ...typographyPreset,
      headingFont: theme.headingFont || typographyPreset.headingFont,
      bodyFont: theme.bodyFont || typographyPreset.bodyFont,
    },
    spacing: spacingPreset,
    surfaces: surfacePreset,
    tone,
    surfaceBackground: mergedPalette.colors.surface,
    cardBackground: mergedPalette.colors.surfaceAlt,
    overlayColor: theme.overlayColor || mergedPalette.gradients?.overlay || 'rgba(15,23,42,0.5)',
    overlayOpacity: typeof theme.overlayOpacity === 'number' ? theme.overlayOpacity : 0.55,
    gradientHero: mergedPalette.gradients?.hero,
    gradientAccent: mergedPalette.gradients?.accent,
  };
}

export function listThemeStylePresets(): ThemeStylePreset[] {
  return THEME_STYLE_PRESETS;
}

export function listColorPresets(): PalettePreset[] {
  return PALETTE_PRESETS;
}

export function listTypographyPresets(): TypographyPreset[] {
  return TYPOGRAPHY_PRESETS;
}

export function listSpacingPresets(): SpacingPreset[] {
  return SPACING_PRESETS;
}

export function listSurfacePresets(): SurfaceStyleTokens[] {
  return SURFACE_PRESETS;
}
