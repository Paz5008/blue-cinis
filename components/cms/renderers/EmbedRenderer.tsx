"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { buildEmbedUrl } from "@/lib/cms/embed";

export const EmbedRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const baseStyle = composeBlockStyle(block.style || {});

    const url = typeof block.url === "string" ? block.url : "";
    const embedUrl = buildEmbedUrl(url, block.provider);

    if (!embedUrl) {
        if (!context.isPreview) {
            return (
                <div
                    style={{ ...baseStyle, height: '150px', backgroundColor: '#f9fafb' }}
                    className="mb-6 flex items-center justify-center border-2 dashed border-gray-200 rounded-lg text-xs text-gray-400"
                >
                    Contenu intégré (Vide)
                </div>
            );
        }
        return null;
    }

    const ratioStr = typeof block.aspectRatio === "string" ? block.aspectRatio : "16:9";
    const [rw, rh] = ratioStr.split(":").map((part: string) => {
        const parsed = parseFloat(part);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    });
    const ratio = rw && rh ? (rh / rw) * 100 : 56.25;
    const allowFullscreen = block.allowFullscreen !== false;

    const outerStyle: React.CSSProperties = {
        ...baseStyle,
        ...injectedStyle,
        width: block.width || baseStyle?.width || "100%",
        marginLeft: baseStyle?.width ? "auto" : undefined,
        marginRight: baseStyle?.width ? "auto" : undefined,
    };
    const heightStyle = block.height ? { height: block.height } : {};

    const title = typeof block.title === "string" && block.title.trim().length > 0
        ? block.title.trim()
        : "Contenu intégré";

    return (
        <div style={outerStyle} className="mb-6">
            <div
                className="relative w-full overflow-hidden rounded-xl shadow-sm"
                style={{ paddingTop: block.height ? undefined : `${ratio}%` }}
            >
                <iframe
                    src={embedUrl}
                    title={title}
                    allowFullScreen={allowFullscreen}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full border-0"
                    style={heightStyle}
                    allow={
                        allowFullscreen
                            ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            : "encrypted-media"
                    }
                />
            </div>
            {block.caption ? (
                <p className="mt-2 text-sm text-slate-500">{block.caption}</p>
            ) : null}
        </div>
    );
};
