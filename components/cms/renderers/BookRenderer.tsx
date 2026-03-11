"use client";

import React, { memo, useState } from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { SmartImage } from "../SmartImage";
import { m, AnimatePresence } from "framer-motion";
import { BookBlock } from "@/types/cms";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BookRendererBase: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const bookBlock = block as BookBlock;
    const items = bookBlock.items || [];
    const baseStyle = composeBlockStyle(block.style || {});

    // Default to slider if not specified
    const bookStyleType = bookBlock.bookStyle || 'slider';

    const [currentIndex, setCurrentIndex] = useState(0);

    const innerStyle = {
        ...baseStyle,
        ...injectedStyle,
        position: 'relative' as any,
        width: baseStyle.width || "100%",
        // Hauteur responsive : max 500px ou 60vh — jamais plus grand que la fenêtre
        height: baseStyle.height || 'min(500px, 60vh)',
        overflow: "hidden",
        borderRadius: baseStyle.borderRadius || "16px",
    };

    const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    if (items.length === 0) {
        return <div style={innerStyle} className="flex items-center justify-center bg-gray-100/50">Aucune page dans ce book</div>;
    }

    const currentItem = items[currentIndex];

    // Variants for beautiful transitions
    const variants = {
        enter: (direction: number) => {
            if (bookStyleType === 'fade') {
                return { opacity: 0, scale: 1.05 };
            }
            return {
                x: direction > 0 ? '100%' : '-100%',
                opacity: 0,
                scale: 0.95
            };
        },
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => {
            if (bookStyleType === 'fade') {
                return { opacity: 0, scale: 0.95 };
            }
            return {
                zIndex: 0,
                x: direction < 0 ? '100%' : '-100%',
                opacity: 0,
                scale: 1.05
            };
        }
    };

    // Calculate a unique direction custom prop
    // This allows AnimatePresence to know which way to slide
    // However, since we just have a prev/next trigger, we'll store direction in state if needed.
    // Simplifying by using a static 1 for forward, except AnimatePresence supports `custom`.
    // Let's implement full directional logic.
    const [tuple, setTuple] = useState([0, currentIndex]);
    if (tuple[1] !== currentIndex) {
        setTuple([currentIndex > tuple[1] ? 1 : -1, currentIndex]);
    }
    const direction = tuple[0];

    return (
        <div style={innerStyle} className="group flex flex-col items-center justify-center shadow-2xl relative">
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <m.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.4 } }}
                    className="absolute inset-0 w-full h-full"
                >
                    <SmartImage
                        context={context}
                        src={currentItem.url || ""}
                        alt={currentItem.title || ""}
                        className="w-full h-full object-cover transition-transform duration-1000"
                        loading="lazy"
                    />

                    {/* Dark/Glass Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full flex flex-col items-start font-sans">
                        {currentItem.title && (
                            <m.h3
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="text-4xl md:text-6xl font-serif mb-4 leading-tight tracking-tight drop-shadow-lg"
                            >
                                {currentItem.title}
                            </m.h3>
                        )}
                        {currentItem.description && (
                            <m.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg md:text-xl font-light opacity-90 max-w-2xl drop-shadow-md"
                            >
                                {currentItem.description}
                            </m.p>
                        )}
                    </div>
                </m.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        title="Précédent"
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={next}
                        title="Suivant"
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-8 right-12 flex gap-2">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                title={`Aller à la page ${idx + 1}`}
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 transition-all rounded-full ${currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const BookRenderer = memo(BookRendererBase, (prev, next) => {
    return prev.block === next.block &&
        prev.context === next.context &&
        prev.style === next.style;
});
