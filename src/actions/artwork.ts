'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureArtistProfile } from '@/lib/artist-profile';
import { uploadImageFile } from '@/lib/uploads';
import { revalidatePath } from 'next/cache';
import type { Session } from 'next-auth';
import { triggerAlertCheck } from '@/src/actions/alerts';
import { actionsLogger } from '@/lib/logger';

export async function createArtwork(formData: FormData) {
    const session = await auth();

    if (!session || (session.user as any).role !== 'artist') {
        return { success: false, error: 'Unauthorized' };
    }

    const artist = await ensureArtistProfile(session as Session, { select: { id: true } });
    if (!artist) {
        return { success: false, error: 'Artist profile not found' };
    }

    const title = formData.get('title') as string;
    const priceRaw = formData.get('price') as string;
    const yearRaw = formData.get('year') as string;
    const dimensions = formData.get('dimensions') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const imageFile = formData.get('image') as File;

    if (!title || !categoryId || !imageFile) {
        return { success: false, error: 'Missing required fields' };
    }

    let imageUrl = '';
    try {
        const uploadResult = await uploadImageFile(imageFile);
        imageUrl = uploadResult.url;
    } catch (error) {
        actionsLogger.error({ err: error, action: 'createArtwork' }, 'Image upload failed');
        return { success: false, error: 'Image upload failed' };
    }

    const price = priceRaw ? parseFloat(priceRaw) : null;
    const year = yearRaw ? parseInt(yearRaw, 10) : null;

    try {
        const artwork = await prisma.artwork.create({
            data: {
                title,
                description,
                price: price ?? 0,
                year,
                dimensions,
                imageUrl,
                categoryId,
                artistId: artist.id,
                status: 'available', // Default to available
            },
            select: {
                id: true,
                title: true,
                imageUrl: true,
                price: true,
                categoryId: true,
            }
        });

        // Trigger alert check for the new artwork
        const alertResult = await triggerAlertCheck(artwork.id);
        if (alertResult.success && alertResult.data.length > 0) {
            actionsLogger.info({ action: 'createArtwork', artworkId: artwork.id, alertsCount: alertResult.data.length }, `${alertResult.data.length} alert(s) triggered for "${artwork.title}"`);
        }

        revalidatePath('/dashboard-artist/artworks');
        revalidatePath('/dashboard-artist/customization/profile');

        return { success: true, data: artwork, alertsTriggered: alertResult.success ? alertResult.data.length : 0 };
    } catch (error) {
        actionsLogger.error({ err: error, action: 'createArtwork' }, 'Failed to create artwork');
        return { success: false, error: 'Database error' };
    }
}

/**
 * Publish an existing artwork (set status to available) and trigger alert check
 */
export async function publishArtwork(artworkId: string) {
    const session = await auth();

    if (!session || (session.user as any).role !== 'artist') {
        return { success: false, error: 'Unauthorized' };
    }

    const artist = await ensureArtistProfile(session as Session, { select: { id: true } });
    if (!artist) {
        return { success: false, error: 'Artist profile not found' };
    }

    try {
        // Verify ownership and update status
        const artwork = await prisma.artwork.updateMany({
            where: {
                id: artworkId,
                artistId: artist.id,
            },
            data: {
                status: 'available',
            },
        });

        if (artwork.count === 0) {
            return { success: false, error: 'Artwork not found or unauthorized' };
        }

        // Trigger alert check
        const alertResult = await triggerAlertCheck(artworkId);
        const alertsTriggered = alertResult.success ? alertResult.data.length : 0;

        if (alertsTriggered > 0) {
            actionsLogger.info({ action: 'publishArtwork', artworkId, alertsCount: alertsTriggered }, `${alertsTriggered} alert(s) triggered`);
        }

        revalidatePath('/dashboard-artist/artworks');
        revalidatePath('/boutique');
        revalidatePath('/galerie');

        return { success: true, alertsTriggered };
    } catch (error) {
        actionsLogger.error({ err: error, action: 'publishArtwork', artworkId }, 'Failed to publish artwork');
        return { success: false, error: 'Database error' };
    }
}
