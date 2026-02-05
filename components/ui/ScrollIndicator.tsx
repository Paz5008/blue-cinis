"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

export default function ScrollIndicator() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setVisible(false);
            } else {
                setVisible(true);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none mix-blend-difference text-white"
                >
                    <span className="text-xs uppercase tracking-[0.2em] font-light">
                        Scroll to Explore
                    </span>
                    <m.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 opacity-70"
                        >
                            <path
                                d="M12 5V19M12 19L19 12M12 19L5 12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
