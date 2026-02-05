"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform, useMotionValue, useAnimationFrame, m } from "framer-motion";

// Social icons as SVG components
const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export default function Footer() {
    const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Motion value for baseFrequency
    const freq = useMotionValue(0.01);
    const smoothFreq = useSpring(freq, { stiffness: 50, damping: 20 });

    useAnimationFrame(() => {
        if (turbulenceRef.current && !prefersReducedMotion) {
            const val = smoothFreq.get();
            turbulenceRef.current.setAttribute("baseFrequency", `${val} ${val}`);
        }
    });

    const handleMouseEnter = () => {
        if (!prefersReducedMotion) freq.set(0.04);
    };

    const handleMouseLeave = () => {
        freq.set(0.01);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    };

    return (
        <footer className="relative w-full pt-24 md:pt-32 pb-12 overflow-hidden z-20 pointer-events-auto" role="contentinfo">
            {/* Background Gradient to blend with 3D/Black */}
            <div
                className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-t from-black via-black/80 to-transparent"
                aria-hidden="true"
            />

            {/* SVG Filter Definition */}
            <svg className="absolute w-0 h-0 hidden" aria-hidden="true">
                <defs>
                    <filter id="liquid-filter">
                        <feTurbulence
                            ref={turbulenceRef}
                            type="fractalNoise"
                            baseFrequency="0.01 0.01"
                            numOctaves="1"
                            result="turbulence"
                        />
                        <feDisplacementMap
                            in2="turbulence"
                            in="SourceGraphic"
                            scale="30"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">

                {/* Massive Interactive CTA - Linking to newsletter section instead of duplicate form */}
                <Link
                    href="#newsletter"
                    className="relative cursor-pointer group mb-24 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <h2
                        className="font-grand-slang text-[12vw] leading-[0.8] text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none tracking-tighter will-change-[filter] transition-opacity duration-500"
                        style={prefersReducedMotion ? {} : { filter: "url(#liquid-filter)" }}
                    >
                        JOIN THE<br />CIRCLE
                    </h2>

                    {/* Hover hint */}
                    <div className="text-center mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white/40 text-sm font-mono tracking-wider">
                            Subscribe to our newsletter ↑
                        </span>
                    </div>
                </Link>

                {/* Back to top button */}
                <m.button
                    onClick={scrollToTop}
                    className="mb-16 w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.05 }}
                    aria-label="Retour en haut de page"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </m.button>

                {/* Social Icons Row */}
                <div className="flex gap-6 mb-12">
                    <a
                        href="https://instagram.com/loiregallery"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Suivez-nous sur Instagram"
                    >
                        <InstagramIcon />
                    </a>
                    <a
                        href="https://linkedin.com/company/loiregallery"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Suivez-nous sur LinkedIn"
                    >
                        <LinkedInIcon />
                    </a>
                    <a
                        href="https://x.com/loiregallery"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Suivez-nous sur X (Twitter)"
                    >
                        <TwitterIcon />
                    </a>
                </div>

                {/* Footer Bar */}
                <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/10 pt-8">
                    {/* Copyright */}
                    <div className="text-xs uppercase tracking-[0.15em] text-white/40 font-inter">
                        © {new Date().getFullYear()} Blue Cinis. Tous droits réservés.
                    </div>

                    {/* Legal Links - Increased size for accessibility (12px minimum) */}
                    <nav className="flex gap-6 md:gap-8" aria-label="Liens légaux">
                        <Link
                            href="/legal/mentions-legales"
                            className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded py-1"
                        >
                            Mentions Légales
                        </Link>
                        <Link
                            href="/legal/confidentialite"
                            className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded py-1"
                        >
                            Confidentialité
                        </Link>
                        <Link
                            href="/legal/cgv"
                            className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded py-1"
                        >
                            CGV
                        </Link>
                    </nav>
                </div>

            </div>
        </footer>
    );
}
