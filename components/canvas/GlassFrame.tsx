"use client";

import { useRef, useState, useEffect } from "react";
import { useTexture, useKTX2, MeshTransmissionMaterial, RoundedBox, Float } from "@react-three/drei";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import * as THREE from "three";
import { easing } from "maath";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

interface GlassFrameProps {
    id: string; // Artwork ID for navigation
    url: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    lowQuality?: boolean;
    scale?: number | [number, number, number];
}

// Camera animation state
interface CameraAnimationState {
    isAnimating: boolean;
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    progress: number;
    onComplete: (() => void) | null;
}

// 1. The Visual Renderer (Architecture & Physics)
function GlassFrameRenderer({
    id,
    texture,
    position,
    rotation,
    lowQuality,
    scale
}: {
    id: string;
    texture: THREE.Texture;
    position: [number, number, number];
    rotation: [number, number, number];
    lowQuality: boolean;
    scale?: number | [number, number, number];
}) {
    const router = useRouter();
    const setIsTransitioning = useStore((state) => state.setIsTransitioning);
    const setActiveArtworkId = useStore((state) => state.setActiveArtworkId);
    const activeArtworkId = useStore((state) => state.activeArtworkId);
    const { camera } = useThree();

    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);

    // Camera animation state (replaces GSAP)
    const cameraAnimationRef = useRef<CameraAnimationState>({
        isAnimating: false,
        startPosition: new THREE.Vector3(),
        targetPosition: new THREE.Vector3(),
        progress: 0,
        onComplete: null,
    });

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Hover scaling
            easing.damp3(
                meshRef.current.scale,
                hovered ? [1.05, 1.05, 1.05] : [1, 1, 1],
                0.2,
                delta
            );

            // --- LOGIQUE GYROSCOPE & SOURIS COMBINÉE ---

            // Souris (Desktop)
            let targetX = state.pointer.y / 10;
            let targetY = -state.pointer.x / 10;

            // Détection Mobile (Naïve mais efficace pour l'exemple)
            const isMobile = window.innerWidth < 768;

            if (isMobile) {
                // Mouvement "organique" automatique sur mobile pour éviter que ce soit statique
                targetX = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
                targetY = Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
            }

            easing.dampE(
                meshRef.current.rotation,
                [targetX, targetY, 0],
                0.5,
                delta
            );
        }

        // Fade out (shrink) other frames if one is active
        if (groupRef.current) {
            if (activeArtworkId && activeArtworkId !== id) {
                easing.damp3(groupRef.current.scale, [0, 0, 0], 0.5, delta);
            }
        }

        // Handle camera animation (replacement for GSAP gsap.to)
        const anim = cameraAnimationRef.current;
        if (anim.isAnimating) {
            // Ease-in-out interpolation over 1.2 seconds
            anim.progress += delta / 1.2;

            if (anim.progress >= 1) {
                anim.progress = 1;
                anim.isAnimating = false;
                camera.position.copy(anim.targetPosition);
                if (anim.onComplete) {
                    anim.onComplete();
                }
            } else {
                // Smooth easing function (power2.inOut equivalent)
                const t = anim.progress;
                const ease = t < 0.5
                    ? 2 * t * t
                    : 1 - Math.pow(-2 * t + 2, 2) / 2;

                camera.position.lerpVectors(anim.startPosition, anim.targetPosition, ease);
            }
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation();
        if (activeArtworkId) return; // Already navigating

        // Trigger state
        setIsTransitioning(true);
        setActiveArtworkId(id);

        // Camera Animation using useFrame-based interpolation (replaces GSAP)
        if (meshRef.current) {
            const targetPos = new THREE.Vector3();
            meshRef.current.getWorldPosition(targetPos);

            // Offset camera to be in front of the artwork
            const offset = 1.6;

            const anim = cameraAnimationRef.current;
            anim.startPosition.copy(camera.position);
            anim.targetPosition.set(targetPos.x, targetPos.y, targetPos.z + offset);
            anim.progress = 0;
            anim.isAnimating = true;
            anim.onComplete = () => {
                router.push(`/galerie/${id}`);
            };
        }
    };

    return (
        <group ref={groupRef} position={position} rotation={rotation} scale={scale} onClick={handleClick}>
            {/* Lévitation Organique */}
            <Float
                speed={2} // Animation speed
                rotationIntensity={0.5} // xyz rotation intensity
                floatIntensity={0.5} // Up/down float intensity
            >
                {/* The Glass Container */}
                <RoundedBox
                    ref={meshRef}
                    args={[1.2, 1.5, 0.15]} // Thin profile
                    radius={0.02}
                    smoothness={4}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        setHover(true);
                        document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={() => {
                        setHover(false);
                        document.body.style.cursor = 'auto';
                    }}
                >
                    {lowQuality ? (
                        <meshPhysicalMaterial
                            transparent
                            opacity={0.3}
                            roughness={0.1}
                            metalness={0.1}
                            color="#ffffff"
                        />
                    ) : (
                        <MeshTransmissionMaterial
                            backside
                            thickness={0.2}
                            roughness={0.1}
                            transmission={1}
                            ior={1.5}
                            chromaticAberration={0.04} // Ethereal effect
                            anisotropy={0.1}
                            resolution={256}
                            samples={4}
                            distortion={0.1}
                            distortionScale={0.1}
                            temporalDistortion={0.1}
                            transmissionSampler={true}
                        />
                    )}

                    {/* The Artwork Plane (Inside the glass, slightly recessed) */}
                    <mesh position={[0, 0, -0.02]} scale={[0.92, 0.92, 1]}>
                        <planeGeometry args={[1.1, 1.4]} />
                        {/* Basic material for performance, relying on glass for effects */}
                        <meshBasicMaterial map={texture} toneMapped={false} />
                    </mesh>
                </RoundedBox>
            </Float>
        </group>
    );
}

// 2. KTX2 Loader Wrapper
function KTX2GlassFrame(props: GlassFrameProps) {
    // Explicitly configure loader path just in case, though useKTX2 usually handles it if configured in Scene
    const texture = useLoader(KTX2Loader, props.url, (loader: KTX2Loader) => {
        loader.setTranscoderPath('/basis/');
    });

    useEffect(() => {
        return () => { texture.dispose(); };
    }, [texture]);

    return (
        <GlassFrameRenderer
            id={props.id}
            texture={texture}
            position={props.position}
            rotation={props.rotation || [0, 0, 0]}
            lowQuality={props.lowQuality || false}
            scale={props.scale}
        />
    );
}

// 3. Standard Texture Loader Wrapper (Fallback)
function StandardGlassFrame(props: GlassFrameProps) {
    const texture = useTexture(props.url);

    useEffect(() => {
        return () => { texture.dispose(); };
    }, [texture]);

    return (
        <GlassFrameRenderer
            id={props.id}
            texture={texture}
            position={props.position}
            rotation={props.rotation || [0, 0, 0]}
            lowQuality={props.lowQuality || false}
            scale={props.scale}
        />
    );
}

// 4. Main Component (Selector)
export default function GlassFrame(props: GlassFrameProps) {
    const isKTX2 = props.url.toLowerCase().endsWith('.ktx2');

    if (isKTX2) {
        return <KTX2GlassFrame {...props} />;
    }

    return <StandardGlassFrame {...props} />;
}

// Make sure to preload commonly used textures if their URLs are static/known
// useKTX2.preload('/textures/placeholder.ktx2') // Example
