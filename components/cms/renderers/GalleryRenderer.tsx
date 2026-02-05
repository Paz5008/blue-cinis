"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { SmartImage } from "../SmartImage";

export const GalleryRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const baseStyle = composeBlockStyle(block.style || {});
    // Remove gridTemplateColumns from style to allow responsive classes
    const { gridTemplateColumns, borderRadius, ...restStyle } = {
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width ? { marginLeft: "auto", marginRight: "auto" } : {}),
    } as any;

    const cols = block.columns || 3;
    const gridClassMap: Record<number, string> = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
    };
    const responsiveClass = gridClassMap[cols] || "md:grid-cols-3";

    return (
        <div
            className={`grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 ${responsiveClass}`}
            style={restStyle}
        >
            {(block.images || [])?.map((img: any, idx: number) => (
                <div key={idx} className="relative flex flex-col gap-1">
                    <SmartImage
                        context={context}
                        src={img.src || ""}
                        alt={img.altText || ""}
                        className="w-full"
                        style={{
                            borderRadius: borderRadius || undefined,
                            objectFit: (block.style as any)?.objectFit || "cover",
                            height: "100%", // Ensure it fills if grid enforces height?
                            aspectRatio: "1/1", // Optional default? No, let intrinsic size work or use style.
                        }}
                    />
                    {img.caption && <p className="text-xs text-gray-500 mt-1">{img.caption}</p>}
                </div>
            ))}
        </div>
    );
};
