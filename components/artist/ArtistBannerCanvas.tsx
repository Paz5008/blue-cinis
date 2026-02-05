import React from "react";
import Link from "next/link";
import Image from "next/image";

export type ArtistContext = {
    id: string;
    name: string;
    slug: string | null;
    biography: string | null;
    photoUrl: string | null;
    artworks: any[];
};

export type BannerContent = any;

export type ArtistBannerCanvasProps = {
    artist: ArtistContext;
    content: BannerContent | null;
    searchParams?: any;
    variant?: "standalone" | "default" | "preview"; // Added 'preview' since it is used in route.ts
    showBackLink?: boolean;
    pageKey?: string;
};

export function ArtistBannerCanvas({ artist, content: _content, showBackLink }: ArtistBannerCanvasProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8 text-center">
            {showBackLink && (
                <Link href={`/artistes/${artist.slug}`} className="mb-8 text-blue-600 hover:underline">
                    ← Retour au profil
                </Link>
            )}
            <h1 className="text-4xl font-bold mb-4">{artist.name}</h1>
            {artist.photoUrl && (
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 mx-auto">
                    <Image src={artist.photoUrl} alt={artist.name} fill className="object-cover" />
                </div>
            )}
            <p className="max-w-md text-gray-700">{artist.biography}</p>
            <p className="mt-8 text-sm text-gray-500">Banner Preview Placeholder</p>
        </div>
    );
}
