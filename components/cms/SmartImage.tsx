"use client";

import React from "react";
import Image from "next/image";
import { RenderContext } from "./renderers/types";

interface SmartImageProps {
    context: RenderContext;
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    loading?: "lazy" | "eager";
    width?: number;
    height?: number;
    fill?: boolean;
}

export const SmartImage = ({ context, src, alt, className, style, loading, width, height, fill }: SmartImageProps) => {
    if (!src) return null;

    if (fill) {
        return (
            <div className={`relative ${className}`} style={style}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading={loading}
                />
            </div>
        )
    }

    // Determine dimensions or fallback
    const w = width || 800;
    const h = height || 600;

    return (
        <Image
            src={src}
            alt={alt}
            width={w}
            height={h}
            className={className}
            style={{ ...style, width: '100%', height: 'auto' }} // responsive override
            loading={loading}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
    );
};
