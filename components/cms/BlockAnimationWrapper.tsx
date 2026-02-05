'use client';

import { m } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    delay?: number;
    type?: 'fadeIn' | 'slideUp' | 'scaleIn';
}

const variants = {
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
    slideUp: {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    },
    scaleIn: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
    },
};

/**
 * Wrapper component that adds scroll-triggered animations to CMS blocks
 * Uses Framer Motion with whileInView for performant scroll animations
 * 
 * @param children - Block content to animate
 * @param delay - Animation delay in seconds (default: 0)
 * @param type - Animation preset: 'fadeIn' | 'slideUp' | 'scaleIn'
 */
export function BlockAnimationWrapper({
    children,
    delay = 0,
    type = 'fadeIn'
}: Props) {
    return (
        <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.25, 0.1, 0.25, 1] // Smooth easing
            }}
            variants={variants[type]}
            style={{ willChange: 'opacity, transform' }}
        >
            {children}
        </m.div>
    );
}

export default BlockAnimationWrapper;
