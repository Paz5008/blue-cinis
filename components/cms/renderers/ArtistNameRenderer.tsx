"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

export const ArtistNameRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { artist } = context;
    const baseStyle = composeBlockStyle(block.style || {});
    const Tag: any = block.tag || "div";

    return (
        <Tag
            className="break-words"
            style={{
                // Styles par défaut visibles si l'IA ne les fournit pas
                fontSize: block.fontSize || '3rem',
                fontWeight: block.fontWeight || '700',
                textAlign: block.alignment || 'center',
                letterSpacing: block.letterSpacing || '-0.02em',
                lineHeight: block.lineHeight || '1.1',
                padding: '40px 24px 16px',
                color: block.color || 'inherit',
                fontFamily: block.fontFamily || 'inherit',
                textTransform: block.textTransform,
                ...baseStyle,
                ...injectedStyle
            }}
        >
            {artist.name || 'Artiste'}
        </Tag>
    );
};
