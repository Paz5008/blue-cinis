// components/FeaturedArtist.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx'; // For conditional classes

interface Artist {
    id: string | number; // Allow number IDs
    slug?: string; // For cleaner URLs
    name: string;
    photoUrl?: string; // Optional
    artStyle?: string; // Optional
    bio?: string;      // Optional
}

interface FeaturedArtistProps {
    artist: Artist;
    className?: string; // Allow passing additional classes
}

export default function FeaturedArtist({ artist, className }: FeaturedArtistProps) {
    const { id, slug, name, photoUrl, artStyle, bio } = artist;

    // Use a default placeholder if photoUrl is missing
    const imageSrc = photoUrl || '/images/placeholder-artist.jpg';
    // Construct link using slug if available
    const artistLink = slug ? `/artistes/${slug}` : `/artistes/${id}`;

    return (
        <div
            className={clsx(
                "flex flex-col md:flex-row gap-6 md:gap-8 items-center",
                "bg-card-bg p-6 rounded-lg shadow-md", // Use theme colors, standard radius/shadow
                className // Allow external classes
            )}
        >
            {/* Artist Image */}
            <div className="relative w-40 h-40 md:w-48 md:h-48 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-sm"> {/* Adjusted size slightly, border-white, softer shadow */}
                <Image
                    src={imageSrc}
                    alt={name ? `Portrait de ${name}` : 'Portrait d\'artiste'}
                    fill
                    sizes="(max-width: 768px) 160px, 192px" // Adjusted sizes attribute
                    className="object-cover" // Ensures the image covers the area
                />
            </div>

            {/* Artist Info */}
            <div className="flex-grow text-center md:text-left">
                {/* Artist Name */}
                <h3 className="text-2xl lg:text-3xl font-bold font-grand-slang mb-1 text-heading">
                    {name || "Artiste Inconnu"}
                </h3>

                {/* Art Style (Optional) */}
                {artStyle && (
                    <p className="text-accent mb-2 font-medium font-roboto"> {/* Use theme accent color */}
                        {artStyle}
                    </p>
                )}

                {/* Bio (Optional) */}
                {bio && (
                    <p className="text-body mb-4 line-clamp-3 font-roboto"> {/* Use theme body color, clamp lines */}
                        {bio}
                    </p>
                )}

                {/* Link Button */}
                <Link
                    href={artistLink}
                    className={clsx(
                        "inline-block px-6 py-2 rounded-full font-medium", // Keep rounded-full for CTA feel
                        "bg-accent text-white", // Theme button colors
                        "hover:bg-accent-hover", // Theme hover color
                        "transition-colors duration-normal ease-in-out",
                        "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-card-bg" // Theme focus state
                    )}
                >
                    Découvrir
                </Link>
            </div>
        </div>
    );
}