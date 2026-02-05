"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

export const DividerRenderer: React.FC<BlockRendererProps> = ({ block, style: injectedStyle }) => {
    const baseStyle = composeBlockStyle(block.style || {});

    return (
        <hr
            className="my-6 w-full"
            style={{
                ...baseStyle,
                ...injectedStyle,
                borderColor: block.color || baseStyle?.borderColor || "rgba(148, 163, 184, 0.4)",
                borderWidth: block.thickness ? `${block.thickness}px` : baseStyle?.borderWidth,
                borderTopWidth: block.thickness ? `${block.thickness}px` : baseStyle?.borderWidth,
                borderStyle: block.borderStyle || baseStyle?.borderStyle || "solid",
            }}
        />
    );
};
