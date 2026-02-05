"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";

/**
 * CameraRig - Scroll-driven camera movement for Three.js scene
 * 
 * Migrated from GSAP ScrollTrigger + Lenis to native scroll events.
 * This eliminates GSAP dependency while maintaining smooth camera movement.
 */
export default function CameraRig({ totalDepth = 50 }: { totalDepth?: number }) {
    const { camera, size, pointer } = useThree();
    const scrollProgressRef = useRef(0);
    const targetCameraZRef = useRef(0);

    // Calculate scroll progress from native scroll events
    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        scrollProgressRef.current = Math.max(0, Math.min(1, progress));

        // Update target camera Z based on scroll progress
        targetCameraZRef.current = -scrollProgressRef.current * totalDepth;

        // Update active artwork index based on camera Z
        const currentIndex = Math.round(Math.abs(targetCameraZRef.current) / 5);
        const { activeArtworkIndex, setActiveArtworkIndex } = useStore.getState();

        if (currentIndex !== activeArtworkIndex) {
            setActiveArtworkIndex(currentIndex);
        }
    }, [totalDepth]);

    // Initialize scroll listener
    useLayoutEffect(() => {
        // Initial calculation
        handleScroll();

        // Add passive scroll listener for performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    // Handle scroll blocking based on app state
    useEffect(() => {
        const unsubscribe = useStore.subscribe((state) => {
            const { isTransitioning, introFinished } = state;

            // Should scroll be blocked?
            // - If intro not finished (!introFinished) -> Blocked
            // - If transitioning (isTransitioning) -> Blocked
            const shouldBlock = !introFinished || isTransitioning;

            if (shouldBlock) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Initial check
        const { introFinished } = useStore.getState();
        if (!introFinished) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            unsubscribe();
            document.body.style.overflow = '';
        };
    }, []);

    useFrame((state, delta) => {
        // Skip if transitioning (GlassFrame handles camera)
        const isTransitioning = useStore.getState().isTransitioning;
        if (isTransitioning) return;

        // Smooth camera Z movement towards target (scrub effect)
        // Using exponential smoothing instead of GSAP scrub
        const smoothFactor = 1 - Math.pow(0.001, delta); // ~60fps adjusted
        camera.position.z += (targetCameraZRef.current - camera.position.z) * smoothFactor * 3;

        // Parallax / LookAt
        // Move camera position slightly based on pointer (X/Y only)
        const parallaxX = (pointer.x * size.width) * 0.0005;
        const parallaxY = (pointer.y * size.height) * 0.0005;

        // Note: We only animate X/Y offset here. Z is controlled by scroll above.
        // We use damping for smooth mouse follow
        camera.position.x += (parallaxX - camera.position.x) * delta * 2;
        camera.position.y += (parallaxY - camera.position.y) * delta * 2;

        // Rotation to look at mouse
        const targetRotX = -pointer.y * 0.02;
        const targetRotY = -pointer.x * 0.02;

        camera.rotation.x += (targetRotX - camera.rotation.x) * delta * 2;
        camera.rotation.y += (targetRotY - camera.rotation.y) * delta * 2;
    });

    return null;
}
