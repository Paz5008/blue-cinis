"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { resolveFontFamily } from "@/lib/cms/fonts";

export const TextRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { sanitize } = context;
    const baseStyle = composeBlockStyle(block.style || {});
    const combinedStyle: React.CSSProperties = {
        whiteSpace: 'pre-wrap', // CRITICAL: Matches Editor behavior
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width ? { marginLeft: "auto", marginRight: "auto" } : {}),
        // Legacy/Inspector Root Mappings
        ...(block.alignment ? { textAlign: block.alignment } : {}),
        ...(block.fontSize ? { fontSize: block.fontSize } : {}),
        ...(block.color ? { color: block.color } : {}),
        ...(block.fontFamily ? { fontFamily: resolveFontFamily(block.fontFamily) } : {}),
        ...(block.fontWeight ? { fontWeight: block.fontWeight } : {}),
        ...(block.lineHeight ? { lineHeight: block.lineHeight } : {}),
        ...(block.letterSpacing ? { letterSpacing: block.letterSpacing } : {}),
        ...(block.textTransform ? { textTransform: block.textTransform as any } : {}),
    };

    return (
        <div
            style={combinedStyle}
            dangerouslySetInnerHTML={{ __html: sanitize(block.content || "") }}
        />
    );
};
