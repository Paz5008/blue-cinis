"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence, useScroll, useTransform, type Variants } from "framer-motion";

// Deterministic pseudo-random based on seed (avoids hydration mismatch)
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
}

// Pre-computed particle positions to avoid hydration mismatch
// Values are rounded to avoid floating-point precision differences between server/client
const PARTICLE_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
    left: Math.round(seededRandom(i * 3 + 1) * 10000) / 100,
    top: Math.round(seededRandom(i * 3 + 2) * 10000) / 100,
    duration: Math.round((4 + seededRandom(i * 3 + 3) * 4) * 100) / 100,
    delay: Math.round(seededRandom(i * 3 + 4) * 200) / 100,
}));

// CSS-only floating particles component
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLE_POSITIONS.map((particle, i) => (
                <m.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white/20"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                    }}
                    animate={{
                        y: [-20, 20, -20],
                        x: [-10, 10, -10],
                        opacity: [0.1, 0.3, 0.1],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: particle.delay,
                    }}
                />
            ))}
        </div>
    );
}

// Skeleton preloader with shimmer
function HeroSkeleton() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030303] pointer-events-none">
            {/* Shimmer overlay */}
            <div className="relative">
                {/* Title skeleton */}
                <div className="relative overflow-hidden rounded-lg">
                    <div className="h-24 w-[60vw] max-w-2xl bg-white/5 rounded-lg" />
                    <m.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Subtitle skeleton */}
                <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="relative overflow-hidden rounded">
                        <div className="h-4 w-80 bg-white/5 rounded" />
                        <m.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                    </div>
                    <div className="relative overflow-hidden rounded">
                        <div className="h-4 w-64 bg-white/5 rounded" />
                        <m.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                        />
                    </div>
                </div>

                {/* CTA skeletons */}
                <div className="mt-8 flex gap-4 justify-center">
                    <div className="relative overflow-hidden rounded-full">
                        <div className="h-12 w-40 bg-white/5 rounded-full" />
                        <m.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        />
                    </div>
                    <div className="relative overflow-hidden rounded-full">
                        <div className="h-12 w-36 bg-white/5 rounded-full" />
                        <m.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </div>
                </div>
            </div>

            {/* Loading indicator */}
            <m.div
                className="absolute bottom-12 flex items-center gap-2"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <span className="text-xs text-white/40 tracking-widest uppercase">Loading Experience</span>
                <div className="w-1 h-1 rounded-full bg-blue-400" />
            </m.div>
        </div>
    );
}

// Glassmorphic button styles
const glassButtonPrimary = `
    relative overflow-hidden
    px-8 py-3.5 
    bg-white/10 backdrop-blur-md
    text-white font-medium text-sm tracking-wide 
    rounded-full
    border border-white/20
    transition-all duration-300
    hover:bg-white/20 hover:border-white/40
    hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
    group
`;

const glassButtonSecondary = `
    relative overflow-hidden
    px-8 py-3.5 
    bg-transparent backdrop-blur-sm
    text-white/80 font-medium text-sm tracking-wide 
    rounded-full
    border border-white/20
    transition-all duration-300
    hover:text-white hover:border-white/40
    hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
`;

export default function CinematicOverlay() {
    const [isLoading, setIsLoading] = useState(true);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const title = "BLUE CINIS";
    const letters = title.split("");

    // Check for reduced motion preference
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Simulate loading (in real app, this would be tied to 3D scene load)
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Scroll-based fade out for hero content
    const [viewportHeight, setViewportHeight] = useState(800);
    useEffect(() => {
        setViewportHeight(window.innerHeight);
        const handleResize = () => setViewportHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { scrollY } = useScroll();
    // Fade out between 0 and 80% of viewport height
    const heroOpacity = useTransform(scrollY, [0, viewportHeight * 0.8], [1, 0]);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.05,
                delayChildren: prefersReducedMotion ? 0 : 0.2
            }
        }
    };

    const charVariants: Variants = {
        hidden: {
            y: prefersReducedMotion ? 0 : 100,
            opacity: 0,
            filter: prefersReducedMotion ? "blur(0px)" : "blur(20px)"
        },
        visible: {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            transition: {
                duration: prefersReducedMotion ? 0.3 : 1.5,
                ease: prefersReducedMotion ? "easeOut" : [0.165, 0.84, 0.44, 1] as [number, number, number, number]
            }
        }
    };

    return (
        <>
            {/* Skeleton Preloader */}
            <AnimatePresence>
                {isLoading && (
                    <m.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <HeroSkeleton />
                    </m.div>
                )}
            </AnimatePresence>

            {/* Main Hero Content - Fades out on scroll */}
            <m.div
                className="fixed inset-0 z-20 flex flex-col items-center justify-center select-none pointer-events-none"
                style={{
                    opacity: heroOpacity,
                }}
            >

                {/* Floating Particles Background */}
                {!prefersReducedMotion && <FloatingParticles />}

                {/* TITRE GÉANT */}
                <m.h1
                    className="flex overflow-hidden text-[12vw] font-bold leading-none tracking-tighter text-white mix-blend-overlay"
                    style={{ fontFamily: 'serif' }}
                    variants={containerVariants}
                    initial="hidden"
                    animate={isLoading ? "hidden" : "visible"}
                    aria-label="Blue Cinis"
                >
                    {letters.map((char, i) => (
                        <m.span key={i} className="hero-char block" variants={charVariants}>
                            {char === " " ? "\u00A0" : char}
                        </m.span>
                    ))}
                </m.h1>

                {/* VALUE PROPOSITION */}
                <m.div
                    className="mt-8 text-center pointer-events-auto px-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isLoading ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.3 : 1, delay: prefersReducedMotion ? 0 : 1.2 }}
                >
                    <p className="text-white/60 text-lg md:text-xl font-light tracking-wide mb-8 max-w-xl mx-auto">
                        Curated contemporary art from the world's most promising artists
                    </p>

                    {/* GLASSMORPHIC CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {/* Primary CTA - with gradient glow */}
                        <m.a
                            href="/galerie"
                            className={glassButtonPrimary}
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            aria-label="Explore our art collection"
                        >
                            {/* Gradient border effect */}
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Glow effect on hover */}
                            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }} />
                            <span className="relative z-10">Explore Collection</span>
                        </m.a>

                        {/* Secondary CTA */}
                        <m.a
                            href="/inscription-artiste"
                            className={glassButtonSecondary}
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            aria-label="Learn more about joining as an artist"
                        >
                            For Artists →
                        </m.a>
                    </div>
                </m.div>

                {/* INDICATEUR SCROLL - Enhanced with a11y */}
                <m.div
                    className="absolute bottom-10 flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isLoading ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.3 : 1, delay: prefersReducedMotion ? 0 : 1.5 }}
                    aria-hidden="true"
                >
                    <m.span
                        className="text-xs uppercase tracking-[0.3em] text-white/60 font-light"
                        animate={prefersReducedMotion ? {} : { opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Scroll to explore
                    </m.span>
                    {/* Ligne animée avec pulse */}
                    <m.div
                        className="relative h-16 w-[1px] bg-gradient-to-b from-white/60 to-transparent overflow-hidden"
                    >
                        <m.div
                            className="absolute top-0 left-0 w-full h-4 bg-white"
                            animate={prefersReducedMotion ? {} : { y: [0, 48, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </m.div>
                </m.div>
            </m.div>
        </>
    );
}
