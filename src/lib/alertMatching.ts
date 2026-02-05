/**
 * @fileoverview Alert matching utility functions
 * 
 * Separated from server actions for testing and to avoid 'use server' constraints.
 */

import type { ArtAlert, Artwork } from '@prisma/client'

/**
 * Artwork with required relations for alert matching
 */
export type ArtworkWithRelations = Artwork & {
    artist: { id: string }
    category: { id: string } | null
}

/**
 * Vérifie si une œuvre correspond aux critères d'une alerte
 * 
 * @param artwork - L'œuvre à vérifier (avec ses relations)
 * @param alert - L'alerte avec ses critères
 * @returns true si l'œuvre correspond à tous les critères de l'alerte
 * 
 * @example
 * ```typescript
 * const matches = matchesAlert(artwork, userAlert);
 * if (matches) {
 *   await sendNotification(userAlert.userId, artwork);
 * }
 * ```
 */
export function matchesAlert(
    artwork: ArtworkWithRelations,
    alert: ArtAlert
): boolean {
    // Check artist filter
    if (alert.artistIds.length > 0 && !alert.artistIds.includes(artwork.artistId)) {
        return false
    }

    // Check category filter
    if (alert.categoryIds.length > 0) {
        if (!artwork.categoryId || !alert.categoryIds.includes(artwork.categoryId)) {
            return false
        }
    }

    // Check style filter (artwork.style is String[], alert.styles is String[])
    if (alert.styles.length > 0) {
        const artworkStyles = artwork.style ?? []
        const hasMatchingStyle = alert.styles.some(s => artworkStyles.includes(s))
        if (!hasMatchingStyle) {
            return false
        }
    }

    // Check medium filter
    if (alert.mediums.length > 0) {
        if (!artwork.medium || !alert.mediums.includes(artwork.medium)) {
            return false
        }
    }

    // Check price range
    if (alert.priceMin !== null && artwork.price < alert.priceMin) {
        return false
    }
    if (alert.priceMax !== null && artwork.price > alert.priceMax) {
        return false
    }

    return true
}
