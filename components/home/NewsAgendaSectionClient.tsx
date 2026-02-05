"use client";

import { useRef } from "react";
import Link from "next/link";
import { m, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, MapPin, CalendarDays } from "lucide-react";
import clsx from "clsx";

// Types simplifiés pour l'exemple
type NewsItem = {
    id: string;
    title: string;
    dateLabel: string;
    location: string;
    category: string;
};

// Composant pour un point individuel de la timeline
function TimelineEvent({ item, index, total, scrollYProgress }: any) {
    // Calcul de la position d'activation (0 à 1 le long de la section)
    const position = (index + 0.5) / total;

    // Le point s'active quand la ligne lumineuse le dépasse
    const isActive = useTransform(scrollYProgress, (v: number) => v >= position);

    // Animations basées sur le scroll
    const opacity = useTransform(scrollYProgress, [position - 0.1, position], [0.2, 1]);
    const scale = useTransform(scrollYProgress, [position - 0.1, position], [0.8, 1]);

    // Glow effect quand actif
    const glow = useTransform(scrollYProgress, [position - 0.05, position], [0, 1]);

    return (
        <div className="relative grid grid-cols-[1fr_auto_1fr] gap-8 items-center w-full max-w-5xl mx-auto py-12">

            {/* Côté GAUCHE (Date & Catégorie) - Alternance possible si tu veux */}
            <m.div
                style={{ opacity, scale }}
                className="text-right flex flex-col items-end"
            >
                <span className="font-mono text-blue-400 text-xs tracking-widest uppercase mb-2">{item.category}</span>
                <h3 className="font-grand-slang text-3xl md:text-5xl text-white">{item.dateLabel}</h3>
            </m.div>

            {/* CENTRE (Le noeud de la timeline) */}
            <div className="relative flex justify-center items-center">
                {/* Point inactif (gris) */}
                <div className="w-3 h-3 rounded-full bg-white/10" />

                {/* Point actif (Bleu + Glow) qui scale par dessus */}
                <m.div
                    style={{ opacity: glow }}
                    className="absolute w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"
                />
            </div>

            {/* Côté DROIT (Détails Card) */}
            <m.div
                style={{ opacity, x: useTransform(scrollYProgress, [position - 0.1, position], [50, 0]) }}
                className="glass-panel-dark p-6 rounded-xl border border-white/10 hover:border-blue-500/30 transition-colors group cursor-pointer"
            >
                <h4 className="text-xl text-white mb-2 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                <div className="flex items-center gap-4 text-white/50 text-sm font-mono">
                    <div className="flex items-center gap-1"><MapPin size={14} /> {item.location}</div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-400" />
                </div>
            </m.div>

        </div>
    );
}

export default function NewsAgendaSectionClient({ events }: { events: NewsItem[] }) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"]
    });

    // Lissage du remplissage de la ligne
    const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    return (
        <section ref={containerRef} className="relative w-full">

            {/* LA LIGNE CENTRALE */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2">
                {/* La ligne lumineuse qui descend */}
                <m.div
                    style={{ scaleY, transformOrigin: "top" }}
                    className="w-full h-full bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                />
            </div>

            <div className="relative z-10 flex flex-col">
                {events.map((event, i) => (
                    <TimelineEvent
                        key={event.id}
                        item={event}
                        index={i}
                        total={events.length}
                        scrollYProgress={scrollYProgress}
                    />
                ))}
            </div>

            <div className="text-center mt-16 relative z-10">
                <Link href="/evenements" className="inline-block border-b border-white/30 pb-1 text-xs font-mono text-white/60 hover:text-white hover:border-white transition-colors uppercase tracking-widest">
                    Voir tout l'agenda
                </Link>
            </div>

        </section>
    );
}
