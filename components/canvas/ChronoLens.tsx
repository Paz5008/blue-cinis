"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Text } from "@react-three/drei";

export default function ChronoLens() {
    const meshRef = useRef<any>(null);
    const { viewport } = useThree();

    useFrame((state) => {
        if (meshRef.current) {
            // Rotation douce et hypnotique
            meshRef.current.rotation.x += 0.005;
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.z += 0.002;
        }
    });

    return (
        <group scale={[viewport.width / 3, viewport.width / 3, 1]}>

            {/* 1. LE TEXTE DERRIÈRE (Qui sera déformé) */}
            <Text
                position={[0, 0, -2]}
                fontSize={0.8}
                color="white"
                // font="/fonts/Inter-Bold.woff" // Removed to avoid 404 if font missing, defaults to system font or default.
                anchorX="center"
                anchorY="middle"
            >
                BLUE CINIS
            </Text>

            {/* 2. LA LENTILLE LIQUIDE */}
            {/* Une forme géométrique complexe (Icosahedron) pour accrocher la lumière */}
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[1, 2]} /> {/* Forme sphérique détaillée */}

                {/* LE MATÉRIAU MAGIQUE (Plus besoin de shader manuel) */}
                <MeshTransmissionMaterial
                    backside={true}
                    samples={4}            // Qualité de la réfraction
                    resolution={512}       // Résolution de l'image déformée
                    transmission={1}       // 100% transparent (verre)
                    roughness={0.0}        // Lisse comme de l'eau
                    thickness={3.5}        // Épaisseur de la lentille
                    ior={1.5}              // Indice de réfraction (Verre)
                    chromaticAberration={0.1} // Effet de prisme sur les bords (Cinématique)
                    anisotropy={0.1}
                    distortion={0.5}       // <--- C'est ici que l'effet liquide se joue
                    distortionScale={0.3}  // Taille des vagues
                    temporalDistortion={0.1} // Vitesse du mouvement (Animé automatiquement !)
                    color="#a8b1ff"        // Légère teinte bleu cinis
                    background={undefined}
                />
            </mesh>
        </group>
    );
}
