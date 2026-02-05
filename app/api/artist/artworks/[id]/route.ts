import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadImageFile } from '@/lib/uploads';

// Schéma de validation pour la mise à jour d'une œuvre
const ArtworkUpdateSchema = z.object({
  title: z.string().min(1, 'Titre requis').optional(),
  price: z.number().int().nonnegative().optional(),
  year: z.number().int().optional(),
  dimensions: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid('Catégorie invalide').optional().or(z.literal('')),
});

type ArtworkUpdateInput = z.infer<typeof ArtworkUpdateSchema>;
type RouteContext = { params: { id: string } };

type SessionUserShape = {
  id?: string;
  role?: string;
};

async function resolveArtistUserId() {
  const session = await auth();
  const user = session?.user as SessionUserShape | undefined;
  if (!user || user.role !== 'artist' || !user.id) {
    return null;
  }
  return user.id;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function parseInteger(value: string | null): number | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeString(value: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function buildArtworkPayload(formData: FormData): ArtworkUpdateInput {
  const titleRaw = formData.get('title') as string | null;
  const dimensionsRaw = formData.get('dimensions') as string | null;
  const descriptionRaw = formData.get('description') as string | null;
  const categoryIdRaw = formData.get('categoryId') as string | null;
  const categoryIdValue = typeof categoryIdRaw === 'string' ? categoryIdRaw.trim() : undefined;

  return {
    title: normalizeString(titleRaw),
    price: parseInteger(formData.get('price') as string | null),
    year: parseInteger(formData.get('year') as string | null),
    dimensions: normalizeString(dimensionsRaw),
    description: normalizeString(descriptionRaw),
    categoryId: categoryIdValue === undefined ? undefined : categoryIdValue,
  };
}

/**
 * GET /api/artist/artworks/[id]
 * Récupère les informations d'une œuvre précise pour préremplir le formulaire d'édition.
*/
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const artistUserId = await resolveArtistUserId();
    if (!artistUserId) {
      return unauthorizedResponse();
    }

    // Vérifier que l'œuvre appartient à l'artiste connecté
    const artwork = await prisma.artwork.findFirst({
      where: {
        id: params.id,
        artist: { userId: artistUserId },
      },
      include: { category: true },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Œuvre introuvable' }, { status: 404 });
    }

    return NextResponse.json(artwork, { status: 200 });
  } catch (error) {
    console.error('Erreur GET /api/artist/artworks/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/artist/artworks/[id]
 * Met à jour une œuvre. Les données sont envoyées via FormData (possibilité d'uploader une nouvelle image).
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const artistUserId = await resolveArtistUserId();
    if (!artistUserId) {
      return unauthorizedResponse();
    }

    // Vérifier que l'œuvre appartient à l'artiste connecté
    const existingArtwork = await prisma.artwork.findFirst({
      where: {
        id: params.id,
        artist: { userId: artistUserId },
      },
    });

    if (!existingArtwork) {
      return NextResponse.json({ error: 'Œuvre introuvable' }, { status: 404 });
    }

    // Récupération et conversion des données du formulaire
    const formData = await request.formData();
    const parsed = ArtworkUpdateSchema.safeParse(buildArtworkPayload(formData));

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Gestion de l'image : URL externe ou upload
    let newImageUrl = existingArtwork.imageUrl;
    const imageUrlRaw = formData.get('imageUrl');
    if (typeof imageUrlRaw === 'string' && imageUrlRaw.trim()) {
      newImageUrl = imageUrlRaw.trim();
    } else {
      const file = formData.get('image');
      if (file instanceof File && file.size > 0) {
        const out = await uploadImageFile(file);
        newImageUrl = out.url;
      }
    }

    const dataToUpdate: Prisma.ArtworkUncheckedUpdateInput = {
      ...parsed.data,
      imageUrl: newImageUrl,
    };

    if (dataToUpdate.categoryId === '') {
      dataToUpdate.categoryId = null;
    }

    const updatedArtwork = await prisma.artwork.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedArtwork, { status: 200 });
  } catch (error) {
    console.error('Erreur PUT /api/artist/artworks/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/artist/artworks/[id]
 * Supprime une œuvre, après vérification que celle-ci appartient à l'artiste connecté.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const artistUserId = await resolveArtistUserId();
    if (!artistUserId) {
      return unauthorizedResponse();
    }

    const existingArtwork = await prisma.artwork.findFirst({
      where: {
        id: params.id,
        artist: { userId: artistUserId },
      },
    });

    if (!existingArtwork) {
      return NextResponse.json({ error: 'Œuvre introuvable' }, { status: 404 });
    }

    await prisma.artwork.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Œuvre supprimée avec succès' }, { status: 200 });
  } catch (error) {
    console.error('Erreur DELETE /api/artist/artworks/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
