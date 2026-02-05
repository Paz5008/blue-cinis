"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, m } from "framer-motion";

const MANIFESTO_POINTS = [
    {
        order: "01",
        title: "HONOR THE MATTER",
        text: "We believe in the tangible weight of art. In a digital age, we curate works that demand to be touched, held, and felt.",
        // Abstract illustration gradients
        gradient: "from-blue-600/20 via-indigo-500/10 to-transparent",
        shape: "circle"
    },
    {
        order: "02",
        title: "LIGHT IS THE ARCHITECT",
        text: "Every piece is selected for how it captures, refracts, or absorbs light. The gallery is not just a space, it is a prism.",
        gradient: "from-amber-500/15 via-orange-400/10 to-transparent",
        shape: "diamond"
    },
    {
        order: "03",
        title: "TIMELESS RESONANCE",
        text: "Trends fade. We seek the eternal echo. Art that speaks to the past while forging the future.",
        gradient: "from-purple-600/20 via-pink-500/10 to-transparent",
        shape: "wave"
    }
];

// Abstract illustration component
function AbstractIllustration({ shape, gradient, isActive }: { shape: string; gradient: string; isActive: boolean }) {
    const shapeClasses: Record<string, string> = {
        circle: "rounded-full",
        diamond: "rotate-45 rounded-xl",
        wave: "rounded-[40%_60%_70%_30%/30%_30%_70%_70%]"
    };

    return (
        <AnimatePresence mode="wait">
            {isActive && (
                <m.div
                    key={shape}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className={`absolute top-1/2 right-0 md:right-10 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-gradient-radial ${gradient} ${shapeClasses[shape]} pointer-events-none blur-2xl`}
                    aria-hidden="true"
                />
            )}
        </AnimatePresence>
    );
}

// Progress dots component
function ProgressDots({ total, activeIndex }: { total: number; activeIndex: number }) {
    return (
        <div
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20"
            role="tablist"
            aria-label="Progress indicators"
        >
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={`Point ${i + 1} of ${total}`}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${i === activeIndex
                        ? 'bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                        : 'bg-white/20 hover:bg-white/40'
                        }`}
                />
            ))}
        </div>
    );
}

export default function HighlightsSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Update active index based on scroll progress
    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            const newIndex = Math.min(
                MANIFESTO_POINTS.length - 1,
                Math.floor(latest * MANIFESTO_POINTS.length)
            );
            setActiveIndex(newIndex);
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    return (
        <section
            ref={containerRef}
            className="relative h-[200vh] md:h-[300vh] w-full z-20"
            aria-label="Our manifesto"
        >
            <div className="sticky top-0 h-screen w-full flex items-center justify-center p-4 md:p-12 overflow-hidden">

                <div className="glass-panel-dark w-full max-w-7xl h-[85vh] md:h-[80vh] rounded-[2rem] p-6 md:p-16 flex flex-col md:flex-row gap-8 md:gap-12 relative overflow-hidden backdrop-blur-2xl border border-white/5">

                    {/* Progress Dots */}
                    <ProgressDots total={MANIFESTO_POINTS.length} activeIndex={activeIndex} />

                    {/* Left Column - Fixed Title */}
                    <div className="md:w-1/3 flex flex-col justify-between h-full relative z-10">
                        <div>
                            <h2 className="text-3xl md:text-6xl font-grand-slang text-glow leading-tight">
                                THE<br />COVENANT
                            </h2>
                            <div className="h-1 w-16 md:w-20 bg-blue-500 mt-4 md:mt-10 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                        </div>
                        <div className="hidden md:block">
                            <span className="font-mono text-xs text-white/40 tracking-widest uppercase">
                                Loire Gallery<br />Est. 2024
                            </span>
                        </div>
                    </div>

                    {/* Right Column - Scrollytelling Content */}
                    <div className="md:w-2/3 h-full flex flex-col justify-center relative z-10">
                        <div className="relative h-full w-full flex flex-col justify-center items-center md:items-start">
                            {MANIFESTO_POINTS.map((point, index) => (
                                <HighlightItem
                                    key={point.order}
                                    point={point}
                                    index={index}
                                    total={MANIFESTO_POINTS.length}
                                    scrollYProgress={scrollYProgress}
                                    prefersReducedMotion={prefersReducedMotion}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Abstract Illustrations (cross-fade per point) */}
                    {MANIFESTO_POINTS.map((point, index) => (
                        <AbstractIllustration
                            key={point.order}
                            shape={point.shape}
                            gradient={point.gradient}
                            isActive={index === activeIndex && !prefersReducedMotion}
                        />
                    ))}

                    {/* Background Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

                </div>

            </div>
        </section>
    );
}

function HighlightItem({
    point,
    index,
    total,
    scrollYProgress,
    prefersReducedMotion
}: {
    point: typeof MANIFESTO_POINTS[0],
    index: number,
    total: number,
    scrollYProgress: any,
    prefersReducedMotion: boolean
}) {
    // Calculate opacity ranges [0, 1, 1, 0] for fade in/out
    const stepSize = 1 / total;
    const start = index * stepSize;
    const end = (index + 1) * stepSize;
    const buffer = stepSize * 0.2; // 20% buffer for transition

    const opacity = useTransform(
        scrollYProgress,
        [start, start + buffer, end - buffer, end],
        [0, 1, 1, 0]
    );

    const y = useTransform(
        scrollYProgress,
        [start, end],
        prefersReducedMotion ? [0, 0] : [50, -50]
    );

    return (
        <m.article
            style={{ opacity, y, position: 'absolute' }}
            className="flex flex-col gap-4 md:gap-8 max-w-2xl px-2 md:px-0"
        >
            <span className="font-mono text-blue-400 text-sm tracking-[0.25em]" aria-hidden="true">
                {point.order}
            </span>
            <h3 className="text-2xl md:text-5xl font-grand-slang text-white leading-tight">
                {point.title}
            </h3>
            <p className="text-base md:text-xl text-gray-200 font-light leading-relaxed">
                {point.text}
            </p>
        </m.article>
    );
}
