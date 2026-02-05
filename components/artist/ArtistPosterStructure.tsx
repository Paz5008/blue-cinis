import React from "react";
import { sanitizeTextHtml } from "@/lib/sanitize";
import { buildEmbedUrl } from "@/lib/cms/embed";
import type { CanvasSettings } from "@/types/cms";
import { buildArtworkPath } from "@/lib/artworkSlug";
import { ArtistContext, ArtistPosterCanvasProps, BannerContent, ArtistCanvasPageKey } from "./canvasTypes";
export type { ArtistContext, ArtistPosterCanvasProps, BannerContent, ArtistCanvasPageKey };

// Shared Types & Defaults
const DEFAULT_THEME = {
    primaryColor: "#1e3a8a",
    secondaryColor: "#4f46e5",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    headingFont: "var(--font-display, 'DM Sans', sans-serif)",
    bodyFont: "var(--font-body, 'Inter', sans-serif)",
};

const sanitizeFontFamily = (value?: unknown) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return /^[\w\s"',-]+$/.test(trimmed) ? trimmed : undefined;
};

const getContrastingTextColor = (input: string | undefined, fallback: string) => {
    if (!input || typeof input !== "string") return fallback;
    const match = input.trim();
    const hex = match.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!hex) return fallback;
    let value = hex[1];
    if (value.length === 3) {
        value = value.split("").map((char) => char + char).join("");
    }
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#111111" : "#ffffff";
};

const buildCtaToken = (href: string, artistId: string) => undefined;

const pruneNonCssKeys = (style: Record<string, any>) => {
    const keysToRemove = [
        "overlayColor", "overlayOpacity", "gradientFrom", "gradientTo",
        "gradientDirection", "gradientMid", "gradientType", "backgroundImageUrl",
        "backgroundSizeCustom", "backgroundPositionCustom", "parallax",
    ];
    const cleaned: Record<string, any> = {};
    Object.entries(style || {}).forEach(([key, value]) => {
        if (!keysToRemove.includes(key)) cleaned[key] = value;
    });
    return cleaned;
};

const buildSearchString = (searchParams: Record<string, string | string[] | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
        else query.append(key, value);
    });
    const str = query.toString();
    return str ? `?${str}` : "";
};

const composeBg = (style: Record<string, any>) => {
    const st: Record<string, any> = { ...(style || {}) };
    const layers: string[] = [];
    if (typeof st.overlayColor === "string" && st.overlayColor) {
        const alpha = typeof st.overlayOpacity === "number" ? Math.max(0, Math.min(1, st.overlayOpacity)) : undefined;
        let color = st.overlayColor as string;
        if (alpha !== undefined && /^#/.test(color)) {
            const hex = color.replace("#", "");
            const bigint = Number.parseInt(hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            color = `rgba(${r},${g},${b},${alpha})`;
        }
        layers.push(`linear-gradient(${color}, ${color})`);
    }
    if (st.gradientFrom && st.gradientTo) {
        const dir = st.gradientDirection || "to bottom";
        const mid = st.gradientMid;
        const stops = mid ? `${st.gradientFrom}, ${mid}, ${st.gradientTo}` : `${st.gradientFrom}, ${st.gradientTo}`;
        layers.push(st.gradientType === "radial" ? `radial-gradient(circle at center, ${stops})` : `linear-gradient(${dir}, ${stops})`);
    }
    if (st.backgroundImageUrl) layers.push(`url(${st.backgroundImageUrl})`);
    if (layers.length > 0) {
        st.backgroundImage = layers.join(", ");
        if (st.blendMode) st.backgroundBlendMode = st.blendMode;
        st.backgroundSize = st.backgroundImageUrl ? (st.backgroundSize === "custom" ? st.backgroundSizeCustom || "auto" : st.backgroundSize || "cover") : st.backgroundSize || undefined;
        st.backgroundPosition = st.backgroundImageUrl ? (st.backgroundPosition === "custom" ? st.backgroundPositionCustom || "center" : st.backgroundPosition || "center") : st.backgroundPosition || undefined;
        st.backgroundRepeat = st.backgroundImageUrl ? st.backgroundRepeat || "no-repeat" : st.backgroundRepeat || undefined;
        if (st.parallax) st.backgroundAttachment = "fixed";
    }
    return st;
};

const buildVisibilityCSS = (block: any) => {
    const id = (block?.id || "").toString();
    if (!id) return "";
    const css: string[] = [];
    const add = (rule: string) => css.push(rule);
    if (block.showOnMobile === false) add(`@media (max-width: 767px){#blk-${id}{display:none !important;}}`);
    if (block.showOnDesktop === false) add(`@media (min-width: 768px){#blk-${id}{display:none !important;}}`);
    return css.join("\n");
};

const buildHoverCSS = (block: any) => {
    const id = (block?.id || "").toString();
    if (!id) return "";
    const st: any = block?.style || {};
    const parts: string[] = [];
    const hover: string[] = [];
    if (typeof st.hoverOpacity === "number") hover.push(`opacity:${Math.max(0, Math.min(1, st.hoverOpacity))};`);
    if (typeof st.hoverScale === "number" && !Number.isNaN(st.hoverScale)) hover.push(`transform: scale(${st.hoverScale});`);
    if (typeof st.hoverShadow === "string" && st.hoverShadow.trim().length > 0) hover.push(`box-shadow:${st.hoverShadow};`);
    if (typeof st.hoverTransitionMs === "number") parts.push(`#blk-${id}{transition: all ${Math.max(0, st.hoverTransitionMs)}ms ease;}`);
    if (hover.length > 0) parts.push(`#blk-${id}:hover{${hover.join(" ")}}`);
    return parts.join("\n");
};

type RenderContext = {
    artist: ArtistContext;
    sanitize: (html: string) => string;
    searchString: string;
    isPreview: boolean;
    useNextLink: boolean;
    LinkComponent: React.ElementType;
    pageKey: ArtistCanvasPageKey;
    isMobile: boolean;
    contactForm?: React.ReactNode;
};

const renderBlock = (block: any, key: number, ctx: RenderContext): React.ReactNode => {
    const { artist, sanitize, useNextLink, LinkComponent, isMobile } = ctx;
    let style = composeBg(block.style || {});
    if (ctx.isPreview && style.backgroundAttachment === "fixed") delete style.backgroundAttachment;

    switch (block.type) {
        case "text":
            return <div key={key} style={{ ...style, ...(style?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}) }} dangerouslySetInnerHTML={{ __html: sanitize(block.content) }} />;
        case "artistName": {
            const Tag: any = block.tag || "div";
            return <Tag key={key} style={{ textAlign: block.alignment, fontSize: block.fontSize, color: block.color, lineHeight: block.lineHeight, letterSpacing: block.letterSpacing, fontWeight: block.fontWeight, textTransform: block.textTransform, fontFamily: block.fontFamily, ...style }}>{artist.name}</Tag>;
        }
        case "artistBio":
            return <div key={key} style={{ textAlign: block.alignment, fontSize: block.fontSize, color: block.color, lineHeight: block.lineHeight, letterSpacing: block.letterSpacing, fontWeight: block.fontWeight, textTransform: block.textTransform, fontFamily: block.fontFamily, ...style }} dangerouslySetInnerHTML={{ __html: sanitize(block.content || artist.biography || "") }} />;
        case "image":
            return (
                <div key={key} style={{ ...style, ...(style?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}) }} className="mb-4">
                    <img src={block.src} alt={block.altText || ""} className="w-full object-cover block" loading="lazy" />
                    {block.caption && <p className="text-sm text-gray-600 mt-2">{block.caption}</p>}
                </div>
            );
        case "artistPhoto": {
            const st: Record<string, any> = { ...(style || {}) };
            if (style?.width && !isMobile) {
                const align = (style as any).canvasAlign as "left" | "center" | "right" | undefined;
                if (align === "center") { st.marginLeft = "auto"; st.marginRight = "auto"; }
                else if (align === "right") { st.marginLeft = "auto"; st.marginRight = undefined; }
            }
            st.overflow = "hidden";
            const fit: any = block.objectFit || "cover";
            const objPos: any = block.objectPosition || "center";
            const photoSrc = (typeof block.src === "string" ? block.src.trim() : "") || (typeof artist.photoUrl === "string" ? artist.photoUrl.trim() : "");
            return (
                <div key={key} style={{ textAlign: block.alignment || "center", ...st }} className="mb-4">
                    {photoSrc ? <img src={photoSrc} alt={block.altText || artist.name} className="w-full" style={{ objectFit: fit, objectPosition: objPos }} loading="lazy" /> : <p className="text-gray-500">Photo indisponible</p>}
                </div>
            );
        }
        case "gallery":
            return <div key={key} className="grid gap-4 mb-4" style={{ ...style, gridTemplateColumns: `repeat(${block.columns},minmax(0,1fr))` }}>{(block.images || []).map((img: any, i: number) => <img key={i} src={img.src} alt={img.altText || ""} className="w-full" style={{ borderRadius: (block.style as any)?.imageRadius, objectFit: block.objectFit || "cover", objectPosition: block.objectPosition || "center" }} />)}</div>;
        case "video":
            return <div key={key} style={{ ...style, ...(style?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}) }} className="mb-4"><video src={block.src} controls={block.controls !== false} autoPlay={Boolean(block.autoplay)} muted={block.muted !== false} loop={Boolean(block.loop)} playsInline className="w-full" style={{ borderRadius: style?.borderRadius, maxHeight: style?.maxHeight }} /></div>;
        case "embed": {
            const embedUrl = buildEmbedUrl(block.url || "", block.provider);
            if (!embedUrl) return null;
            const ratio = 56.25;
            return <div key={key} style={{ ...style, width: block.width || style?.width || "100%", marginLeft: style?.width && !isMobile ? "auto" : undefined, marginRight: style?.width && !isMobile ? "auto" : undefined }} className="my-4"><div className="relative w-full overflow-hidden rounded-xl shadow-sm" style={{ paddingTop: block.height ? undefined : `${ratio}%` }}><iframe src={embedUrl} title={block.title || "Embed"} allowFullScreen loading="lazy" className="absolute inset-0 h-full w-full border-0" style={block.height ? { height: block.height } : {}} /></div>{block.caption && <p className="mt-2 text-sm text-slate-500">{block.caption}</p>}</div>;
        }
        case "divider": return <hr key={key} className="my-6 w-full" style={{ ...style, borderColor: block.color || style?.borderColor || "rgba(148, 163, 184, 0.4)", borderWidth: block.thickness ? `${block.thickness}px` : style?.borderWidth, borderTopWidth: block.thickness ? `${block.thickness}px` : style?.borderWidth, borderStyle: block.borderStyle || style?.borderStyle || "solid" }} />;
        case "quote": return <blockquote key={key} className="my-6 border-l-4 pl-4 italic" style={{ ...style, borderColor: block.color || "rgba(212, 162, 90, 0.45)", textAlign: block.alignment || style?.textAlign }}><div dangerouslySetInnerHTML={{ __html: ctx.sanitize(block.content || "") }} />{block.author && <footer className="mt-3 text-right text-sm font-semibold not-italic opacity-80">— {block.author}</footer>}</blockquote>;
        case "columns": {
            const count = Math.max(1, Number(block.count) || 2);
            return <div key={key} className="grid gap-4 mb-6" style={isMobile ? { ...style, gridTemplateColumns: '1fr', gap: '1.5rem', width: '100%' } : { ...style, ...(style?.width ? { marginLeft: "auto", marginRight: "auto" } : {}), gridTemplateColumns: `repeat(${count},minmax(0,1fr))` }}>{(block.columns || []).map((col: any[], i: number) => <div key={i} className="space-y-4">{Array.isArray(col) ? col.map((child, idx) => renderBlock(child, idx, ctx)) : null}</div>)}</div>;
        }
        case "button": {
            const url = block.url || "#";
            const buttonStyle = { ...style, ...(style?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}), display: "inline-flex", alignItems: "center", justifyContent: "center" };
            const LinkComp = LinkComponent as any;
            return <div key={key} style={{ textAlign: block.alignment || "center" }}><LinkComp href={url} className={`artist-button ${block.variant || "primary"}`} style={buttonStyle} target={block.openInNewTab ? "_blank" : undefined}>{block.label}</LinkComp></div>;
        }
        case "spacer": return <div key={key} style={{ height: block.height || "1rem", ...style }} />;
        case "contactForm":
            return ctx.isPreview ? (
                <div key={key} style={{ ...style, ...(style?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}) }} className="my-6 rounded-3xl border border-dashed border-[rgba(148,163,184,0.35)] bg-white/60 p-6 text-center text-sm text-[color:var(--color-text-body-subtle)]">Formulaire de contact — aperçu</div>
            ) : (
                <div key={key} style={{ ...style, ...(style?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}) }} className="my-6">{ctx.contactForm || null}</div>
            );
        default: return null;
    }
};

const renderBlockGroup = (blocks: any[], ctx: RenderContext) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return blocks.map((block: any, idx: number) => {
        const id = block?.id || idx;
        const visibilityCss = buildVisibilityCSS(block);
        const hoverCss = buildHoverCSS(block);
        return <React.Fragment key={`${id}-${idx}`}>{visibilityCss && <style dangerouslySetInnerHTML={{ __html: visibilityCss }} />}{hoverCss && <style dangerouslySetInnerHTML={{ __html: hoverCss }} />}<div id={`blk-${id}`} style={ctx.isMobile ? {} : { display: "contents" }}>{renderBlock(block, idx, ctx)}</div></React.Fragment>;
    });
};

const buildFallbackPoster = (artist: ArtistContext, options: { isPreview: boolean; useNextLink: boolean, LinkComponent: React.ElementType }) => {
    const { isPreview, LinkComponent } = options;
    const LinkComp = LinkComponent as any;
    const galleryHref = (artist.artworks?.[0] ? buildArtworkPath({ id: artist.artworks[0].id, title: artist.artworks[0].title }) : "/galerie");
    const profileHref = artist.slug ? `/artistes/${artist.slug}` : `/artistes/${artist.id}`;
    return (
        <section className="relative overflow-hidden rounded-[36px] bg-slate-900 px-6 py-12 text-slate-100 shadow-2xl">
            <div className="relative space-y-5 text-left"><h2 className="text-3xl font-semibold">{artist.name}</h2><div className="flex flex-wrap items-center gap-3"><LinkComp href={galleryHref} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900">Voir l&apos;affiche</LinkComp><LinkComp href={profileHref} className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white">Profil</LinkComp></div></div>
        </section>
    );
};

export type ArtistPosterStructureProps = ArtistPosterCanvasProps & {
    isMobile: boolean;
    LinkComponent: React.ElementType;
    contactForm?: React.ReactNode;
};

export function ArtistPosterStructure(props: ArtistPosterStructureProps) {
    const { artist, content, searchParams, variant = "standalone", showBackLink = true, pageKey = "poster", fallbackRenderer, isMobile, LinkComponent, contactForm } = props;
    const LinkComp = LinkComponent as any;
    const { blocks = [], theme: themeConfig } = content || {};
    const theme = { ...DEFAULT_THEME, ...(themeConfig || {}) };
    const applyThemeForHome = (content?.settings as any)?.applyThemeToHome === true;
    const shouldApplyTheme = (variant === "home" || variant === "preview") ? applyThemeForHome : true;

    // Process Blocks
    const processedBlocks = blocks;

    // Theme logic
    const sanitizedHeadingFont = sanitizeFontFamily(theme.headingFont);
    const sanitizedBodyFont = sanitizeFontFamily(theme.bodyFont) || DEFAULT_THEME.bodyFont;
    const textColor = typeof theme.textColor === "string" ? theme.textColor : DEFAULT_THEME.textColor;

    // Simplified background composition for brevity in this structure
    const themeBackgroundRaw = shouldApplyTheme ? composeBg(theme) : {};
    const sectionBackground = shouldApplyTheme ? pruneNonCssKeys(themeBackgroundRaw) : {};
    if ((variant === "preview" || variant === "home") && sectionBackground.backgroundAttachment === "fixed") {
        delete sectionBackground.backgroundAttachment;
    }

    const sectionStyle: React.CSSProperties = {
        color: textColor,
        fontFamily: sanitizedBodyFont,
        ...(shouldApplyTheme ? { backgroundColor: theme.backgroundColor || DEFAULT_THEME.backgroundColor, ...sectionBackground } : { backgroundColor: "transparent" }),
        "--artist-primary": theme.primaryColor || DEFAULT_THEME.primaryColor,
        "--artist-secondary": theme.secondaryColor || DEFAULT_THEME.secondaryColor,
        "--artist-text": textColor,
    } as React.CSSProperties;

    if (!shouldApplyTheme) {
        delete (sectionStyle as any).backgroundImage;
    }

    const themeScopedCss = shouldApplyTheme && sanitizedHeadingFont ? `.artist-theme h1, .artist-theme h2, .artist-theme h3 { font-family: ${sanitizedHeadingFont}; }` : "";

    const ctx: RenderContext = {
        artist,
        sanitize: (html) => sanitizeTextHtml(html, pageKey),
        searchString: buildSearchString(searchParams || {}),
        isPreview: variant === "preview",
        useNextLink: variant === "standalone",
        LinkComponent,
        pageKey,
        isMobile,
        contactForm
    };

    const hasBlocks = Array.isArray(processedBlocks) && processedBlocks.length > 0;
    const contentNodes = hasBlocks ? renderBlockGroup(processedBlocks, ctx) : null;
    let fallbackNode = null;
    if (!contentNodes) {
        if (typeof fallbackRenderer === "function") fallbackNode = fallbackRenderer(artist, { isPreview: variant === "preview" });
        else fallbackNode = buildFallbackPoster(artist, { isPreview: variant === "preview", useNextLink: true, LinkComponent });
    }

    const body = (
        <>
            {themeScopedCss && <style dangerouslySetInnerHTML={{ __html: themeScopedCss }} />}
            {contentNodes ?? fallbackNode}
            {showBackLink && variant === "standalone" && (
                <div className="mt-4 text-center">
                    <LinkComp href={`/artistes/${artist.slug || artist.id}`} className="text-blue-600 hover:underline text-sm">← Retour au profil</LinkComp>
                </div>
            )}
        </>
    );

    const wrapperClass = variant === "preview" ? "artist-theme artist-banner-preview relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/12 bg-white/70 p-6 shadow-lg backdrop-blur" : isMobile ? "artist-theme flex flex-col w-full h-auto overflow-x-hidden p-4 gap-8" : "artist-theme min-h-screen relative overflow-hidden";

    return (
        <section className={wrapperClass} style={{ ...sectionStyle, ...(isMobile ? { display: 'flex', flexDirection: 'column', height: 'auto', width: '100%', overflow: 'visible' } : {}) }} data-canvas-page={pageKey}>
            {body}
        </section>
    );
}
