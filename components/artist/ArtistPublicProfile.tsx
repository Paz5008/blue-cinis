"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { m } from 'framer-motion';
import { buildArtworkPath } from "@/lib/artworkSlug";
import { MapPin, Palette, Mail, ArrowRight } from 'lucide-react';

interface Artwork {
    id: string;
    title: string;
    imageUrl?: string | null;
    price?: number | null;
    description?: string | null;
    status?: string;
    dimensions?: unknown;
    year?: number | null;
}

interface ArtistPublicProfileProps {
    artist: {
        id: string;
        name: string;
        slug?: string;
        biography?: string | null;
        photoUrl?: string | null;
        artStyle?: string | null;
        location?: string | null;
        email?: string | null;
        artworks: any[];
    };
}

export default function ArtistPublicProfile({ artist }: ArtistPublicProfileProps) {
    const formatPrice = (price: number | null | undefined) => {
        if (!price) return "Prix sur demande";
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(price);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white">
            {/* Hero Section */}
            <m.section
                className="relative py-20 md:py-32 overflow-hidden"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent" />

                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Artist Photo */}
                        <m.div
                            className="relative shrink-0"
                            variants={itemVariants}
                        >
                            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-white/10">
                                {artist.photoUrl ? (
                                    <Image
                                        src={artist.photoUrl}
                                        alt={artist.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 192px, 256px"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                        <span className="text-6xl md:text-7xl font-grand-slang text-white/80">
                                            {artist.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Decorative ring */}
                            <div className="absolute -inset-2 border border-white/5 rounded-full" />
                            <div className="absolute -inset-4 border border-white/[0.02] rounded-full" />
                        </m.div>

                        {/* Artist Info */}
                        <m.div className="flex-1 text-center lg:text-left" variants={itemVariants}>
                            <m.span
                                className="inline-block text-blue-400 font-mono text-xs tracking-[0.3em] uppercase mb-4"
                                variants={itemVariants}
                            >
                                Artiste Blue Cinis
                            </m.span>

                            <m.h1
                                className="text-4xl md:text-6xl lg:text-7xl font-grand-slang text-white leading-[0.95] mb-6"
                                variants={itemVariants}
                            >
                                {artist.name}
                            </m.h1>

                            {/* Meta info */}
                            <m.div
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8 text-white/50"
                                variants={itemVariants}
                            >
                                {artist.artStyle && (
                                    <div className="flex items-center gap-2">
                                        <Palette size={16} className="text-blue-400" />
                                        <span className="text-sm">{artist.artStyle}</span>
                                    </div>
                                )}
                                {artist.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-blue-400" />
                                        <span className="text-sm">{artist.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{artist.artworks.length} œuvre{artist.artworks.length !== 1 ? 's' : ''}</span>
                                </div>
                            </m.div>

                            {/* Biography */}
                            {artist.biography && (
                                <m.div
                                    className="max-w-2xl"
                                    variants={itemVariants}
                                >
                                    <p className="text-white/60 text-lg leading-relaxed line-clamp-4">
                                        {artist.biography}
                                    </p>
                                </m.div>
                            )}

                            {/* CTA */}
                            {artist.email && (
                                <m.a
                                    href={`mailto:${artist.email}`}
                                    className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                                    variants={itemVariants}
                                >
                                    <Mail size={16} />
                                    Contacter l'artiste
                                </m.a>
                            )}
                        </m.div>
                    </div>
                </div>
            </m.section>

            {/* Artworks Section */}
            {artist.artworks && artist.artworks.length > 0 && (
                <m.section
                    className="py-16 md:py-24"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    <div className="container mx-auto px-6">
                        <m.div
                            className="flex items-end justify-between mb-12"
                            variants={itemVariants}
                        >
                            <div>
                                <span className="text-blue-400 font-mono text-xs tracking-[0.3em] uppercase mb-2 block">
                                    Collection
                                </span>
                                <h2 className="text-3xl md:text-4xl font-grand-slang text-white">
                                    Ses Œuvres
                                </h2>
                            </div>
                            <Link
                                href={`/galerie?artistId=${artist.id}`}
                                className="hidden sm:flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
                            >
                                Voir tout
                                <ArrowRight size={14} />
                            </Link>
                        </m.div>

                        <m.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            variants={containerVariants}
                        >
                            {artist.artworks.slice(0, 8).map((artwork, index) => (
                                <m.div
                                    key={artwork.id}
                                    variants={itemVariants}
                                    custom={index}
                                >
                                    <Link
                                        href={buildArtworkPath({ id: artwork.id, title: artwork.title })}
                                        className="group block"
                                    >
                                        <div className="relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all duration-300">
                                            <div className="relative aspect-[4/5] overflow-hidden">
                                                {artwork.imageUrl ? (
                                                    <Image
                                                        src={artwork.imageUrl}
                                                        alt={artwork.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                                        <Palette size={48} className="text-white/20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                {artwork.status === "sold" && (
                                                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
                                                        <span className="text-xs font-mono text-white/60">VENDU</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                <h3 className="font-grand-slang text-base text-white mb-1 line-clamp-1 group-hover:text-blue-100 transition-colors">
                                                    {artwork.title}
                                                </h3>
                                                {artwork.year && (
                                                    <p className="text-white/40 text-xs mb-2">{artwork.year}</p>
                                                )}
                                                <span className="text-white font-medium text-sm">
                                                    {formatPrice(artwork.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </m.div>
                            ))}
                        </m.div>

                        {artist.artworks.length > 8 && (
                            <m.div
                                className="text-center mt-12"
                                variants={itemVariants}
                            >
                                <Link
                                    href={`/galerie?artistId=${artist.id}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white text-sm hover:bg-white/5 transition-colors"
                                >
                                    Voir les {artist.artworks.length - 8} autres œuvres
                                    <ArrowRight size={14} />
                                </Link>
                            </m.div>
                        )}
                    </div>
                </m.section>
            )}

            {/* Empty state */}
            {(!artist.artworks || artist.artworks.length === 0) && (
                <section className="py-24">
                    <div className="container mx-auto px-6 text-center">
                        <div className="max-w-md mx-auto">
                            <Palette size={64} className="mx-auto text-white/20 mb-6" />
                            <h2 className="text-2xl font-grand-slang text-white mb-4">
                                Œuvres à venir
                            </h2>
                            <p className="text-white/50">
                                Cet artiste prépare actuellement sa collection. Revenez bientôt pour découvrir ses créations.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Bottom CTA */}
            <section className="py-16 border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <Link
                        href="/artistes"
                        className="text-white/50 hover:text-white transition-colors"
                    >
                        ← Retour à la liste des artistes
                    </Link>
                </div>
            </section>
        </div>
    );
}
