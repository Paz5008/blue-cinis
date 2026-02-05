"use client";

import { useRef, ReactNode, useEffect, useState } from "react";

interface SmoothScrollProps {
    children: ReactNode;
}

/**
 * SmoothScroll - Provides smooth scrolling behavior
 * 
 * Performance optimization: Lenis can be disabled via environment variable
 * to evaluate impact on bundle size (~10KB) vs UX quality.
 * 
 * Set NEXT_PUBLIC_DISABLE_LENIS=true to use CSS-only smooth scroll
 */
export default function SmoothScroll({ children }: SmoothScrollProps) {
    const [useLenis, setUseLenis] = useState(false);
    const lenisRef = useRef<any>(null);
    const LenisComponentRef = useRef<any>(null);

    useEffect(() => {
        // Check if Lenis should be enabled
        const shouldUseLenis = process.env.NEXT_PUBLIC_DISABLE_LENIS !== 'true';

        if (shouldUseLenis) {
            // Dynamic import to avoid loading Lenis if disabled
            import('lenis/react').then((mod) => {
                LenisComponentRef.current = mod.ReactLenis;
                setUseLenis(true);
            }).catch(() => {
                // If Lenis fails to load, fall back to CSS
                console.warn('Lenis failed to load, using CSS smooth scroll');
            });
        } else {
            // Apply CSS smooth scroll as fallback
            document.documentElement.style.scrollBehavior = 'smooth';
        }

        return () => {
            // Cleanup CSS style on unmount
            document.documentElement.style.scrollBehavior = '';
        };
    }, []);

    // If Lenis is loaded and enabled, use it
    if (useLenis && LenisComponentRef.current) {
        const ReactLenis = LenisComponentRef.current;
        return (
            <ReactLenis root ref={lenisRef} autoRaf={true}>
                {children}
            </ReactLenis>
        );
    }

    // Fallback: just render children with CSS smooth scroll applied
    return <>{children}</>;
}
