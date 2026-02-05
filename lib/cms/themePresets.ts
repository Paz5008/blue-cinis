/**
 * Theme Presets for the CMS editor.
 * 
 * Each preset provides a complete set of theme values that can be
 * applied with one click. Presets are designed to be visually appealing
 * and work well with various content types.
 * 
 * @module lib/cms/themePresets
 */

import type { ThemeConfig } from '@/types/cms';

export interface ThemePreset {
    /** Unique identifier */
    id: string;
    /** Display name (French) */
    name: string;
    /** Short description */
    description: string;
    /** Category for grouping */
    category: 'light' | 'dark' | 'artistic' | 'minimal';
    /** Preview colors for the UI */
    preview: {
        primary: string;
        secondary: string;
        background: string;
    };
    /** Theme configuration to apply */
    config: Partial<ThemeConfig>;
}

/**
 * Available theme presets.
 */
export const THEME_PRESETS: ThemePreset[] = [
    // ========== LIGHT PRESETS ==========
    {
        id: 'clean-white',
        name: 'Blanc Épuré',
        description: 'Design minimaliste sur fond blanc',
        category: 'light',
        preview: {
            primary: '#1a1a1a',
            secondary: '#666666',
            background: '#ffffff',
        },
        config: {
            backgroundColor: '#ffffff',
            textColor: '#1a1a1a',
            primaryColor: '#1a1a1a',
            tone: 'light',
            layout: 'minimal',
            noiseTexture: false,
            vignetteStrength: 0,
            blurIntensity: 0,
            surfaceStyle: 'soft',
        },
    },
    {
        id: 'warm-cream',
        name: 'Crème Chaleureux',
        description: 'Tons chauds et accueillants',
        category: 'light',
        preview: {
            primary: '#2d2a26',
            secondary: '#8b7355',
            background: '#f5f2ed',
        },
        config: {
            backgroundColor: '#f5f2ed',
            textColor: '#2d2a26',
            primaryColor: '#8b7355',
            tone: 'light',
            layout: 'default',
            noiseTexture: true,
            vignetteStrength: 15,
            surfaceStyle: 'rounded',
        },
    },
    {
        id: 'soft-gray',
        name: 'Gris Doux',
        description: 'Élégance neutre et professionnelle',
        category: 'light',
        preview: {
            primary: '#2c3e50',
            secondary: '#7f8c8d',
            background: '#f8f9fa',
        },
        config: {
            backgroundColor: '#f8f9fa',
            textColor: '#2c3e50',
            primaryColor: '#3498db',
            secondaryColor: '#7f8c8d',
            tone: 'light',
            layout: 'modern',
            noiseTexture: false,
            vignetteStrength: 0,
            surfaceStyle: 'soft',
        },
    },

    // ========== DARK PRESETS ==========
    {
        id: 'elegant-black',
        name: 'Noir Élégant',
        description: 'Sophistication sur fond sombre',
        category: 'dark',
        preview: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
            background: '#0a0a0a',
        },
        config: {
            backgroundColor: '#0a0a0a',
            textColor: '#ffffff',
            primaryColor: '#ffffff',
            secondaryColor: '#a0a0a0',
            tone: 'dark',
            layout: 'modern',
            noiseTexture: true,
            vignetteStrength: 25,
            surfaceStyle: 'sharp',
        },
    },
    {
        id: 'midnight-blue',
        name: 'Bleu Nuit',
        description: 'Atmosphère nocturne apaisante',
        category: 'dark',
        preview: {
            primary: '#e8e8e8',
            secondary: '#64b5f6',
            background: '#0d1b2a',
        },
        config: {
            backgroundColor: '#0d1b2a',
            textColor: '#e8e8e8',
            primaryColor: '#64b5f6',
            secondaryColor: '#1b263b',
            tone: 'dark',
            layout: 'default',
            noiseTexture: false,
            vignetteStrength: 30,
            blurIntensity: 2,
            surfaceStyle: 'rounded',
        },
    },
    {
        id: 'charcoal',
        name: 'Charbon',
        description: 'Gris profond avec accents dorés',
        category: 'dark',
        preview: {
            primary: '#f4f4f4',
            secondary: '#d4af37',
            background: '#1a1a1a',
        },
        config: {
            backgroundColor: '#1a1a1a',
            textColor: '#f4f4f4',
            primaryColor: '#d4af37',
            secondaryColor: '#404040',
            tone: 'dark',
            layout: 'modern',
            noiseTexture: true,
            vignetteStrength: 20,
            surfaceStyle: 'soft',
        },
    },

    // ========== ARTISTIC PRESETS ==========
    {
        id: 'gallery-white',
        name: 'Galerie d\'Art',
        description: 'Comme dans un musée contemporain',
        category: 'artistic',
        preview: {
            primary: '#1a1a1a',
            secondary: '#cc0000',
            background: '#fafafa',
        },
        config: {
            backgroundColor: '#fafafa',
            textColor: '#1a1a1a',
            primaryColor: '#cc0000',
            tone: 'contrast',
            layout: 'minimal',
            noiseTexture: false,
            vignetteStrength: 10,
            surfaceStyle: 'sharp',
            spacingPresetId: 'airy',
        },
    },
    {
        id: 'sepia-vintage',
        name: 'Sépia Vintage',
        description: 'Atmosphère rétro et nostalgique',
        category: 'artistic',
        preview: {
            primary: '#3d2914',
            secondary: '#8b6914',
            background: '#f5e6d3',
        },
        config: {
            backgroundColor: '#f5e6d3',
            textColor: '#3d2914',
            primaryColor: '#8b6914',
            tone: 'light',
            layout: 'default',
            noiseTexture: true,
            vignetteStrength: 35,
            backgroundDesaturation: 30,
            surfaceStyle: 'rounded',
        },
    },
    {
        id: 'colorful-pop',
        name: 'Pop Coloré',
        description: 'Audacieux et expressif',
        category: 'artistic',
        preview: {
            primary: '#1a1a1a',
            secondary: '#ff6b6b',
            background: '#fff5f5',
        },
        config: {
            backgroundColor: '#fff5f5',
            textColor: '#1a1a1a',
            primaryColor: '#ff6b6b',
            secondaryColor: '#4ecdc4',
            tone: 'light',
            layout: 'modern',
            noiseTexture: false,
            vignetteStrength: 0,
            surfaceStyle: 'pill',
        },
    },

    // ========== MINIMAL PRESETS ==========
    {
        id: 'zen-minimal',
        name: 'Zen Minimal',
        description: 'Espace et sérénité',
        category: 'minimal',
        preview: {
            primary: '#333333',
            secondary: '#888888',
            background: '#f9f9f9',
        },
        config: {
            backgroundColor: '#f9f9f9',
            textColor: '#333333',
            primaryColor: '#333333',
            tone: 'light',
            layout: 'minimal',
            noiseTexture: false,
            vignetteStrength: 0,
            blurIntensity: 0,
            surfaceStyle: 'sharp',
            spacingPresetId: 'airy',
        },
    },
    {
        id: 'paper-texture',
        name: 'Papier Texturé',
        description: 'Sensation tactile et artisanale',
        category: 'minimal',
        preview: {
            primary: '#2c2c2c',
            secondary: '#6b6b6b',
            background: '#f0ebe3',
        },
        config: {
            backgroundColor: '#f0ebe3',
            textColor: '#2c2c2c',
            primaryColor: '#2c2c2c',
            tone: 'light',
            layout: 'default',
            noiseTexture: true,
            vignetteStrength: 20,
            surfaceStyle: 'soft',
            spacingPresetId: 'balanced',
        },
    },
];

/**
 * Get a preset by ID.
 */
export function getPresetById(id: string): ThemePreset | undefined {
    return THEME_PRESETS.find(p => p.id === id);
}

/**
 * Get presets by category.
 */
export function getPresetsByCategory(category: ThemePreset['category']): ThemePreset[] {
    return THEME_PRESETS.filter(p => p.category === category);
}

/**
 * Apply a preset to the current theme, preserving custom overrides if specified.
 */
export function applyPreset(
    currentTheme: ThemeConfig,
    presetId: string,
    preserveBackground = false
): ThemeConfig {
    const preset = getPresetById(presetId);
    if (!preset) return currentTheme;

    const newTheme: ThemeConfig = {
        ...currentTheme,
        ...preset.config,
        stylePresetId: presetId,
    };

    // Optionally preserve the background image
    if (preserveBackground && currentTheme.backgroundImageUrl) {
        newTheme.backgroundImageUrl = currentTheme.backgroundImageUrl;
    }

    return newTheme;
}

/**
 * Get the category display name in French.
 */
export function getCategoryLabel(category: ThemePreset['category']): string {
    const labels: Record<ThemePreset['category'], string> = {
        light: 'Thèmes Clairs',
        dark: 'Thèmes Sombres',
        artistic: 'Artistiques',
        minimal: 'Minimalistes',
    };
    return labels[category];
}

export default THEME_PRESETS;
