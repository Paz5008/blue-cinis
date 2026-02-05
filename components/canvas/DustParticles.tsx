"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

export default function DustParticles({ count = 100 }) {
    const ref = useRef<THREE.Points>(null);

    // Generate random positions in a tunnel/cylinder shape along Z axis
    const particles = useMemo(() => {
        const temp = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Random usage of polar coordinates for cylinder distribution
            const theta = Math.random() * Math.PI * 2;
            // Radius between 2 and 15 to stay outside the immediate camera path but visible
            const r = 2 + Math.random() * 13;

            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            // Z spread along the tunnel length (e.g., -50 to 10)
            const z = (Math.random() - 0.8) * 60;

            temp[i * 3] = x;
            temp[i * 3 + 1] = y;
            temp[i * 3 + 2] = z;
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (ref.current) {
            // Subtle rotation of the entire particle system
            ref.current.rotation.z += delta * 0.05;
        }
    });

    return (
        <group>
            <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#ffffff"
                    opacity={1} /* Full opacity as requested */
                    size={0.05}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                />
            </Points>
        </group>
    );
}
