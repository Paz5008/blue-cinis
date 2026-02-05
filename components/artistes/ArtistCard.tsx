"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export interface ArtistCardProps {
    id: string;
    name: string;
    slug: string | null;
    photoUrl: string | null;
    artStyle: string | null;
    biography: string | null;
    artworkCount: number;
    works?: string[];
    index?: number;
    prefersReducedMotion?: boolean;
}

function truncate(text: string | null, n: number) {
    if (!text) return "";
    return text.length > n ? text.substring(0, n - 1) + "…" : text;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function ArtistCard({
    id,
    name,
    slug,
    photoUrl,
    artStyle,
    biography,
    artworkCount,
    works = [],
    index = 0,
    prefersReducedMotion = false,
}: ArtistCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isFollowed, setIsFollowed] = useState(false);
    const artistUrl = slug ? `/artistes/${slug}` : `/artistes/${id}`;

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleFollow = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFollowed((prev) => !prev);
        // TODO: integrate with alerts API
    }, []);

    const showImage = photoUrl && !imageError;
    const initials = getInitials(name);

    return (
        <m.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            role="listitem"
        >
            <Link
                href={artistUrl}
                className="group relative block aspect-[3/4] overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
            >
                {/* Background - Artist Portrait or Fallback */}
                <m.div
                    className="absolute inset-0"
                    animate={{
                        scale: isHovered && !prefersReducedMotion ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                >
                    {showImage ? (
                        <Image
                            src={photoUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            loading="lazy"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-800 to-slate-900 flex items-center justify-center">
                            <span className="text-7xl font-grand-slang text-white/15 select-none">
                                {initials}
                            </span>
                        </div>
                    )}
                </m.div>

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <m.div
                    className="absolute inset-0 bg-blue-900/30"
                    animate={{ opacity: isHovered ? 0.4 : 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Follow Button */}
                <button
                    onClick={handleFollow}
                    className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300
                        ${isFollowed
                            ? "bg-blue-500 text-white"
                            : "bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20"
                        }
                        focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
                        opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100`}
                    aria-label={isFollowed ? `Ne plus suivre ${name}` : `Suivre ${name}`}
                    aria-pressed={isFollowed}
                >
                    {isFollowed ? "Suivi ✓" : "Suivre"}
                </button>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Type badge */}
                    <span className="inline-block text-blue-400 text-xs font-mono tracking-widest uppercase mb-3">
                        {artStyle || "Artiste Loire"}
                    </span>

                    {/* Name */}
                    <h2 className="text-2xl md:text-3xl font-grand-slang text-white leading-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                        {name}
                    </h2>

                    {/* Artwork Count */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-white/60 text-sm font-mono">
                            {artworkCount} œuvre{artworkCount !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Bio preview on hover */}
                    <AnimatePresence>
                        {isHovered && biography && (
                            <m.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.2 }}
                                className="text-white/50 text-sm line-clamp-2 mb-4"
                            >
                                {truncate(biography, 120)}
                            </m.p>
                        )}
                    </AnimatePresence>

                    {/* Portfolio preview - show artwork thumbnails on hover */}
                    <AnimatePresence>
                        {isHovered && works.length > 0 && (
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.3 }}
                                className="flex gap-2"
                                aria-label="Aperçu des œuvres"
                            >
                                {works.slice(0, 3).map((work, i) => (
                                    <m.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10"
                                    >
                                        <Image
                                            src={work}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    </m.div>
                                ))}
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Border glow on hover */}
                <m.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                        boxShadow: isHovered
                            ? "inset 0 0 0 1px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.15)"
                            : "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
                    }}
                    transition={{ duration: 0.3 }}
                />
            </Link>
        </m.article>
    );
}

export default ArtistCard;
