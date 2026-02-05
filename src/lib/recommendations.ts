/**
 * @fileoverview Module de recommandations d'œuvres d'art
 * 
 * Ce module fournit des algorithmes de recommandation intelligents
 * pour suggérer des œuvres pertinentes aux visiteurs de la galerie.
 * 
 * Les stratégies de recommandation incluent :
 * - Œuvres du même artiste
 * - Œuvres similaires (catégorie, style, mood)
 * - Préférences utilisateur (basées sur les likes)
 * - Œuvres populaires/récentes (fallback)
 * 
 * @module recommendations
 */

import { prisma } from '@/lib/prisma';
import type { Artwork } from '@prisma/client';

/**
 * Contexte utilisé pour déterminer les recommandations
 */
interface RecommendationContext {
    /** ID de l'utilisateur connecté (pour personnalisation) */
    userId?: string;
    /** ID de l'œuvre actuellement consultée (à exclure des résultats) */
    currentArtworkId?: string;
    /** ID de l'artiste pour recommander d'autres œuvres du même artiste */
    artistId?: string;
}

/**
 * Récupère des recommandations d'œuvres basées sur le contexte fourni
 * 
 * L'algorithme applique les stratégies suivantes par ordre de priorité :
 * 1. **Même artiste** - Autres œuvres de l'artiste (si artistId fourni)
 * 2. **Similarité** - Œuvres avec catégorie, style ou mood similaire
 * 3. **Préférences** - Basé sur les likes de l'utilisateur (si userId)
 * 4. **Popularité** - Œuvres les plus likées et récentes (fallback)
 * 
 * @param context - Contexte de recommandation (userId, currentArtworkId, artistId)
 * @param limit - Nombre maximum de recommandations à retourner (défaut: 8)
 * @returns Liste d'œuvres recommandées, triées par pertinence
 * 
 * @example
 * ```typescript
 * // Recommandations pour une page d'œuvre
 * const recommendations = await getRecommendations({
 *   currentArtworkId: 'abc123',
 *   artistId: 'artist456',
 *   userId: session?.user?.id
 * }, 6);
 * 
 * // Recommandations générales pour un utilisateur
 * const forYou = await getRecommendations({ userId: 'user789' }, 12);
 * 
 * // Recommandations populaires (sans contexte)
 * const popular = await getRecommendations({}, 10);
 * ```
 */
export async function getRecommendations(
    context: RecommendationContext,
    limit = 8
): Promise<Artwork[]> {
    const { userId, currentArtworkId, artistId } = context;

    const excludeIds = currentArtworkId ? [currentArtworkId] : [];

    // Strategy 1: Œuvres du même artiste
    if (artistId) {
        const sameArtist = await prisma.artwork.findMany({
            where: {
                artistId,
                id: { notIn: excludeIds },
                status: 'available',
            },
            take: Math.ceil(limit / 2),
            orderBy: { createdAt: 'desc' },
        });

        // Compléter avec des œuvres similaires (même catégorie ou style)
        const currentArtwork = currentArtworkId
            ? await prisma.artwork.findUnique({
                where: { id: currentArtworkId },
            })
            : null;

        const excludeWithSameArtist = [...excludeIds, ...sameArtist.map(a => a.id)];

        let similar: Artwork[] = [];

        if (currentArtwork?.categoryId || (currentArtwork?.style && currentArtwork.style.length > 0)) {
            const orConditions: object[] = [];

            if (currentArtwork.categoryId) {
                orConditions.push({ categoryId: currentArtwork.categoryId });
            }

            if (currentArtwork.style && currentArtwork.style.length > 0) {
                orConditions.push({ style: { hasSome: currentArtwork.style } });
            }

            if (currentArtwork.mood && currentArtwork.mood.length > 0) {
                orConditions.push({ mood: { hasSome: currentArtwork.mood } });
            }

            similar = await prisma.artwork.findMany({
                where: {
                    id: { notIn: excludeWithSameArtist },
                    status: 'available',
                    OR: orConditions,
                },
                take: limit - sameArtist.length,
                orderBy: { createdAt: 'desc' },
            });
        }

        return [...sameArtist, ...similar];
    }

    // Strategy 2: Basé sur les likes/wishlist de l'utilisateur
    if (userId) {
        const userLikes = await prisma.like.findMany({
            where: { userId },
            include: {
                artwork: true
            },
            take: 10,
        });

        if (userLikes.length > 0) {
            const preferredCategories = [...new Set(
                userLikes
                    .map(l => l.artwork.categoryId)
                    .filter((id): id is string => id !== null)
            )];

            const preferredStyles = [...new Set(
                userLikes.flatMap(l => l.artwork.style || [])
            )];

            const preferredArtists = [...new Set(
                userLikes.map(l => l.artwork.artistId)
            )];

            const orConditions: object[] = [];

            if (preferredCategories.length > 0) {
                orConditions.push({ categoryId: { in: preferredCategories } });
            }

            if (preferredStyles.length > 0) {
                orConditions.push({ style: { hasSome: preferredStyles } });
            }

            if (preferredArtists.length > 0) {
                orConditions.push({ artistId: { in: preferredArtists } });
            }

            if (orConditions.length > 0) {
                return prisma.artwork.findMany({
                    where: {
                        id: { notIn: excludeIds },
                        status: 'available',
                        OR: orConditions,
                    },
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                });
            }
        }
    }

    // Default: œuvres populaires/récentes (basé sur le nombre de likes)
    return prisma.artwork.findMany({
        where: {
            status: 'available',
            id: { notIn: excludeIds }
        },
        take: limit,
        orderBy: [
            { Like: { _count: 'desc' } },
            { createdAt: 'desc' },
        ],
    });
}

/**
 * Récupère des recommandations optimisées pour une page de détail d'œuvre
 * 
 * Wrapper pratique autour de `getRecommendations` avec le contexte
 * complet d'une page d'œuvre (artiste, œuvre courante, utilisateur).
 * 
 * @param artworkId - ID de l'œuvre actuellement affichée
 * @param artistId - ID de l'artiste de l'œuvre
 * @param userId - ID de l'utilisateur connecté (optionnel)
 * @param limit - Nombre de recommandations (défaut: 8)
 * @returns Liste d'œuvres recommandées
 * 
 * @example
 * ```typescript
 * // Dans une page d'œuvre
 * const related = await getArtworkRecommendations(
 *   artwork.id,
 *   artwork.artistId,
 *   session?.user?.id
 * );
 * ```
 */
export async function getArtworkRecommendations(
    artworkId: string,
    artistId: string,
    userId?: string,
    limit = 8
): Promise<Artwork[]> {
    return getRecommendations({
        currentArtworkId: artworkId,
        artistId,
        userId,
    }, limit);
}
