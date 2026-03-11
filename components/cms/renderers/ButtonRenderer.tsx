"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

// NOTE: Banner CTA signature should be pre-computed server-side
// and passed via context.bannerCtaToken to avoid crypto polyfill (317KB).

export const ButtonRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { artist, useNextLink, LinkComponent, isMobile } = context;
    const baseStyle = composeBlockStyle(block.style || {});

    // Support singular 'button' or plural 'buttons' block types in one file or separate?
    // UniversalBlockRenderer had case 'button' and 'buttons'.
    // Let's handle 'button' here.

    const url = block.url || "#";
    const isExternal = /^https?:\/\//i.test(url);
    const buttonStyle = {
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width && !isMobile ? { marginLeft: "auto", marginRight: "auto" } : {}),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    };
    const className = `btn ${block.variant === 'secondary' ? 'btn-secondary' : block.variant === 'outline' ? 'btn-outline' : block.variant === 'ghost' ? 'btn-ghost' : 'btn-primary'} ${block.size === 'small' ? 'btn-sm' : block.size === 'large' ? 'btn-lg' : ''}`;

    // Use pre-computed token from context if available (server-side signed)
    const bannerCtaToken = (context as { bannerCtaToken?: string }).bannerCtaToken;
    const dataAttributes = {
        "data-banner-cta": "primary",
        "data-banner-cta-label": block.label || undefined,
        "data-banner-cta-href": url,
        "data-banner-cta-token": bannerCtaToken || undefined,
    } as Record<string, string | undefined>;

    const content = (
        <>
            {block.icon ? <span className={`icon-${block.icon}`} aria-hidden="true" /> : null}
            {block.label || "Bouton"}
        </>
    );

    const shouldUseLink = useNextLink && !isExternal;
    const Tag = shouldUseLink ? LinkComponent : 'a';
    const props = shouldUseLink
        ? { href: url, className, style: buttonStyle, target: block.openInNewTab ? "_blank" : undefined, rel: block.openInNewTab ? "noopener noreferrer" : undefined, ...dataAttributes }
        : { href: url, className, style: buttonStyle, target: block.openInNewTab ? "_blank" : undefined, rel: block.openInNewTab ? "noopener noreferrer" : undefined, ...dataAttributes };

    return (
        <div style={{ textAlign: block.alignment || "center" }}>
            <Tag {...props}>
                {content}
            </Tag>
        </div>
    );
};
