"use client";

import { Suspense, useState, useEffect } from "react";
import { PerspectiveCamera, PerformanceMonitor, useKTX2 } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
// Post-processing imports kept for reference/future use but commented out if logically disabled
import { EffectComposer, Noise, Vignette, Bloom } from "@react-three/postprocessing";

import type { FeaturedArtwork } from "@/lib/data/artworks";
import GalleryGroup from "./GalleryGroup";
import CameraRig from "./CameraRig";
import DustParticles from "./DustParticles";
import PosterGroup from "./PosterGroup";
// ChronoLens removed to restore artwork gallery hero

interface SceneProps {
    items: FeaturedArtwork[];
    totalDepth?: number;
    desktopLayout?: Record<string, any>;
    mobileLayout?: Record<string, any>;
}

export default function Scene({ items, totalDepth = 50, desktopLayout, mobileLayout }: SceneProps) {
    const [lowQuality, setLowQuality] = useState(false);
    const [activeLayout, setActiveLayout] = useState<Record<string, any> | undefined>(undefined);
    const { setDpr } = useThree();

    // Initial Layout Hydration logic (avoids mismatch by waiting for mount)
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            setLowQuality(isMobile);
            setDpr(isMobile ? 1 : 1.5);
            // Switch layout based on width
            if (isMobile && mobileLayout) {
                setActiveLayout(mobileLayout);
            } else if (!isMobile && desktopLayout) {
                setActiveLayout(desktopLayout);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [desktopLayout, mobileLayout, setDpr]);

    // Preload critical textures for the featured items
    useEffect(() => {
        if (items && items.length > 0) {
            items.forEach((item) => {
                if (item.imageUrl && item.imageUrl.endsWith('.ktx2')) {
                    useKTX2.preload(item.imageUrl);
                }
            });
        }
    }, [items]);

    return (
        <>
            {/* Performance Monitoring */}
            <PerformanceMonitor
                onDecline={() => {
                    setDpr(1);
                    setLowQuality(true);
                }}
                onIncline={() => {
                    setDpr(1.5);
                    setLowQuality(false);
                }}
            />

            <Suspense fallback={null}>
                <color attach="background" args={['#050505']} />

                {/* HERO: 3D Artwork Gallery (restored) */}

                {/* Particules d'Ambiance */}
                <DustParticles count={100} />

                {/* Contenu de la Galerie */}
                <GalleryGroup
                    items={items}
                    lowQuality={lowQuality}
                    layoutMap={activeLayout}
                />
                <PosterGroup startZ={-50} />

                {/* Post Processing */}
                {!lowQuality && (
                    <EffectComposer>
                        <Noise opacity={0.025} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                        <Bloom luminanceThreshold={1} intensity={0.5} levels={9} mipmapBlur />
                    </EffectComposer>
                )}
            </Suspense>

            <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={50} />
            <CameraRig totalDepth={totalDepth} />
        </>
    );
}
