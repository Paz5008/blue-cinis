"use client";

import { useMemo, useRef } from "react";
import { useTexture, shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 1. Définition du Shader "Paper Bend"
const PaperMaterial = shaderMaterial(
    {
        uTexture: new THREE.Texture(),
        uBent: 0.1, // Intensité de la courbure
    },
    // Vertex Shader : Courbure du papier
    `
    varying vec2 vUv;
    uniform float uBent;
    void main() {
      vUv = uv;
      vec3 pos = position;
      // Courbure simple sur l'axe X pour simuler une affiche qui pend
      pos.z -= sin(uv.x * 3.1415) * uBent;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    // Fragment Shader : Rendu Mat
    `
    uniform sampler2D uTexture;
    varying vec2 vUv;
    void main() {
      vec4 textureColor = texture2D(uTexture, vUv);
      // Ajout d'un léger bruit ou ajustement gamma si nécessaire
      gl_FragColor = textureColor;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ PaperMaterial });

// Déclaration TypeScript pour le JSX
declare global {
    namespace JSX {
        interface IntrinsicElements {
            paperMaterial: any;
        }
    }
}

export default function Poster({ url, position, rotation = [0, 0, 0], scale = [1, 1.4, 1] }: any) {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useTexture(url);

    // Mouvement flottant doux
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <mesh ref={meshRef}>
                {/* Plane avec assez de segments pour que la courbure soit lisse */}
                <planeGeometry args={[1, 1.4, 32, 32]} />
                <paperMaterial uTexture={texture} uBent={0.15} transparent side={THREE.DoubleSide} />
            </mesh>

            {/* Ombre portée simulée pour la profondeur */}
            <mesh position={[0, 0, -0.05]} scale={[1.05, 1.05, 1]}>
                <planeGeometry args={[1, 1.4, 32, 32]} />
                <meshBasicMaterial color="#000000" opacity={0.3} transparent />
            </mesh>
        </group>
    );
}
