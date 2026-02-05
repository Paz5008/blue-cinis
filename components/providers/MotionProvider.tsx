"use client";

/**
 * LazyMotion Provider
 * 
 * This provider enables lazy-loading of Framer Motion features.
 * To fully benefit from this, components should use:
 * - `m.div` instead of `motion.div`
 * - Import from `framer-motion` using: `import { m } from "framer-motion"`
 * 
 * ROADMAP: Migrate all 44 components from `motion.*` to `m.*`
 * Estimated bundle savings: ~20-30KB (gzipped)
 * 
 * @see https://www.framer.com/motion/lazy-motion/
 */

import { LazyMotion, domAnimation, domMax } from "framer-motion";
import { ReactNode } from "react";

interface MotionProviderProps {
    children: ReactNode;
    /**
     * Use 'reduced' for minimal animations (domAnimation)
     * Use 'full' for all features including layout animations (domMax)
     */
    mode?: "reduced" | "full";
}

export function MotionProvider({
    children,
    mode = "full",
}: MotionProviderProps) {
    const features = mode === "full" ? domMax : domAnimation;

    return (
        <LazyMotion features={features} strict>
            {children}
        </LazyMotion>
    );
}
