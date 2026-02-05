'use client';

import React, { useState } from 'react';
import { m, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';

interface ImmersiveBottomNavProps {
    cartCount?: number;
    onOpenSearch?: () => void;
    onOpenCart?: () => void;
    onOpenUser?: () => void;
}

export const ImmersiveBottomNav: React.FC<ImmersiveBottomNavProps> = ({
    cartCount = 0,
    onOpenSearch,
    onOpenCart,
    onOpenUser,
}) => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [prevScroll, setPrevScroll] = useState(0);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const diff = latest - prevScroll;
        // Hide on scroll down (>10px), Show on scroll up (<-10px) (even a little)
        if (diff > 10 && !hidden && latest > 100) {
            setHidden(true);
        } else if (diff < -5 && hidden) {
            setHidden(false);
        }
        setPrevScroll(latest);
    });

    return (
        <AnimatePresence>
            <m.nav
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: "200%", opacity: 0 },
                }}
                initial="visible"
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-6 left-4 right-4 z-50 md:hidden"
            >
                <div className="
                    flex items-center justify-around
                    h-16
                    px-6
                    rounded-2xl
                    backdrop-blur-xl
                    bg-white/10 dark:bg-black/20
                    border border-white/20 dark:border-white/5
                    shadow-lg shadow-black/5
                ">
                    <Link href="/" aria-label="Accueil" className="p-2 text-gray-800 dark:text-white/90 transition hover:scale-110">
                        <Home size={24} strokeWidth={1.5} />
                    </Link>

                    <button onClick={onOpenSearch} aria-label="Recherche" className="p-2 text-gray-800 dark:text-white/90 transition hover:scale-110">
                        <Search size={24} strokeWidth={1.5} />
                    </button>

                    <button onClick={onOpenCart} aria-label="Panier" className="relative p-2 text-gray-800 dark:text-white/90 transition hover:scale-110">
                        <ShoppingBag size={24} strokeWidth={1.5} />
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    <button onClick={onOpenUser} aria-label="Compte" className="p-2 text-gray-800 dark:text-white/90 transition hover:scale-110">
                        <User size={24} strokeWidth={1.5} />
                    </button>
                </div>
            </m.nav>
        </AnimatePresence>
    );
};
