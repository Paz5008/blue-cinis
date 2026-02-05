"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface CategoryWithCount {
    id: string;
    slug: string;
    name: string;
    subtitle?: string;
    description: string;
    image: string;
    count: number;
}

interface CategoriesSectionClientProps {
    categories: CategoryWithCount[];
}

export default function CategoriesSectionClient({ categories }: CategoriesSectionClientProps) {
    const [activeId, setActiveId] = useState<string>(categories[0]?.id || "");
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const activeCategory = categories.find(c => c.id === activeId);
    const transitionDuration = prefersReducedMotion ? 0.1 : 0.4; // Faster 0.4s transitions

    return (
        <section className="relative w-full min-h-[70vh] py-24 overflow-hidden" aria-label="Collections by category">

            {/* Background glow for active category */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <AnimatePresence mode="wait">
                    <m.div
                        key={activeId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: transitionDuration }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={activeCategory?.image || ""}
                            alt=""
                            fill
                            className="object-cover blur-3xl opacity-20 scale-110"
                        />
                    </m.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" />
            </div>

            {/* Section header */}
            <div className="container mx-auto px-6 mb-16 relative z-10">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-blue-400 font-mono text-xs tracking-[0.4em] uppercase block mb-4">
                            Explore by medium
                        </span>
                        <h2 className="font-grand-slang text-5xl md:text-6xl text-white">
                            Collections
                        </h2>
                    </div>
                    <Link
                        href="/galerie"
                        className="hidden md:flex items-center gap-3 text-white/50 hover:text-white transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                        <span className="text-sm tracking-wide">View all</span>
                        <m.span
                            className="text-xl"
                            whileHover={prefersReducedMotion ? {} : { x: 5 }}
                        >→</m.span>
                    </Link>
                </div>
            </div>

            {/* Categories grid */}
            <div className="container mx-auto px-6 relative z-10">
                <div
                    className="flex flex-col md:flex-row gap-3 md:gap-4 h-auto md:h-[55vh]"
                    role="tablist"
                    aria-label="Category selection"
                >

                    {categories.map((cat, index) => {
                        const isActive = activeId === cat.id;

                        return (
                            <m.button
                                key={cat.id}
                                layout={!prefersReducedMotion}
                                onClick={() => setActiveId(cat.id)}
                                onMouseEnter={() => setActiveId(cat.id)}
                                onFocus={() => setActiveId(cat.id)}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${cat.id}`}
                                className="relative cursor-pointer overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black h-32 md:h-full"
                                animate={{
                                    flex: isActive ? 2.5 : 1,
                                }}
                                transition={{
                                    duration: transitionDuration,
                                    ease: [0.32, 0.72, 0, 1]
                                }}
                                style={{
                                    borderRadius: "16px",
                                    minWidth: isActive ? "40%" : "15%"
                                }}
                            >
                                {/* Image */}
                                <m.div
                                    className="absolute inset-0"
                                    animate={{
                                        scale: isActive ? 1 : 1.15,
                                        filter: isActive ? "grayscale(0%) blur(0px)" : "grayscale(100%) blur(2px)"
                                    }}
                                    transition={{ duration: transitionDuration }}
                                >
                                    <Image
                                        src={cat.image}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        loading="lazy"
                                    />
                                </m.div>

                                {/* Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <m.div
                                    className="absolute inset-0 bg-blue-900/20"
                                    animate={{ opacity: isActive ? 0.3 : 0 }}
                                    transition={{ duration: transitionDuration * 0.75 }}
                                />

                                {/* Glow border on active */}
                                <m.div
                                    className="absolute inset-0 rounded-2xl"
                                    animate={{
                                        boxShadow: isActive
                                            ? "inset 0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)"
                                            : "inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                                    }}
                                    transition={{ duration: transitionDuration * 0.75 }}
                                />

                                {/* Index number */}
                                <div className="absolute top-6 left-6" aria-hidden="true">
                                    <span className="font-mono text-xs text-white/40">
                                        0{index + 1}
                                    </span>
                                </div>

                                {/* Content */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 p-6 md:p-8"
                                    id={`panel-${cat.id}`}
                                    role="tabpanel"
                                >
                                    {/* Title - always visible */}
                                    <m.h3
                                        layout={!prefersReducedMotion ? "position" : false}
                                        className="font-grand-slang text-white leading-none"
                                        animate={{
                                            fontSize: isActive ? "2.5rem" : "1.5rem",
                                            opacity: isActive ? 1 : 0.6
                                        }}
                                        transition={{ duration: transitionDuration }}
                                    >
                                        {cat.name}
                                    </m.h3>

                                    {/* Details - only on active */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <m.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: transitionDuration * 0.75, delay: transitionDuration * 0.25 }}
                                                className="mt-4"
                                            >
                                                {cat.subtitle && (
                                                    <span className="text-blue-400 font-mono text-xs tracking-widest block mb-3">
                                                        {cat.subtitle}
                                                    </span>
                                                )}
                                                <p className="text-white/70 text-sm max-w-xs mb-6 hidden md:block">
                                                    {cat.description}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <Link
                                                        href={`/galerie?category=${cat.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="group/link flex items-center gap-3 text-white hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                                                    >
                                                        <span className="text-sm tracking-wide">Explorer</span>
                                                        <m.span
                                                            className="text-lg"
                                                            whileHover={prefersReducedMotion ? {} : { x: 5 }}
                                                        >→</m.span>
                                                    </Link>
                                                    <span className="font-mono text-xs text-white/40">
                                                        {cat.count} œuvres
                                                    </span>
                                                </div>
                                            </m.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </m.button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
