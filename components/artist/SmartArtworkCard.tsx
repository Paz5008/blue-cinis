
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Eye, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddToCartButton from '@/components/features/commerce/AddToCartButton'; // Assuming existing component

interface Artwork {
    id: string | number;
    title: string;
    imageUrl?: string;
    price: number | null;
    artistName: string;
    artistSlug?: string;
    slug?: string;
    year?: number | string;
    dimensions?: string;
    isAvailable?: boolean;
    status?: 'available' | 'sold' | 'reserved';
    artistHasStripe?: boolean;
    artistEnableCommerce?: boolean;
}

interface SmartArtworkCardProps {
    artwork: Artwork;
    className?: string;
    showBuyButton?: boolean;
}

export function SmartArtworkCard({ artwork, className, showBuyButton = true }: SmartArtworkCardProps) {
    const [isMobileInfoVisible, setMobileInfoVisible] = useState(false);

    const isSold = artwork.status === 'sold' || artwork.isAvailable === false;
    const isReserved = artwork.status === 'reserved';

    // Formatting
    const formattedPrice = typeof artwork.price === 'number'
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(artwork.price)
        : 'Prix sur demande';

    // Link construction (simplified)
    const href = `/artworks/${artwork.slug || artwork.id}`;

    const handleMobileTap = (e: React.MouseEvent) => {
        // Toggle info on mobile tap if not clicking a button
        // Or navigation? Let's make the card clickable for navigation, preventing default if we want to toggle info?
        // Prompt says "Mobile : Au tap ... affiche une bande". 
        // If we want navigation, maybe double tap or button? 
        // Let's implement: Always visible strip (Minimal) + Tap Image -> detailed Overlay?
        // Or simpler: Tap image -> Navigate. Strip is always there.
        // Prompt says: "Au tap (ou toujours visible en bas...)". I choose "toujours visible" for better conversion.
    };

    return (
        <div
            className={cn(
                "relative group overflow-hidden rounded-sm bg-gray-50", // minimal styling
                className
            )}
        >
            <Link href={href} className="block relative aspect-[4/5] overflow-hidden">
                <Image
                    src={artwork.imageUrl || '/images/placeholder.jpg'}
                    alt={artwork.title}
                    fill
                    className={cn(
                        "object-cover transition-all duration-700 ease-in-out group-hover:scale-105",
                        isSold && "grayscale opacity-80" // Visual filter for Sold
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Sold/Reserved Badge */}
                {(isSold || isReserved) && (
                    <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-white/90 backdrop-blur text-xs font-semibold uppercase tracking-wider text-gray-500 rounded-sm shadow-sm flex items-center gap-1.5">
                        <Lock size={12} />
                        {isSold ? 'Collection Privée' : 'Réservé'}
                    </div>
                )}
            </Link>

            {/* Desktop Smart Overlay (Hover) */}
            <div className="hidden md:flex flex-col justify-end absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-6">
                {/* Gradient Backing */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="relative z-10 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-light font-heading leading-tight">{artwork.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-300">
                        {artwork.year && <span>{artwork.year}</span>}
                        {artwork.dimensions && (
                            <>
                                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                <span>{artwork.dimensions}</span>
                            </>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between pointer-events-auto">
                        <div className="text-lg font-medium">
                            {formattedPrice}
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={href}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/20"
                                title="Voir détails"
                            >
                                <Eye size={20} />
                            </Link>

                            {!isSold && showBuyButton && (
                                <button
                                    className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // Trigger Add to Cart logic
                                        // Ideally call AddToCartButton component logic or pass handler
                                        console.log('Add to cart', artwork.id);
                                    }}
                                >
                                    <span>Acheter</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Minimal Strip (Always Visible) */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-3 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col">
                    <span className="font-heading text-sm font-medium text-gray-900 truncate max-w-[140px]">{artwork.title}</span>
                    <span className="text-xs text-gray-500">{formattedPrice}</span>
                </div>

                {!isSold ? (
                    <button
                        className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full active:scale-95 transition-transform"
                        aria-label="Ajouter au panier"
                    >
                        <ShoppingBag size={14} />
                    </button>
                ) : (
                    <span className="text-[10px] uppercase font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded">Vendu</span>
                )}
            </div>
        </div>
    );
}
