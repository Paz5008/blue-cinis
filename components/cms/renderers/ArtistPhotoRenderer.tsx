"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { SmartImage } from "../SmartImage";

export const ArtistPhotoRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { artist, isMobile } = context;
    const baseStyle = composeBlockStyle(block.style || {});

    const st: Record<string, any> = { ...baseStyle, ...injectedStyle };
    if (baseStyle?.width && !isMobile) {
        const align = (baseStyle as any).canvasAlign as "left" | "center" | "right" | undefined;
        if (align === "center") {
            st.marginLeft = "auto";
            st.marginRight = "auto";
        } else if (align === "right") {
            st.marginLeft = "auto";
            st.marginRight = undefined;
        }
    }
    st.overflow = "hidden";

    const hasCustomSize = Boolean((baseStyle?.width || baseStyle?.height) && !isMobile);
    const fit: any = block.objectFit || "cover";
    const objPos: any = block.objectPosition || "center";

    const blockSrc = typeof block.src === "string" ? block.src.trim() : "";
    const fallbackPhotoSrc = typeof artist.photoUrl === "string" ? artist.photoUrl.trim() : "";
    const photoSrc = blockSrc || fallbackPhotoSrc;
    const photoAlt = typeof block.altText === "string" && block.altText.trim().length > 0 ? block.altText.trim() : artist.name;

    const imgStyle: any = hasCustomSize
        ? {
            width: baseStyle?.width ? "100%" : undefined,
            height: baseStyle?.height ? "100%" : undefined,
            objectFit: fit,
            objectPosition: objPos,
        }
        : { objectFit: fit, objectPosition: objPos };

    const scale = Math.max(0.1, Number((baseStyle as any)?.imageScale || 100) / 100);
    const extraImgStyle: any = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "center center" } : {};

    return (
        <div
            style={{ textAlign: block.alignment || "center", ...st }}
            className="mb-4"
        >
            {photoSrc ? (
                <SmartImage
                    context={context}
                    src={photoSrc}
                    alt={photoAlt || ""}
                    className={hasCustomSize ? "" : "w-full"}
                    style={{ ...imgStyle, ...extraImgStyle }}
                    loading="lazy"
                />
            ) : (
                <p className="text-gray-500">Photo de l&apos;artiste indisponible</p>
            )}
        </div>
    );
};
