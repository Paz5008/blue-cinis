"use client";

import { useRef, useEffect, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { EventCard, type EventCardProps } from "./EventCard";

interface EventData {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    location: string | null;
    imageUrl: string | null;
}

interface EvenementsPageClientProps {
    events: EventData[];
    totalCount: number;
    locale?: string;
}

export default function EvenementsPageClient({
    events,
    totalCount,
    locale = "fr",
}: EvenementsPageClientProps) {
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
                            className="inline-flex items-center gap-3 text-indigo-400 font-mono text-xs tracking-[0.4em] uppercase mb-6"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="w-12 h-[1px] bg-indigo-400" aria-hidden="true" />
                            Agenda Culturel
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
                            <span className="text-white/30">ÉVÈNEMENTS</span>
                        </m.h1>
                    </div>

                    <m.p
                        className="text-white/50 max-w-md text-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        {totalCount} évènement{totalCount !== 1 ? "s" : ""} à venir — expositions, vernissages et rencontres artistiques
                    </m.p>
                </div>

                {/* Events Grid */}
                {events.length === 0 ? (
                    <m.div
                        className="text-center py-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-white/30"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-xl text-white/50 mb-2">
                                Aucun évènement programmé
                            </p>
                            <p className="text-white/30 text-sm">
                                Abonnez-vous à notre newsletter pour être informé des prochains évènements.
                            </p>
                        </div>
                    </m.div>
                ) : (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        role="list"
                        aria-label="Liste des évènements"
                    >
                        {events.map((event, index) => (
                            <EventCard
                                key={event.id}
                                id={event.id}
                                title={event.title}
                                description={event.description}
                                date={event.date}
                                location={event.location}
                                imageUrl={event.imageUrl}
                                index={index}
                                prefersReducedMotion={prefersReducedMotion}
                                locale={locale}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
