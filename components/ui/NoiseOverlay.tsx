"use client";

import { useEffect, useState } from "react";

/**
 * NoiseOverlay - Subtle film grain texture overlay
 * 
 * Performance optimizations:
 * - Animation slowed from 1s to 4s cycle
 * - Uses CSS will-change for GPU optimization
 * - Respects prefers-reduced-motion
 * - Optional: Can be replaced with static WebP texture for maximum performance
 */
export default function NoiseOverlay() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check user preference for reduced motion
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // If user prefers reduced motion, show static noise
    if (prefersReducedMotion) {
        return (
            <div
                className="pointer-events-none fixed inset-0 z-[100] overflow-hidden opacity-[0.03]"
                style={{ willChange: 'auto' }}
            >
                <svg
                    className="h-full w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <filter id="noiseFilterStatic">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.65"
                            stitchTiles="stitch"
                            numOctaves="3"
                            seed="42"
                        />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilterStatic)" />
                </svg>
            </div>
        );
    }

    return (
        <div
            className="pointer-events-none fixed inset-0 z-[100] overflow-hidden opacity-[0.03]"
            style={{ willChange: 'contents' }}
        >
            <svg
                className="h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.65"
                        stitchTiles="stitch"
                        numOctaves="3"
                        seed="0"
                    >
                        {/* 
                         * Animation optimized:
                         * - Duration increased from 1s to 4s (75% less GPU work)
                         * - Seed range reduced from 0-10 to 0-5 (smoother, less jarring)
                         */}
                        <animate
                            attributeName="seed"
                            from="0"
                            to="5"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </feTurbulence>
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </div>
    );
}
