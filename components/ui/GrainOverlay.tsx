"use client";

/**
 * GrainOverlay - Adds a subtle film grain texture to the entire page
 * 
 * Optimized version: Uses an inline SVG background with feTurbulence 
 * which is infinitely faster than rendering and mix-blending a Canvas.
 */
export default function GrainOverlay({ opacity = 0.04 }: { opacity?: number }) {
    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 h-screen w-screen"
            style={{ opacity, mixBlendMode: 'overlay' }}
            aria-hidden="true"
        >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full opacity-50">
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="3"
                        stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
        </div>
    );
}
