// app/api/artist/artworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/lib/prisma";
import { ensureArtistProfile } from "@/lib/artist-profile";
import type { Session } from "next-auth";

export async function GET(_request: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== 'artist' || !session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const artist = await ensureArtistProfile(session as Session);
    if (!artist) {
        return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }
    const artworks = await prisma.artwork.findMany({
        where: { artistId: artist.id },
        select: { id: true, title: true }
    });
    return NextResponse.json(artworks);
}
import { z } from "zod";
/**
 * Valide qu'une URL d'image est sécurisée :
 * - URLs absolues http(s)
 * - chemins relatifs commençant par '/'
 */
function isValidImageUrl(url: string): boolean {
    if (/^https?:\/\//i.test(url)) {
        try {
            const parsed = new URL(url);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
            return false;
        }
    }
    return url.startsWith("/");
}
import { uploadImageFile } from '@/lib/uploads'
import { logger } from '@/lib/logger'

const ArtworkSchema = z.object({
    title: z.string().min(1, "Titre requis"),
    price: z.preprocess(
        (val) => (typeof val === "string" && val.trim() === "" ? undefined : Number(val)),
        z.number().int().nonnegative().optional()
    ),
    year: z.preprocess(
        (val) => (typeof val === "string" && val.trim() === "" ? undefined : Number(val)),
        z.number().int().optional()
    ),
    dimensions: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.preprocess(
        (val) => (typeof val === "string" && val.trim() === "" ? null : val),
        z.string().uuid("Catégorie invalide").nullable().optional()
    ),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user || session.user.role !== "artist" || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const artist = await ensureArtistProfile(session as Session);
        if (!artist) {
            return NextResponse.json({ error: "Artist not found" }, { status: 404 });
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const priceVal = formData.get("price");
        const yearVal = formData.get("year");
        const dimensions = formData.get("dimensions") as string;
        const description = formData.get("description") as string;
        const categoryIdRaw = formData.get("categoryId") as string;

        const parsed = ArtworkSchema.safeParse({
            title,
            price: priceVal,
            year: yearVal,
            dimensions,
            description,
            categoryId: categoryIdRaw,
        });
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        const { categoryId } = parsed.data;

        // Gestion de l'image : URL externe ou upload
        let imageUrl = "";
        const imageUrlRaw = formData.get("imageUrl") as string | null;
        if (typeof imageUrlRaw === 'string' && imageUrlRaw.trim()) {
            // URL fournie par l'utilisateur: validation du protocole/path
            const url = imageUrlRaw.trim();
            if (!isValidImageUrl(url)) {
                return NextResponse.json({ error: "URL de l'image invalide" }, { status: 400 });
            }
            imageUrl = url;
        } else {
            const file = formData.get("image") as File | null;
            if (file && file.size > 0) {
                const out = await uploadImageFile(file)
                imageUrl = out.url
            }
        }

        const newArtwork = await prisma.artwork.create({
            data: {
                title: parsed.data.title,
                price: parsed.data.price ?? 0,
                year: parsed.data.year,
                dimensions: parsed.data.dimensions,
                description: parsed.data.description,
                imageUrl: imageUrl || "/default-artwork.jpg",
                artistId: artist.id,
                artistName: artist.name,
                categoryId: categoryId,
            },
        });
        logger.info({ artistId: artist.id, artworkId: newArtwork.id, msg: 'artist_artwork_created' });

        return NextResponse.json(newArtwork, { status: 201 });
    } catch (error: unknown) {
        logger.error({ err: error, msg: 'artist_artwork_create_failed' });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
