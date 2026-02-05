// components/ArtistCard.tsx
"use client";

import Image from "next/image";
import { shimmerDataURL } from "@/lib/blur";
import Link from "next/link";
import { m } from "framer-motion";
import type { Variants } from "framer-motion"; // Import Variants
import { Palette } from "lucide-react";
import clsx from "clsx"; // For conditional classes

// --- Removed hardcoded color/style constants ---

interface Artist {
    id: string | number;
    slug?: string; // For cleaner URLs
    name: string;
    image?: string; // Optional
    specialty?: string; // Optional
}

interface ArtistCardProps {
    artist: Artist;
    className?: string; // Allow passing additional classes
    variants?: Variants; // Use Variants type
}

// Default animation variant if none is passed
const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    },
};

export default function ArtistCard({ artist, className, variants }: ArtistCardProps) {
    const { id, slug, name, image, specialty } = artist;

    // Use a default placeholder if image is missing
    const imageUrl = image || '/images/placeholder-artist.jpg';
    // Construct link using slug if available
    const artistLink = slug ? `/artistes/${slug}` : `/artistes/${id}`;

    return (
        <m.div
            className={clsx(
                "h-full flex flex-col rounded-lg overflow-hidden group", // Use theme radius, add group
                "bg-card-bg border border-border-subtle", // Theme background and border
                "shadow-md hover:shadow-lg", // Theme shadows (consistent with ArtworkCard)
                "transition-all duration-normal ease-in-out", // Combined transition
                className // Allow external classes
            )}
            variants={variants || defaultVariants}
            whileHover={{ y: -6 }} // Framer motion lift effect
            layout // Enable layout animations
        >
            {/* Link wraps the entire card content */}
            <Link
                href={artistLink}
                className="block flex flex-col h-full" // Link takes full height
                aria-label={`Voir le profil de l'artiste ${name || 'inconnu'}`}
            >
                {/* Image Container */}
                <div className="relative h-60 sm:h-64 w-full overflow-hidden"> {/* Consistent height */}
                    <Image
                        src={imageUrl}
                        alt={name ? `Portrait de ${name}` : 'Portrait d\'artiste'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Optimize image loading
                        className="object-cover transition-transform duration-slow ease-in-out group-hover:scale-105" // Image zoom on hover
                        placeholder="blur"
                        blurDataURL={shimmerDataURL(4,3)}
                    />
                    {/* Optional: Subtle overlay */}
                    <div
                        className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-normal"
                        aria-hidden="true"
                    />
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-grow"> {/* Consistent padding */}
                    {/* Artist Name */}
                    {/* flex-grow ensures name takes available space, pushing specialty down */}
                    <h3 className="text-lg sm:text-xl font-semibold text-heading mb-1 flex-grow">
                        {name || "Artiste Inconnu"}
                    </h3>

                    {/* Artist Specialty (Optional) */}
                    {/* mt-auto pushes this to the bottom if name doesn't fill space */}
                    {specialty && (
                        <div className="flex items-center text-sm text-body-subtle mt-auto pt-1">
                            <Palette
                                size={14}
                                className="mr-1.5 flex-shrink-0 text-icon-subtle" // Use theme icon color
                                aria-hidden="true"
                            />
                            <span>{specialty}</span>
                        </div>
                    )}
                </div>
            </Link>
        </m.div>
    );
}