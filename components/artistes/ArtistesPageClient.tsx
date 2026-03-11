"use client";

import { useRef, useEffect, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { ArtistCard, type ArtistCardProps } from "./ArtistCard";

interface ArtistData {
    id: string;
    name: string | null;
    slug: string | null;
    photoUrl: string | null;
    artStyle: string | null;
    biography: string | null;
    works: string[];
    _count: { artworks: number };
}

interface ArtistesPageClientProps {
    artists: ArtistData[];
    totalCount: number;
}

export default function ArtistesPageClient({ artists, totalCount }: ArtistesPageClientProps) {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

    return (
        <section ref={sectionRef} className="relative min-h-screen py-12 md:py-20 overflow-hidden">
            {/* Background gradient with parallax */}
            <m.div
                className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#080808] to-[#030303]"
                style={prefersReducedMotion ? {} : { y: bgY }}
                aria-hidden="true"
            />

            <div className="container mx-auto px-6 relative z-10">
                {/* Section header */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
                    <div>
                        <m.span
                            className="inline-flex items-center gap-3 text-blue-400 font-mono text-xs tracking-[0.4em] uppercase mb-6"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="w-12 h-[1px] bg-blue-400" aria-hidden="true" />
                            Communauté Blue Cinis
                        </m.span>

                        <m.h1
                            className="text-5xl md:text-7xl font-grand-slang text-white leading-[0.95]"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            NOS
                            <br />
                            <span className="text-white/30">ARTISTES</span>
                        </m.h1>
                    </div>

                    <m.p
                        className="text-white/50 max-w-md text-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        {totalCount} artistes émergents et confirmés, sélectionnés pour la force de leur geste artistique
                    </m.p>
                </div>

                {/* Artists Grid */}
                {artists.length === 0 ? (
                    <m.div
                        className="text-center py-20 text-white/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-xl">Aucun artiste ne correspond à vos critères.</p>
                    </m.div>
                ) : (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                        role="list"
                        aria-label="Liste des artistes"
                    >
                        {artists.map((artist, index) => (
                            <ArtistCard
                                key={artist.id}
                                id={artist.id}
                                name={artist.name || "Artiste"}
                                slug={artist.slug}
                                photoUrl={artist.photoUrl}
                                artStyle={artist.artStyle}
                                biography={artist.biography}
                                artworkCount={artist._count.artworks}
                                works={artist.works}
                                index={index}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
