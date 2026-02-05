'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { m, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeepZoomImageProps {
    src: string;        // Base Cloudinary URL or Public ID
    alt: string;
    width?: number;
    height?: number;
    aspectRatio?: string;
    className?: string;
}

export function DeepZoomImage({ src, alt, width = 800, height = 600, className }: DeepZoomImageProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [isHdLoaded, setIsHdLoaded] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Construct HD Source (Mock logic assuming Cloudinary URL structure)
    // In a real app, use a proper URL builder. 
    // Here we simulate fetching the "original" or "large" variant.
    // If src is already full URL, we append params?
    // User Prompt: "remplace par l'image haute résolution (>2000px)"

    // Strategy: 
    // 1. Render normal Next.js Image (optimized).
    // 2. When zoomed, allow Next.js to request a higher quality or larger size?
    // Actually Next.js Image `quality` prop can be dynamic.

    const handleInteraction = () => {
        if (showHint) setShowHint(false);
        setIsZoomed(!isZoomed);
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden cursor-zoom-in touch-manipulation", className)}
            onClick={handleInteraction}
            style={{ width: '100%', height: 'auto', aspectRatio: '4/3' }} // Default ratio if not passed
        >
            <m.div
                className="w-full h-full"
                animate={{
                    scale: isZoomed ? 2.5 : 1,
                    cursor: isZoomed ? 'zoom-out' : 'zoom-in'
                }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* We use standard Next/Image. 
            When zoomed, we ideally want the browser to fetch the higher resolution srcSet.
            However, scaling a 800px image to 2.5x looks blurry.
            We need to force a high-res load.
        */}
                <Image
                    src={src}
                    alt={alt}
                    width={isZoomed ? 2400 : width}
                    height={isZoomed ? 1800 : height}
                    quality={isZoomed ? 90 : 75} // Quality Switch
                    priority={isZoomed} // Priority load when zoomed
                    sizes={isZoomed ? "200vw" : "(max-width: 768px) 100vw, 800px"}
                    className="object-cover w-full h-full"
                    onLoadingComplete={() => isZoomed && setIsHdLoaded(true)}
                />
            </m.div>

            {/* Hint Indicator */}
            <AnimatePresence>
                {showHint && !isZoomed && (
                    <m.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium pointer-events-none"
                    >
                        <Search size={14} />
                        <span>Zoomer</span>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Loading State for HD */}
            {isZoomed && !isHdLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
