'use client';

import React, { useRef } from 'react';
import { Float } from '@react-three/drei';
import GlassFrame from './GlassFrame';
import { ScrollAnimationConfig } from '@/types/scrollytelling';
import * as THREE from 'three';

interface AnimatedFrameProps {
    id: string;
    url: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: number | [number, number, number];
    lowQuality?: boolean;
    animation?: ScrollAnimationConfig;
}

export default function AnimatedFrame({
    id,
    url,
    position,
    rotation,
    scale = 1,
    lowQuality,
    animation
}: AnimatedFrameProps) {
    const groupRef = useRef<THREE.Group>(null);
    const floatRef = useRef<THREE.Group>(null);

    // Note: Scroll-based animation logic removed to eliminate GSAP dependency.
    // Future implementation should use @react-three/drei ScrollControls or framer-motion-3d.
    // Current behavior: Static positioning as defined by layout.

    const content = (
        <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
            <GlassFrame
                id={id}
                url={url}
                position={[0, 0, 0]} // Relative to group
                rotation={[0, 0, 0]}
                scale={1}
                lowQuality={lowQuality}
            />
        </group>
    );

    if (animation?.scrollSpeed || animation?.rotationIntensity) {
        return (
            <Float
                speed={animation.scrollSpeed || 1}
                rotationIntensity={animation.rotationIntensity || 1}
                floatIntensity={1}
                ref={floatRef}
            >
                {content}
            </Float>
        );
    }

    return content;
}
