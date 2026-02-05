"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence, m } from "framer-motion";

export default function Preloader() {
    const { progress } = useProgress();
    const setIsLoaded = useStore((state) => state.setIsLoaded);
    const setIntroFinished = useStore((state) => state.setIntroFinished);
    const isLoaded = useStore((state) => state.isLoaded);

    const [isExiting, setIsExiting] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    // Initial blocking of scroll via CSS
    useEffect(() => {
        // Enforce scroll blocking on mount
        document.body.style.overflow = "hidden";
        // Note: We intentionally do NOT unblock in cleanup here. 
        // We only unblock when the intro animation is explicitly finished.
    }, []);

    // Monitor progress
    useEffect(() => {
        if (progress === 100) {
            // Small buffer to ensure everything is really settled
            const t = setTimeout(() => {
                setIsLoaded(true);
            }, 500);
            return () => clearTimeout(t);
        }
    }, [progress, setIsLoaded]);

    // Exit Animation Sequence - Trigger when loaded
    useEffect(() => {
        if (isLoaded) {
            setIsExiting(true);
        }
    }, [isLoaded]);

    // Handle animation complete
    const handleExitComplete = () => {
        setIntroFinished(true);
        // Explicitly unlock scroll here
        document.body.style.overflow = "";
        setIsHidden(true);
    };

    if (isHidden) return null;

    return (
        <AnimatePresence onExitComplete={handleExitComplete}>
            {!isExiting ? (
                <m.div
                    key="preloader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
                    className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white pointer-events-auto"
                >
                    <m.div
                        className="flex flex-col items-center text-center"
                        exit={{
                            scale: 1.1,
                            opacity: 0,
                            filter: "blur(10px)"
                        }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    >
                        <h1 className="font-grand-slang text-[12vw] md:text-[8vw] leading-none tracking-tight">
                            BLUE CINIS
                        </h1>
                        <div className="font-inter text-xs md:text-sm uppercase tracking-[0.2em] mt-4 opacity-80">
                            Art, Matter, Memory
                        </div>
                    </m.div>

                    {/* Minimalist Progress (Bottom) */}
                    <m.div
                        className="absolute bottom-12 flex flex-col items-center gap-2"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-32 h-[1px] bg-white/10 overflow-hidden">
                            <m.div
                                className="h-full bg-white/50 origin-left"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: progress / 100 }}
                                transition={{ duration: 0.1, ease: "linear" }}
                            />
                        </div>
                    </m.div>
                </m.div>
            ) : (
                <m.div
                    key="preloader-exit"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                    onAnimationComplete={handleExitComplete}
                    className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white pointer-events-auto"
                >
                    <m.div
                        className="flex flex-col items-center text-center"
                        initial={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                        animate={{
                            scale: 1.1,
                            opacity: 0,
                            filter: "blur(10px)"
                        }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    >
                        <h1 className="font-grand-slang text-[12vw] md:text-[8vw] leading-none tracking-tight">
                            BLUE CINIS
                        </h1>
                        <div className="font-inter text-xs md:text-sm uppercase tracking-[0.2em] mt-4 opacity-80">
                            Art, Matter, Memory
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}

