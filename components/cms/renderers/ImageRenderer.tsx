"use client";

import React, { memo } from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { SmartImage } from "../SmartImage";

const ImageRendererBase: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const baseStyle = composeBlockStyle(block.style || {});
    const alignmentMap: Record<string, string> = {
        left: "flex-start",
        center: "center",
        right: "flex-end",
    };
    const justify = alignmentMap[block.alignment || "center"] || "center";

    const sizeMap: Record<string, string> = {
        small: "25%",
        medium: "50%",
        large: "75%",
        full: "100%",
    };
    const maxWidth = sizeMap[block.size as string] || "100%";

    const wrapperStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: justify === "flex-start" ? "flex-start" : justify === "flex-end" ? "flex-end" : "center",
        width: "100%",
    };
    const innerStyle = {
        ...baseStyle,
        ...injectedStyle,
        width: baseStyle.width || "100%",
        maxWidth: baseStyle.width ? undefined : maxWidth,
    };

    return (
        <div style={wrapperStyle} className="mb-6">
            <div style={innerStyle}>
                <SmartImage
                    context={context}
                    src={block.src || ""}
                    alt={block.altText || ""}
                    className="w-full object-cover"
                    loading="lazy"
                />
                {block.caption ? (
                    <p className="text-sm text-gray-600 mt-2 text-center" style={{ textAlign: block.alignment as any || 'center' }}>
                        {block.caption}
                    </p>
                ) : null}
            </div>
        </div>
    );
};

// Memoize to prevent unnecessary re-renders
export const ImageRenderer = memo(ImageRendererBase, (prev, next) => {
    return prev.block === next.block &&
        prev.context === next.context &&
        prev.style === next.style;
});

