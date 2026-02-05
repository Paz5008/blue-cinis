'use server'

import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/adminGuard'
import { revalidatePath, revalidateTag } from 'next/cache'
import { mailer } from '@/lib/mailer'
import { CACHE_TAG_GROUPS } from '@/lib/cacheTags'
import { z } from 'zod'

const actionSchema = z.object({
    pageId: z.string().uuid(),
    reason: z.string().optional(),
})

/**
 * Approve publication:
 * - Copy draftContent -> publishedContent
 * - Set status -> 'published'
 * - Set publishedAt -> now
 * - Revalidate caches
 */
export async function approveArtistPage(formData: FormData) {
    const session = await requireAdminSession()
    const pageId = formData.get('pageId') as string

    const parsed = actionSchema.safeParse({ pageId })
    if (!parsed.success) {
        throw new Error('Invalid page ID')
    }

    const page = await prisma.artistPage.findUnique({
        where: { id: pageId },
        include: { user: true },
    })

    if (!page) throw new Error('Page not found')
    if (!page.draftContent) throw new Error('No draft to publish')

    // Publish
    await prisma.artistPage.update({
        where: { id: pageId },
        data: {
            publishedContent: page.draftContent,
            status: 'published',
            publishedAt: new Date(),
        },
    })

    // Revalidate Global Tags
    CACHE_TAG_GROUPS.artists.tags.forEach((tag) => revalidateTag(tag))

    // Revalidate Specific Page
    // We need to know the artist slug. Relation is User -> Artist (one-to-one) -> ArtistPage (via User ID)
    // page.user.id -> Artist.userId
    const artist = await prisma.artist.findUnique({
        where: { userId: page.userId },
        select: { slug: true, id: true },
    })

    if (artist) {
        const slug = artist.slug || artist.id
        revalidatePath(`/artistes/${slug}`)
        // If it's a specific key like 'poster', revalidate that too if it had a specific route
        if (page.key !== 'profile') {
            revalidatePath(`/artistes/${slug}/${page.key}`)
        }
    }

    // Notify Artist (Optional)
    if (page.user.email) {
        await mailer.send({
            to: page.user.email,
            subject: 'Votre page a été validée et publiée !',
            text: `Félicitations, votre page personnalisée ("${page.key}") est maintenant en ligne sur Blue Cinis.`,
        })
    }

    return { success: true }
}

/**
 * Reject publication:
 * - Set status -> 'draft'
 * - Send feedback email
 */
export async function rejectArtistPage(formData: FormData) {
    const session = await requireAdminSession()
    const pageId = formData.get('pageId') as string
    const reason = formData.get('reason') as string

    const parsed = actionSchema.safeParse({ pageId, reason })
    if (!parsed.success) {
        throw new Error('Invalid input')
    }

    const page = await prisma.artistPage.findUnique({
        where: { id: pageId },
        include: { user: true },
    })

    if (!page) throw new Error('Page not found')

    // Revert status to draft
    await prisma.artistPage.update({
        where: { id: pageId },
        data: {
            status: 'draft',
        },
    })

    // Notify Artist
    if (page.user.email) {
        await mailer.send({
            to: page.user.email,
            subject: 'Action requise : Votre page nécessite des ajustements',
            text: `Bonjour,\n\nVotre demande de publication pour la page "${page.key}" n'a pas pu être validée pour la raison suivante :\n\n"${reason}"\n\nVous pouvez modifier votre page depuis votre tableau de bord et soumettre une nouvelle demande.\n\nL'équipe Blue Cinis.`,
        })
    }

    return { success: true }
}
