'use server'

/**
 * @fileoverview Server Actions pour la gestion des alertes personnalisées
 * 
 * Ce module fournit les opérations CRUD pour les alertes d'œuvres d'art.
 * Les utilisateurs peuvent créer des alertes basées sur des critères
 * (artistes, styles, prix, etc.) et être notifiés des nouvelles œuvres.
 * 
 * @module actions/alerts
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { ArtAlert, Artwork } from '@prisma/client'
import { matchesAlert } from '@/lib/alertMatching'
import { actionsLogger } from '@/lib/logger'

// ========================================
// Types
// ========================================

/**
 * Données du formulaire pour créer ou mettre à jour une alerte
 */
export type AlertFormData = {
    /** IDs des artistes à surveiller */
    artistIds?: string[]
    /** IDs des catégories à surveiller */
    categoryIds?: string[]
    /** Styles artistiques à surveiller */
    styles?: string[]
    /** Techniques/mediums à surveiller */
    mediums?: string[]
    /** Prix minimum (en centimes) */
    priceMin?: number | null
    /** Prix maximum (en centimes) */
    priceMax?: number | null
    /** Activer les notifications par email */
    emailEnabled?: boolean
    /** Activer les notifications push */
    pushEnabled?: boolean
    /** Fréquence des notifications */
    frequency?: 'immediate' | 'daily' | 'weekly'
    /** État actif de l'alerte */
    isActive?: boolean
}

/**
 * Résultat d'une action serveur
 */
type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string }

// ========================================
// Helper: Get authenticated user
// ========================================

/**
 * Récupère l'utilisateur authentifié depuis la session
 * @internal
 */
async function getAuthenticatedUser() {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }
    return session.user
}

// ========================================
// CRUD Operations
// ========================================

/**
 * Crée une nouvelle alerte pour l'utilisateur connecté
 * 
 * @param data - Critères et préférences de l'alerte
 * @returns L'alerte créée ou une erreur
 * 
 * @example
 * ```typescript
 * const result = await createAlert({
 *   styles: ['abstract', 'minimalist'],
 *   priceMax: 500000, // 5000€
 *   emailEnabled: true,
 *   frequency: 'daily'
 * });
 * 
 * if (result.success) {
 *   console.log('Alerte créée:', result.data.id);
 * }
 * ```
 */
export async function createAlert(data: AlertFormData): Promise<ActionResult<ArtAlert>> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        const alert = await prisma.artAlert.create({
            data: {
                userId: user.id,
                artistIds: data.artistIds ?? [],
                categoryIds: data.categoryIds ?? [],
                styles: data.styles ?? [],
                mediums: data.mediums ?? [],
                priceMin: data.priceMin ?? null,
                priceMax: data.priceMax ?? null,
                emailEnabled: data.emailEnabled ?? true,
                pushEnabled: data.pushEnabled ?? false,
                frequency: data.frequency ?? 'immediate',
                isActive: data.isActive ?? true,
            },
        })

        revalidatePath('/dashboard/alerts')
        return { success: true, data: alert }
    } catch (error) {
        actionsLogger.error({ err: error, action: 'createAlert' }, 'Error creating alert')
        return { success: false, error: 'Erreur lors de la création de l\'alerte' }
    }
}

/**
 * Met à jour une alerte existante
 * 
 * Vérifie que l'utilisateur est propriétaire de l'alerte avant modification.
 * 
 * @param id - ID de l'alerte à modifier
 * @param data - Champs à mettre à jour (partiels)
 * @returns L'alerte mise à jour ou une erreur
 * 
 * @example
 * ```typescript
 * const result = await updateAlert('alert-123', {
 *   priceMax: 1000000, // Augmenter le budget à 10000€
 *   frequency: 'weekly'
 * });
 * ```
 */
export async function updateAlert(
    id: string,
    data: Partial<AlertFormData>
): Promise<ActionResult<ArtAlert>> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        // Verify ownership
        const existing = await prisma.artAlert.findFirst({
            where: { id, userId: user.id },
        })

        if (!existing) {
            return { success: false, error: 'Alerte non trouvée' }
        }

        const alert = await prisma.artAlert.update({
            where: { id },
            data: {
                ...(data.artistIds !== undefined && { artistIds: data.artistIds }),
                ...(data.categoryIds !== undefined && { categoryIds: data.categoryIds }),
                ...(data.styles !== undefined && { styles: data.styles }),
                ...(data.mediums !== undefined && { mediums: data.mediums }),
                ...(data.priceMin !== undefined && { priceMin: data.priceMin }),
                ...(data.priceMax !== undefined && { priceMax: data.priceMax }),
                ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
                ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
                ...(data.frequency !== undefined && { frequency: data.frequency }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        })

        revalidatePath('/dashboard/alerts')
        return { success: true, data: alert }
    } catch (error) {
        actionsLogger.error({ err: error, action: 'updateAlert', alertId: id }, 'Error updating alert')
        return { success: false, error: 'Erreur lors de la mise à jour de l\'alerte' }
    }
}

/**
 * Supprime une alerte
 * 
 * Vérifie que l'utilisateur est propriétaire avant suppression.
 * 
 * @param id - ID de l'alerte à supprimer
 * @returns Succès ou erreur
 * 
 * @example
 * ```typescript
 * const result = await deleteAlert('alert-123');
 * if (result.success) {
 *   toast.success('Alerte supprimée');
 * }
 * ```
 */
export async function deleteAlert(id: string): Promise<ActionResult> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        // Verify ownership
        const existing = await prisma.artAlert.findFirst({
            where: { id, userId: user.id },
        })

        if (!existing) {
            return { success: false, error: 'Alerte non trouvée' }
        }

        await prisma.artAlert.delete({ where: { id } })

        revalidatePath('/dashboard/alerts')
        return { success: true, data: undefined }
    } catch (error) {
        actionsLogger.error({ err: error, action: 'deleteAlert', alertId: id }, 'Error deleting alert')
        return { success: false, error: 'Erreur lors de la suppression de l\'alerte' }
    }
}

/**
 * Récupère toutes les alertes de l'utilisateur connecté
 * 
 * @returns Liste des alertes triées par date de création (plus récentes d'abord)
 * 
 * @example
 * ```typescript
 * const result = await getUserAlerts();
 * if (result.success) {
 *   const activeAlerts = result.data.filter(a => a.isActive);
 * }
 * ```
 */
export async function getUserAlerts(): Promise<ActionResult<ArtAlert[]>> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        const alerts = await prisma.artAlert.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        })

        return { success: true, data: alerts }
    } catch (error) {
        actionsLogger.error({ err: error, action: 'getUserAlerts' }, 'Error fetching user alerts')
        return { success: false, error: 'Erreur lors de la récupération des alertes' }
    }
}

/**
 * Bascule l'état actif/inactif d'une alerte
 * 
 * @param id - ID de l'alerte
 * @returns L'alerte avec son nouvel état
 * 
 * @example
 * ```typescript
 * // Désactiver temporairement une alerte
 * const result = await toggleAlertActive('alert-123');
 * console.log('Alerte maintenant:', result.data?.isActive ? 'active' : 'inactive');
 * ```
 */
export async function toggleAlertActive(id: string): Promise<ActionResult<ArtAlert>> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: 'Non authentifié' }
    }

    try {
        const existing = await prisma.artAlert.findFirst({
            where: { id, userId: user.id },
        })

        if (!existing) {
            return { success: false, error: 'Alerte non trouvée' }
        }

        const alert = await prisma.artAlert.update({
            where: { id },
            data: { isActive: !existing.isActive },
        })

        revalidatePath('/dashboard/alerts')
        return { success: true, data: alert }
    } catch (error) {
        actionsLogger.error({ err: error, action: 'toggleAlertActive', alertId: id }, 'Error toggling alert')
        return { success: false, error: 'Erreur lors de la modification de l\'alerte' }
    }
}

// ========================================
// Alert Matching & Triggering
// ========================================

/**
 * Alerte correspondante avec infos utilisateur
 */
type MatchedAlert = {
    alert: ArtAlert
    user: { id: string; email: string; name: string | null }
}

/**
 * Vérifie quelles alertes correspondent à une nouvelle œuvre
 * 
 * Cette fonction est appelée lors de la création/publication d'une œuvre
 * pour identifier les utilisateurs à notifier.
 * 
 * @param artworkId - ID de l'œuvre nouvellement créée/publiée
 * @returns Liste des alertes déclenchées avec les informations utilisateur
 * 
 * @example
 * ```typescript
 * // Après création d'une œuvre
 * const result = await triggerAlertCheck(newArtwork.id);
 * 
 * if (result.success && result.data.length > 0) {
 *   // Envoyer les notifications
 *   for (const { alert, user } of result.data) {
 *     await sendNotificationEmail(user.email, newArtwork);
 *   }
 * }
 * ```
 */
export async function triggerAlertCheck(
    artworkId: string
): Promise<ActionResult<MatchedAlert[]>> {
    try {
        // Fetch the artwork with its relationships
        const artwork = await prisma.artwork.findUnique({
            where: { id: artworkId },
            include: {
                artist: { select: { id: true } },
                category: { select: { id: true } },
            },
        })

        if (!artwork) {
            return { success: false, error: 'Œuvre non trouvée' }
        }

        // Only check for available artworks
        if (artwork.status !== 'available') {
            return { success: true, data: [] }
        }

        // Find all active alerts
        const activeAlerts = await prisma.artAlert.findMany({
            where: { isActive: true },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
        })

        // Filter alerts that match the artwork
        const matchedAlerts: MatchedAlert[] = []

        for (const alert of activeAlerts) {
            if (matchesAlert(artwork, alert)) {
                matchedAlerts.push({
                    alert,
                    user: alert.user,
                })
            }
        }

        // Update lastTriggeredAt for matched alerts
        if (matchedAlerts.length > 0) {
            await prisma.artAlert.updateMany({
                where: { id: { in: matchedAlerts.map(m => m.alert.id) } },
                data: { lastTriggeredAt: new Date() },
            })
        }

        return { success: true, data: matchedAlerts }
    } catch (error) {
        actionsLogger.error({ err: error, action: 'triggerAlertCheck', artworkId }, 'Error checking alerts')
        return { success: false, error: 'Erreur lors de la vérification des alertes' }
    }
}
