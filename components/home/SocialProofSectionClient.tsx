"use client";

import { useRef, useEffect, useState } from "react";
import { m, useScroll, useTransform, useInView } from "framer-motion";
import Image from "next/image";

interface GalleryStats {
    collectors: number;
    artists: number;
    artworks: number;
    salesVolume: number;
}

interface SocialProofClientProps {
    stats: GalleryStats;
}

// Testimonials data
const TESTIMONIALS = [
    {
        id: "1",
        quote: "Loire Gallery helped me discover an artist whose work now hangs in my living room. The curation is impeccable.",
        author: "Marie-Claire D.",
        role: "Collector, Paris",
        avatar: "/uploads/artwork-portrait-01.png",
        purchasedWork: "Echoes of Light"
    },
    {
        id: "2",
        quote: "As an emerging artist, this platform gave me visibility I couldn't have achieved elsewhere. My sales tripled.",
        author: "Thomas K.",
        role: "Artist, Berlin",
        avatar: "/uploads/artwork-portrait-02.png",
        purchasedWork: null
    },
    {
        id: "3",
        quote: "The buying experience was seamless. From discovery to delivery, every step felt premium and personal.",
        author: "James & Sarah M.",
        role: "Collectors, London",
        avatar: "/uploads/artwork-landscape-01.png",
        purchasedWork: "Urban Fragments III"
    }
];

// Press logos (would be real logo images in production)
const PRESS_LOGOS = [
    { name: "Artsy", src: "/press/artsy.svg" },
    { name: "HyperAllergic", src: "/press/hyperallergic.svg" },
    { name: "Le Monde", src: "/press/lemonde.svg" },
    { name: "Frieze", src: "/press/frieze.svg" },
    { name: "ArtNet", src: "/press/artnet.svg" },
];

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    useEffect(() => {
        if (startOnView && !isInView) return;
        if (hasStarted) return;

        setHasStarted(true);
        let startTime: number | null = null;
        const startValue = 0;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (end - startValue) * easeOut);

            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration, isInView, startOnView, hasStarted]);

    return { count, ref };
}

// Format large numbers
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `€${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
}

// Format sales volume
function formatCurrency(num: number): string {
    if (num >= 1000000) {
        return `€${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `€${Math.round(num / 1000)}K`;
    }
    return `€${num}`;
}

// Single stat with animated counter
function AnimatedStat({ value, label, format }: { value: number; label: string; format: "number" | "currency" }) {
    const { count, ref } = useAnimatedCounter(value, 2500);
    const displayValue = format === "currency" ? formatCurrency(count) : formatNumber(count);

    return (
        <div ref={ref} className="text-center">
            <m.div
                className="text-3xl md:text-4xl font-grand-slang text-white mb-1 tabular-nums"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                {displayValue}
            </m.div>
            <div className="text-white/40 text-sm font-mono uppercase tracking-wider">
                {label}
            </div>
        </div>
    );
}

export default function SocialProofClient({ stats }: SocialProofClientProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.2], [50, 0]);

    const statsData = [
        { value: stats.collectors, label: "Collectors", format: "number" as const },
        { value: stats.artists, label: "Artists", format: "number" as const },
        { value: stats.artworks, label: "Artworks", format: "number" as const },
        { value: stats.salesVolume, label: "Sales Volume", format: "currency" as const },
    ];

    return (
        <section
            ref={sectionRef}
            className="relative z-20 overflow-hidden bg-[#030303]"
            aria-label="Social proof and statistics"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent" />

            <m.div
                className="container mx-auto px-6 relative z-10"
                style={prefersReducedMotion ? {} : { opacity, y }}
            >
                {/* Header */}
                <div className="text-center mb-16">
                    <m.span
                        className="inline-flex items-center gap-3 text-blue-400 font-mono text-xs tracking-[0.4em] uppercase mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="w-8 h-[1px] bg-blue-400" aria-hidden="true" />
                        Trusted worldwide
                        <span className="w-8 h-[1px] bg-blue-400" aria-hidden="true" />
                    </m.span>

                    <m.h2
                        className="text-4xl md:text-5xl font-grand-slang text-white mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Join our community
                    </m.h2>

                    <m.p
                        className="text-white/60 text-lg max-w-md mx-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Collectors and artists from around the world trust Loire Gallery
                    </m.p>
                </div>

                {/* Stats Row with animated counters */}
                <m.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    role="list"
                    aria-label="Gallery statistics"
                >
                    {statsData.map((stat, i) => (
                        <div key={i} role="listitem">
                            <AnimatedStat
                                value={stat.value}
                                label={stat.label}
                                format={stat.format}
                            />
                        </div>
                    ))}
                </m.div>

                {/* Press logos carousel (grayscale -> color on hover) */}
                <m.div
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-20 py-8 border-y border-white/5"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    aria-label="Featured in press"
                >
                    {PRESS_LOGOS.map((logo) => (
                        <div
                            key={logo.name}
                            className="text-white/30 hover:text-white transition-all duration-300 grayscale hover:grayscale-0 cursor-default"
                            title={logo.name}
                        >
                            {/* Placeholder text, would be logo images in production */}
                            <span className="font-mono text-sm tracking-wider uppercase">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </m.div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <m.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative"
                        >
                            <article className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors h-full focus-within:ring-2 focus-within:ring-blue-500">
                                {/* Quote icon */}
                                <div className="absolute top-6 right-6 text-4xl text-white/5 font-serif" aria-hidden="true">
                                    "
                                </div>

                                {/* Content */}
                                <blockquote className="text-white/70 text-sm leading-relaxed mb-6 relative z-10">
                                    "{testimonial.quote}"
                                </blockquote>

                                {/* Author */}
                                <footer className="flex items-center gap-4">
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10">
                                        <Image
                                            src={testimonial.avatar}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <cite className="text-white font-medium text-sm not-italic">
                                            {testimonial.author}
                                        </cite>
                                        <div className="text-white/40 text-xs">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </footer>

                                {/* Purchased work badge */}
                                {testimonial.purchasedWork && (
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <span className="text-xs text-blue-400/60 font-mono">
                                            Acquired: "{testimonial.purchasedWork}"
                                        </span>
                                    </div>
                                )}
                            </article>
                        </m.div>
                    ))}
                </div>

            </m.div>
        </section>
    );
}
