"use client";

import { useMemo, Suspense } from "react";
import { Environment } from "@react-three/drei";
import AnimatedFrame from "./AnimatedFrame";
import type { FeaturedArtwork } from "@/lib/data/artworks";
import { ScrollAnimationConfig } from "@/types/scrollytelling";

interface GalleryGroupProps {
    items: FeaturedArtwork[];
    lowQuality?: boolean;
    layoutMap?: Record<string, any>;
}

export default function GalleryGroup({ items, lowQuality = false, layoutMap }: GalleryGroupProps) {
    const layout = useMemo(() => {
        return items.map((item, i) => {
            const saved = layoutMap?.[item.id];
            if (saved) {
                return {
                    position: [saved.x, saved.y, saved.z ?? -i * 5] as [number, number, number],
                    rotation: [saved.rotation || 0, 0, 0] as [number, number, number],
                    scale: saved.scale ?? 1,
                    animation: saved.animation as ScrollAnimationConfig | undefined,
                };
            }
            // Fallback to random/default
            return {
                position: [
                    (Math.random() - 0.5) * 8, // Random X spread
                    (Math.random() - 0.5) * 5, // Random Y spread
                    -3 - i * 5 // Tunnel depth - start at -3 so first artwork is visible
                ] as [number, number, number],
                rotation: [
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.1
                ] as [number, number, number],
                scale: 1,
                animation: undefined
            };
        });
    }, [items, layoutMap]);

    return (
        <group>
            <Environment files="/env/potsdamer_platz_1k.hdr" environmentIntensity={0.5} />

            {items.map((item, i) => (
                item.imageUrl && (
                    /* Granular Suspense for individual texture loading */
                    <Suspense fallback={null} key={item.id}>
                        <AnimatedFrame
                            id={item.id}
                            url={item.imageUrl}
                            position={layout[i].position}
                            rotation={layout[i].rotation}
                            scale={layout[i].scale}
                            lowQuality={lowQuality}
                            animation={layout[i].animation}
                        />
                    </Suspense>
                )
            ))}
        </group>
    );
}
