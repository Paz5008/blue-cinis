'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Home, Search, ShoppingBag, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileImmersiveNav() {
    const pathname = usePathname();
    const { scrollY } = useScroll();
    const [isVisible, setIsVisible] = useState(true);

    // Logic: Hide on scroll down, show on scroll up (or at top)
    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;

        // Always show at very top
        if (latest < 50) {
            setIsVisible(true);
            return;
        }

        // Determine direction
        if (latest > previous && latest > 150) {
            setIsVisible(false); // Scroll Down -> Hide
        } else if (latest < previous) {
            setIsVisible(true); // Scroll Up -> Show
        }
    });

    // Check if we are on a product page to show "Quick Buy"
    // Assuming strict product pages are under /galerie/ or /oeuvre/
    const isProductPage = pathname?.includes('/galerie/') || pathname?.includes('/oeuvre/');

    const items = [
        { label: 'Accueil', href: '/', icon: Home },
        { label: 'Recherche', href: '/recherche', icon: Search },
        { label: 'Panier', href: '/panier', icon: ShoppingBag },
    ];

    return (
        <AnimatePresence>
            <m.nav
                initial={{ y: 100 }}
                animate={{ y: isVisible ? 0 : 100 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 md:hidden",
                    "bg-white/70 backdrop-blur-md border-t border-white/20 shadow-lg",
                    "pb-safe pt-2 px-6" // pb-safe handles iPhone Home Indicator
                )}
            >
                <div className="flex justify-between items-center h-16">
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                                    isActive ? "text-black" : "text-neutral-500 hover:text-black"
                                )}
                            >
                                <item.icon strokeWidth={isActive ? 2.5 : 1.5} size={24} />
                                {/* Optional labels for clarity or icon-only for minimal? Prompt implies "icons" but labels help thumb zone accuracy */}
                                {/* <span className="text-[10px] font-medium">{item.label}</span> */}
                            </Link>
                        );
                    })}

                    {/* Sticky Quick Buy Action (Conditional) */}
                    {isProductPage && (
                        <button
                            className="flex flex-col items-center justify-center bg-black text-white rounded-full w-12 h-12 shadow-lg active:scale-95 transition-transform ml-2"
                            aria-label="Achat Rapide"
                        >
                            <Zap size={20} fill="currentColor" className="text-yellow-400" />
                        </button>
                    )}
                </div>
            </m.nav>
        </AnimatePresence>
    );
}
