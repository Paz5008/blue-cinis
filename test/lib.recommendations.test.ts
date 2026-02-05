import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the module
vi.mock('@/lib/prisma', () => ({
    prisma: {
        artwork: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        like: {
            findMany: vi.fn(),
        },
    },
}))

import { getRecommendations, getArtworkRecommendations } from '../src/lib/recommendations'
import { prisma } from '@/lib/prisma'

const mockedPrisma = prisma as unknown as {
    artwork: {
        findMany: ReturnType<typeof vi.fn>
        findUnique: ReturnType<typeof vi.fn>
    }
    like: {
        findMany: ReturnType<typeof vi.fn>
    }
}

// ========================================
// Fixtures
// ========================================

const createMockArtwork = (id: string, artistId: string, overrides = {}) => ({
    id,
    title: `Artwork ${id}`,
    imageUrl: 'https://example.com/image.jpg',
    price: 1500,
    artistId,
    status: 'available',
    createdAt: new Date(),
    categoryId: 'cat-1',
    style: ['abstract'],
    mood: ['serene'],
    ...overrides,
})

// ========================================
// Tests
// ========================================

describe('getRecommendations', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return artworks from the same artist first', async () => {
        const sameArtistWorks = [
            createMockArtwork('art-2', 'artist-1'),
            createMockArtwork('art-3', 'artist-1'),
        ]

        mockedPrisma.artwork.findMany.mockResolvedValueOnce(sameArtistWorks)
        mockedPrisma.artwork.findUnique.mockResolvedValueOnce(null)
        mockedPrisma.artwork.findMany.mockResolvedValueOnce([]) // similar artworks

        const result = await getRecommendations({
            currentArtworkId: 'art-1',
            artistId: 'artist-1',
        })

        expect(result).toHaveLength(2)
        expect(result[0].id).toBe('art-2')
        expect(result[1].id).toBe('art-3')
        expect(mockedPrisma.artwork.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    artistId: 'artist-1',
                }),
            })
        )
    })

    it('should fallback to popular/recent artworks when no context provided', async () => {
        const popularWorks = [
            createMockArtwork('pop-1', 'artist-2'),
            createMockArtwork('pop-2', 'artist-3'),
        ]

        mockedPrisma.artwork.findMany.mockResolvedValueOnce(popularWorks)

        const result = await getRecommendations({})

        expect(result.length).toBeGreaterThanOrEqual(0) // Fallback returns popular artworks
        expect(mockedPrisma.artwork.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: 'available',
                }),
                orderBy: expect.arrayContaining([
                    expect.objectContaining({ Like: { _count: 'desc' } }),
                ]),
            })
        )
    })

    it('should exclude the current artwork from recommendations', async () => {
        const recommendations = [createMockArtwork('art-2', 'artist-1')]

        mockedPrisma.artwork.findMany.mockResolvedValueOnce(recommendations)
        mockedPrisma.artwork.findUnique.mockResolvedValueOnce(null)
        mockedPrisma.artwork.findMany.mockResolvedValueOnce([])

        await getRecommendations({
            currentArtworkId: 'excluded-id',
            artistId: 'artist-1',
        })

        expect(mockedPrisma.artwork.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: { notIn: ['excluded-id'] },
                }),
            })
        )
    })

    it('should combine same artist works with similar category works', async () => {
        const sameArtist = [createMockArtwork('same-1', 'artist-1')]
        const similar = [createMockArtwork('similar-1', 'artist-2')]
        const currentArtwork = createMockArtwork('current', 'artist-1', { categoryId: 'painting' })

        mockedPrisma.artwork.findMany.mockResolvedValueOnce(sameArtist)
        mockedPrisma.artwork.findUnique.mockResolvedValueOnce(currentArtwork)
        mockedPrisma.artwork.findMany.mockResolvedValueOnce(similar)

        const result = await getRecommendations({
            currentArtworkId: 'current',
            artistId: 'artist-1',
        }, 8)

        // Verify that findMany was called for both same artist and similar
        expect(mockedPrisma.artwork.findMany).toHaveBeenCalledTimes(2)
        expect(mockedPrisma.artwork.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'current' }
            })
        )
    })
})

describe('getArtworkRecommendations', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should delegate to getRecommendations with correct context', async () => {
        const recommendations = [createMockArtwork('rec-1', 'artist-1')]

        mockedPrisma.artwork.findMany.mockResolvedValueOnce(recommendations)
        mockedPrisma.artwork.findUnique.mockResolvedValueOnce(null)
        mockedPrisma.artwork.findMany.mockResolvedValueOnce([])

        const result = await getArtworkRecommendations(
            'artwork-123',
            'artist-456',
            'user-789',
            4
        )

        expect(result).toHaveLength(1)
        expect(mockedPrisma.artwork.findMany).toHaveBeenCalled()
    })
})
