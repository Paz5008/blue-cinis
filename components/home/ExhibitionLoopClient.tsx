"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";

export interface ExhibitionArtist {
    id: string;
    name: string;
    image: string;
    portrait: string;
    slug: string;
    role: string;
    location: string;
    works: number;
    tagline: string;
}

interface ExhibitionLoopClientProps {
    artists: ExhibitionArtist[];
}

export default function ExhibitionLoopClient({ artists }: ExhibitionLoopClientProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const activeArtist = artists[activeIndex];

    // Check for reduced motion preference
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % artists.length);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + artists.length) % artists.length);
        }
    }, [artists.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("keydown", handleKeyDown as EventListener);
        return () => container.removeEventListener("keydown", handleKeyDown as EventListener);
    }, [handleKeyDown]);

    // Breathing animation for active portrait
    const breathingAnimation = prefersReducedMotion
        ? undefined
        : {
            scale: [1, 1.02, 1],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
        };

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen w-full overflow-hidden z-30 py-24"
            tabIndex={0}
            role="region"
            aria-label="Artistes en vedette"
            aria-roledescription="carousel"
        >
            {/* ARIA Live Region for announcements */}
            <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                Artiste {activeIndex + 1} sur {artists.length}: {activeArtist?.name}
            </div>

            {/* Background - Artist Featured Work */}
            <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence mode="wait">
                    <m.div
                        key={activeArtist.id}
                        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.05 }}
                        transition={{ duration: prefersReducedMotion ? 0.3 : 0.8, ease: [0.32, 0.72, 0, 1] }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={activeArtist.image}
                            alt=""
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                    </m.div>
                </AnimatePresence>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 relative z-10 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[70vh] items-center">

                    {/* Left: Artist Navigation */}
                    <div className="order-2 lg:order-1">
                        <div className="mb-8">
                            <span className="text-blue-400 font-mono text-xs tracking-[0.4em] uppercase block mb-4">
                                Featured Artists
                            </span>
                            <h2 className="text-4xl md:text-5xl font-grand-slang text-white leading-tight">
                                The Gallery
                                <br />
                                <span className="text-white/40">Roster</span>
                            </h2>
                        </div>

                        {/* Artist List with keyboard navigation hints */}
                        <div
                            className="space-y-0"
                            role="listbox"
                            aria-label="Liste des artistes"
                        >
                            {artists.map((artist, index) => {
                                const isActive = index === activeIndex;
                                return (
                                    <m.button
                                        key={artist.id}
                                        onClick={() => setActiveIndex(index)}
                                        role="option"
                                        aria-selected={isActive}
                                        className={`w-full text-left py-6 border-t border-white/10 last:border-b group flex items-center gap-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isActive ? 'bg-white/5' : ''}`}
                                        whileHover={prefersReducedMotion ? {} : { x: 10 }}
                                    >
                                        {/* Index */}
                                        <span className={`font-mono text-sm w-8 transition-colors ${isActive ? 'text-blue-400' : 'text-white/30'}`}>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>

                                        {/* Mini Portrait with breathing animation when active */}
                                        <m.div
                                            className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${isActive ? 'border-blue-500 scale-110' : 'border-white/20'}`}
                                            animate={isActive ? breathingAnimation : {}}
                                        >
                                            <Image
                                                src={artist.portrait}
                                                alt={artist.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </m.div>

                                        {/* Name & Role */}
                                        <div className="flex-1">
                                            <h3 className={`text-xl md:text-2xl font-grand-slang transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                                                {artist.name}
                                            </h3>
                                            <span className={`text-xs font-mono uppercase tracking-wider transition-colors ${isActive ? 'text-blue-400' : 'text-white/30'}`}>
                                                {artist.role}
                                            </span>
                                        </div>

                                        {/* Works count */}
                                        <div className={`text-right transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                                            <span className="font-mono text-2xl text-white">{artist.works}</span>
                                            <span className="block text-xs text-white/40">œuvres</span>
                                        </div>
                                    </m.button>
                                );
                            })}
                        </div>

                        {/* Keyboard hints */}
                        <p className="text-white/30 text-xs mt-4 hidden lg:block">
                            ↑↓ Utilisez les flèches pour naviguer
                        </p>

                        {/* View All CTA */}
                        <Link
                            href="/artistes"
                            className="inline-flex items-center gap-4 mt-8 text-white/50 hover:text-white transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                        >
                            <span className="text-sm tracking-wide">Voir tous les artistes</span>
                            <m.div
                                className="w-10 h-10 border border-current rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all"
                                whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 45 }}
                            >
                                →
                            </m.div>
                        </Link>
                    </div>

                    {/* Right: Featured Artist Card */}
                    <div className="order-1 lg:order-2">
                        <AnimatePresence mode="wait">
                            <m.div
                                key={activeArtist.id}
                                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
                                transition={{ duration: prefersReducedMotion ? 0.2 : 0.5 }}
                                className="relative"
                            >
                                {/* Artist Card */}
                                <Link
                                    href={`/artistes/${activeArtist.slug}`}
                                    className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-2xl"
                                    aria-label={`Voir le profil de ${activeArtist.name}`}
                                >
                                    <m.div
                                        className="relative aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors"
                                        animate={prefersReducedMotion ? {} : breathingAnimation}
                                    >
                                        {/* Portrait */}
                                        <Image
                                            src={activeArtist.portrait}
                                            alt={activeArtist.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                        {/* Glow effect */}
                                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-8">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-white/60 text-xs font-mono">{activeArtist.location}</span>
                                            </div>

                                            <h3 className="text-3xl md:text-4xl font-grand-slang text-white mb-3">
                                                {activeArtist.name}
                                            </h3>

                                            <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                                "{activeArtist.tagline}"
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                                                <div>
                                                    <span className="font-mono text-2xl text-white">{activeArtist.works}</span>
                                                    <span className="block text-xs text-white/40">Œuvres</span>
                                                </div>
                                                <div className="h-8 w-[1px] bg-white/10" />
                                                <div>
                                                    <span className="text-blue-400 text-sm font-mono uppercase tracking-wider">
                                                        {activeArtist.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* View Profile Button */}
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <m.div
                                                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                                                whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 45 }}
                                            >
                                                <span className="text-white text-lg">→</span>
                                            </m.div>
                                        </div>
                                    </m.div>
                                </Link>
                            </m.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Progress dots on mobile */}
            <div className="flex justify-center gap-2 mt-8 lg:hidden" role="tablist" aria-label="Navigation artistes">
                {artists.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        role="tab"
                        aria-selected={index === activeIndex}
                        aria-label={`Artiste ${index + 1}`}
                        className={`w-2 h-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${index === activeIndex ? 'bg-blue-500 w-4' : 'bg-white/30 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </section>
    );
}
