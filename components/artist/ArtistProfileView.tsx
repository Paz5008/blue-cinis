"use client";

import React from 'react';
import Link from "next/link";
import BlockRenderer from '@/components/cms/BlockRenderer';
import { composeBlockStyle } from '@/lib/cms/style';
import { calculateContentWidth, calculateContentHeight } from '@/lib/cms/blockPositioning';

// Import default profile preset for artists without custom CMS content
import defaultProfileBlocks from '@/presets/profil-artiste-defaut.json';

// Types
type ArtistProfileViewProps = {
    artist: any; // Ideally typed with Prisma return type
    content: any; // CMS content
    isPreview?: boolean;
};

// Utils (Extracted from by-id/page.tsx)
const sanitizeFontFamily = (value?: unknown) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return /^[\w\s"',-]+$/.test(trimmed) ? trimmed : undefined;
};

const getContrastingTextColor = (input: string | undefined, fallback: string) => {
    if (!input || typeof input !== 'string') return fallback;
    const match = input.trim();
    const hex = match.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!hex) return fallback;
    let value = hex[1];
    if (value.length === 3) {
        value = value.split('').map(char => char + char).join('');
    }
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#111111' : '#ffffff';
};

const pruneNonCssKeys = (style: Record<string, any>) => {
    const keysToRemove = [
        'overlayColor',
        'overlayOpacity',
        'gradientFrom',
        'gradientTo',
        'gradientDirection',
        'gradientMid',
        'gradientType',
        'backgroundImageUrl',
        'backgroundSizeCustom',
        'backgroundPositionCustom',
        'parallax',
    ];
    const cleaned: Record<string, any> = {};
    Object.entries(style || {}).forEach(([key, value]) => {
        if (!keysToRemove.includes(key)) {
            cleaned[key] = value;
        }
    });
    return cleaned;
};

export default function ArtistProfileView({ artist, content, isPreview = false }: ArtistProfileViewProps) {
    const { blocks = [], theme: themeConfig } = content || {};
    const hasCustomBlocks = Array.isArray(blocks) && blocks.length > 0;

    // Calculate required container width for absolute positioning
    const requiredWidth = hasCustomBlocks ? calculateContentWidth(blocks, true) : 1200;
    const containerWidth = Math.max(1200, requiredWidth);

    // Calculate required container height for absolute positioning to prevent overlay
    const contentHeight = hasCustomBlocks ? (calculateContentHeight(blocks, true) + 100) : 0; // Add padding

    // Default Theme
    const defaultTheme = {
        primaryColor: '#1e3a8a', secondaryColor: '#4f46e5', backgroundColor: '#ffffff', textColor: '#000000',
        headingFont: 'sans-serif', bodyFont: 'sans-serif', backgroundImageUrl: undefined, coverImageUrl: undefined,
    };

    const theme = { ...defaultTheme, ...(themeConfig || {}) };

    const sanitizedHeadingFont = sanitizeFontFamily(theme.headingFont);
    const sanitizedBodyFont = sanitizeFontFamily(theme.bodyFont) || defaultTheme.bodyFont;
    const primaryColor = typeof theme.primaryColor === 'string' && theme.primaryColor ? theme.primaryColor : defaultTheme.primaryColor;
    const secondaryColor = typeof theme.secondaryColor === 'string' && theme.secondaryColor ? theme.secondaryColor : defaultTheme.secondaryColor;
    const backgroundColor = typeof theme.backgroundColor === 'string' && theme.backgroundColor ? theme.backgroundColor : defaultTheme.backgroundColor;
    const textColor = typeof theme.textColor === 'string' && theme.textColor ? theme.textColor : defaultTheme.textColor;

    // Use shared composeBlockStyle for theme background (The Fix!)
    const themeBackgroundRaw = composeBlockStyle({
        backgroundImageUrl: theme.backgroundImageUrl,
        overlayColor: theme.overlayColor,
        overlayOpacity: theme.overlayOpacity,
        gradientFrom: theme.gradientFrom,
        gradientTo: theme.gradientTo,
        gradientDirection: theme.gradientDirection,
        gradientType: (theme as any).gradientType,
        gradientMid: (theme as any).gradientMid,
        blendMode: theme.blendMode,
        backgroundSize: (theme as any).backgroundSize,
        backgroundSizeCustom: (theme as any).backgroundSizeCustom,
        backgroundPosition: (theme as any).backgroundPosition,
        backgroundPositionCustom: (theme as any).backgroundPositionCustom,
        backgroundRepeat: (theme as any).backgroundRepeat,
        parallax: (theme as any).parallax,
    });

    const sectionBackground = pruneNonCssKeys(themeBackgroundRaw);

    const sectionStyle: React.CSSProperties = {
        backgroundColor,
        color: textColor,
        fontFamily: sanitizedBodyFont,
        ...sectionBackground,
    };

    const buttonTextColor = getContrastingTextColor(primaryColor, '#ffffff');

    const themeVars: Record<string, string> = {
        '--artist-primary': primaryColor,
        '--artist-secondary': secondaryColor,
        '--artist-text': textColor,
        '--artist-background': backgroundColor,
        '--artist-button-text': buttonTextColor,
    };

    // Inject vars into style
    Object.entries(themeVars).forEach(([key, value]) => {
        (sectionStyle as any)[key] = value;
    });

    // Generate Scoped CSS
    const themeScopedCssParts: string[] = [
        `.artist-theme a { color: var(--artist-primary); }`,
        `.artist-theme a:hover { color: var(--artist-secondary); }`,
        `.artist-theme .artist-button { background-color: var(--artist-primary); color: var(--artist-button-text); border: none; }`,
        `.artist-theme .artist-button:hover { background-color: var(--artist-secondary); color: var(--artist-button-text); }`,
        `.artist-theme .artist-button:focus-visible { outline: 2px solid var(--artist-secondary); outline-offset: 2px; }`,
        `.artist-theme .artist-button.outline { background-color: transparent; border: 1px solid var(--artist-primary); color: var(--artist-primary); }`,
        `.artist-theme .artist-button.outline:hover { border-color: var(--artist-secondary); color: var(--artist-secondary); }`,
    ];

    if (sanitizedHeadingFont) {
        themeScopedCssParts.push(`.artist-theme h1, .artist-theme h2, .artist-theme h3, .artist-theme h4, .artist-theme h5, .artist-theme h6 { font-family: ${sanitizedHeadingFont}; }`);
    }
    if (sanitizedBodyFont) {
        themeScopedCssParts.push(`.artist-theme { font-family: ${sanitizedBodyFont}; }`);
    }
    const themeScopedCss = themeScopedCssParts.join('\n');

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: artist.name,
        image: artist.photoUrl || undefined,
        description: artist.biography || undefined,
        url: `${process.env.NEXTAUTH_URL || 'https://blue-cinis.com'}/artistes/${artist.slug || artist.id}`,
    };

    // Visual Effects Styles
    const noiseOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
        opacity: 0.4, // Subtle noise
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
    };

    const vignetteStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 40,
        background: `radial-gradient(circle, transparent 50%, rgba(0,0,0, ${((theme.vignetteStrength || 0) / 100) * 0.8}) 150%)`,
    };

    const blurStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 30,
        backdropFilter: `blur(${theme.blurIntensity || 0}px)`,
        display: theme.blurIntensity && theme.blurIntensity > 0 ? 'block' : 'none',
    };

    return (
        <section className="artist-theme p-8 min-h-screen" style={sectionStyle}>
            {themeScopedCss ? <style data-origin="artist-theme" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScopedCss }} /> : null}
            <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Visual Effects Layer */}
            {theme.noiseTexture && <div className="theme-effect-noise" style={noiseOverlayStyle} />}
            {theme.vignetteStrength && theme.vignetteStrength > 0 && <div className="theme-effect-vignette" style={vignetteStyle} />}
            {theme.blurIntensity && theme.blurIntensity > 0 && <div className="theme-effect-blur" style={blurStyle} />}

            {theme.coverImageUrl && (
                <div className="mb-6 relative z-0">
                    <img src={theme.coverImageUrl} alt="Couverture" className="w-full h-48 object-cover rounded" />
                </div>
            )}

            <div
                className={`mx-auto relative ${theme.noiseTexture ? 'z-10' : ''}`}
                style={{
                    width: hasCustomBlocks ? `${containerWidth}px` : undefined,
                    maxWidth: '100vw',
                    overflowX: containerWidth > 1200 ? 'auto' : 'visible',
                    minHeight: hasCustomBlocks ? `${contentHeight}px` : undefined,
                }}
            >
                {hasCustomBlocks ? (
                    <BlockRenderer
                        blocks={blocks}
                        artist={artist}
                        artworks={artist.artworks || []}
                        pageKey="profile"
                        enableAbsolutePositioning={true}
                    />
                ) : (
                    /* Default profile using CMS preset for artists without custom content */
                    <BlockRenderer
                        blocks={defaultProfileBlocks as any}
                        artist={artist}
                        artworks={artist.artworks || []}
                        pageKey="profile"
                        enableAbsolutePositioning={false}
                    />
                )}

                <div className="mt-8 text-center">
                    <Link href="/artistes" className="hover:underline text-lg" style={{ color: 'var(--artist-primary)' }}>← Retour à la liste des artistes</Link>
                </div>
            </div>
        </section>
    );
}
