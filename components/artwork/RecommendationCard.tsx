'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildArtworkPath } from '@/lib/artworkSlug';

interface Props {
    artwork: {
        id: string;
        title: string;
        imageUrl: string;
        price: number;
        artistName?: string | null;
    };
}

/**
 * Client component for recommendation cards with image error handling
 * Uses native img tag for better local image support
 */
export function RecommendationCard({ artwork }: Props) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const artworkPath = buildArtworkPath({
        id: artwork.id,
        title: artwork.title,
    });

    // Generate initials from title for fallback
    const initials = artwork.title
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');

    return (
        <Link
            href={artworkPath}
            className="block rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:-translate-y-1 hover:border-blue-500/30"
        >
            <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                {/* Always show fallback initially, hide when image loads */}
                {(!imageLoaded || imageError) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white/20">
                            {initials || '🎨'}
                        </span>
                    </div>
                )}

                {/* Native img tag for better local image support */}
                {!imageError && artwork.imageUrl && (
                    <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}
            </div>

            <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate mb-1">
                    {artwork.title}
                </h3>

                {artwork.artistName && (
                    <p className="text-xs text-white/50 mb-1">
                        {artwork.artistName}
                    </p>
                )}

                <p className="text-sm font-semibold text-white">
                    {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                    }).format(artwork.price)}
                </p>
            </div>
        </Link>
    );
}

export default RecommendationCard;
