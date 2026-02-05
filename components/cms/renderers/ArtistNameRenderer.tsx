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
                textAlign: block.alignment,
                color: block.color,
                fontSize: block.fontSize,
                lineHeight: block.lineHeight,
                letterSpacing: block.letterSpacing,
                fontWeight: block.fontWeight,
                textTransform: block.textTransform,
                fontFamily: block.fontFamily,
                ...baseStyle,
                ...injectedStyle
            }}
        >
            {artist.name}
        </Tag>
    );
};
