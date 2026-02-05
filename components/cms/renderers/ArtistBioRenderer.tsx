"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

export const ArtistBioRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { artist, sanitize } = context;
    const baseStyle = composeBlockStyle(block.style || {});

    return (
        <div
            style={{
                textAlign: block.alignment,
                fontSize: block.fontSize,
                color: block.color,
                lineHeight: block.lineHeight,
                letterSpacing: block.letterSpacing,
                fontWeight: block.fontWeight,
                textTransform: block.textTransform,
                fontFamily: block.fontFamily,
                ...baseStyle,
                ...injectedStyle
            }}
            dangerouslySetInnerHTML={{
                __html: sanitize(block.content || artist.biography || ""),
            }}
        />
    );
};
