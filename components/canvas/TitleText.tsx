"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function TitleText() {
    const textRef = useRef<THREE.Mesh>(null);

    useFrame(({ camera }) => {
        if (textRef.current) {
            // Calculate distance from camera to text (at z=0)
            const dist = camera.position.z - 0; // Text is at 0

            // Fade out logic
            // Visible when camera is far (positive Z), fades as it gets close to 0 or passes it.
            // Let's say max opacity at z=5, 0 opacity at z=1.

            let opacity = 0;
            if (camera.position.z > 0.5) {
                // Map range [0.5, 4] to [0, 1]
                opacity = Math.min(1, Math.max(0, (camera.position.z - 0.5) / 3));
            }

            // Apply opacity to material
            if (textRef.current.material instanceof THREE.Material) {
                textRef.current.material.opacity = opacity;
                textRef.current.material.transparent = true;
                textRef.current.material.needsUpdate = true;
            } else if (Array.isArray(textRef.current.material)) {
                // Handle array of materials if necessary
                textRef.current.material.forEach((m) => {
                    m.opacity = opacity;
                    m.transparent = true;
                });
            }
        }
    });

    return (
        <Text
            ref={textRef}
            position={[0, 0, 0]}
            fontSize={1.5}
            font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff" // Playfair Display
            color="white"
            anchorX="center"
            anchorY="middle"
        >
            BLUE CINIS
        </Text>
    );
}
