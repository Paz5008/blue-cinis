"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

export const VideoRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const baseStyle = composeBlockStyle(block.style || {});
    const combinedStyle = {
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width ? { marginLeft: "auto", marginRight: "auto" } : {}),
    };

    const autoplay = Boolean(block.autoplay);
    const controls = block.controls !== false;
    const muted = block.muted !== false;
    const loop = Boolean(block.loop);

    if (!block.src && (context.disablePositioning || !context.isPreview)) {
        return (
            <div
                style={{ ...combinedStyle, height: '200px' }}
                className="mb-4 flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 rounded"
                title="Vidéo vide"
            >
                <div className="text-center text-slate-400">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.866v6.268a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-medium">Ajoutez une vidéo</span>
                </div>
            </div>
        );
    }

    return (
        <div
            style={combinedStyle}
            className="mb-6"
        >
            <video
                src={block.src || ""}
                controls={controls}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                playsInline
                className="w-full object-cover"
                style={{ borderRadius: baseStyle?.borderRadius, maxHeight: baseStyle?.maxHeight }}
            />
        </div>
    );
};
