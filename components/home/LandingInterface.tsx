"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, m } from "framer-motion";
import { useStore } from "@/lib/store";
import { Menu } from "lucide-react";

export default function LandingInterface() {
    const introFinished = useStore((state) => state.introFinished);
    const activeArtworkIndex = useStore((state) => state.activeArtworkIndex);

    const shouldHideIndicator = activeArtworkIndex > 0;

    if (!introFinished) return null;

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-8 md:p-12 text-white"
        >
            {/* Top Bar */}
            <div className="flex justify-between items-start w-full">
                {/* Logo */}
                <div className="pointer-events-auto">
                    <span className="font-bold tracking-widest text-sm mix-blend-difference font-inter">
                        BLUE CINIS
                    </span>
                </div>

                {/* Menu Button */}
                <button className="pointer-events-auto glass-panel rounded-full h-10 w-10 md:h-auto md:w-auto md:px-5 md:py-2 flex items-center justify-center gap-2 group hover:bg-white/10 transition-colors">
                    <span className="hidden md:inline text-xs font-medium tracking-widest">MENU</span>
                    <Menu className="w-5 h-5 md:w-4 md:h-4" />
                </button>
            </div>

            {/* Bottom Center Indicator - Minimalist Line with CSS Animation */}
            <m.div
                initial={{ opacity: 1 }}
                animate={{
                    opacity: shouldHideIndicator ? 0 : 1,
                    pointerEvents: shouldHideIndicator ? "none" : "auto"
                }}
                transition={{ duration: 0.5 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-8 mix-blend-difference pointer-events-auto"
            >
                <div className="w-[1px] h-[60px] bg-white origin-bottom scroll-line-animation" />
            </m.div>

            {/* CSS Animation for infinite line pulse */}
            <style jsx>{`
                @keyframes scrollLinePulse {
                    0%, 100% {
                        transform: scaleY(0);
                        transform-origin: bottom;
                    }
                    50% {
                        transform: scaleY(1);
                        transform-origin: bottom;
                    }
                }
                .scroll-line-animation {
                    animation: scrollLinePulse 3s ease-in-out infinite;
                }
            `}</style>
        </m.div>
    );
}
