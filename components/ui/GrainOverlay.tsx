"use client";

import { useEffect, useRef } from 'react';

/**
 * GrainOverlay - Adds a subtle film grain texture to the entire page
 * 
 * This creates an authentic, premium feel similar to high-end portfolio sites.
 * Uses a canvas-generated noise pattern for performance.
 */
export default function GrainOverlay({ opacity = 0.02 }: { opacity?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to small (will be tiled via CSS)
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Generate noise pattern
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const value = Math.random() * 255;
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            data[i + 3] = 255;   // A
        }

        ctx.putImageData(imageData, 0, 0);
    }, []);

    return (
        <div
            className="pointer-events-none fixed inset-0 z-50"
            style={{ opacity }}
            aria-hidden="true"
        >
            <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{
                    imageRendering: 'pixelated',
                    mixBlendMode: 'overlay',
                }}
            />
        </div>
    );
}

