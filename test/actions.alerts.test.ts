import { describe, it, expect } from 'vitest'
import { matchesAlert } from '../src/lib/alertMatching'
import type { ArtAlert, Artwork } from '@prisma/client'

// ========================================
// Fixtures
// ========================================

const createMockArtwork = (overrides: Partial<Artwork> = {}): Artwork & { artist: { id: string }; category: { id: string } | null } => ({
    id: 'artwork-1',
    title: 'Test Artwork',
    imageUrl: 'https://example.com/image.jpg',
    price: 1500,
    stockQuantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    artistId: 'artist-1',
    artistName: 'Test Artist',
    mediaLibraryId: null,
    condition: null,
    medium: 'oil',
    dimensions: null,
    provenance: null,
    certificate: true,
    year: 2024,
    categoryId: 'cat-1',
    description: null,
    status: 'available' as ArtworkStatus,
    reservedUntil: null,
    style: ['abstract', 'minimalist'],
    mood: ['serene'],
    colors: [],
    tags: [],
    widthCm: 80,
    heightCm: 100,
    depthCm: null,
    orientation: 'portrait',
    isFramed: false,
    isOriginal: true,
    isSigned: true,
    artist: { id: 'artist-1' },
    category: { id: 'cat-1' },
    ...overrides,
} as any)

const createMockAlert = (overrides: Partial<ArtAlert> = {}): ArtAlert => ({
    id: 'alert-1',
    userId: 'user-1',
    artistIds: [],
    categoryIds: [],
    styles: [],
    mediums: [],
    priceMin: null,
    priceMax: null,
    emailEnabled: true,
    pushEnabled: false,
    frequency: 'immediate',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTriggeredAt: null,
    ...overrides,
})

// ========================================
// Tests
// ========================================

describe('matchesAlert', () => {
    it('should return true when styles overlap', () => {
        const artwork = createMockArtwork({
            style: ['abstract', 'minimalist'],
        })
        const alert = createMockAlert({
            styles: ['abstract', 'expressionist'],
        })

        expect(matchesAlert(artwork, alert)).toBe(true)
    })

    it('should return false when price is below priceMin', () => {
        const artwork = createMockArtwork({
            price: 500,
        })
        const alert = createMockAlert({
            priceMin: 1000,
            priceMax: 5000,
        })

        expect(matchesAlert(artwork, alert)).toBe(false)
    })

    it('should return false when price is above priceMax', () => {
        const artwork = createMockArtwork({
            price: 10000,
        })
        const alert = createMockAlert({
            priceMin: 1000,
            priceMax: 5000,
        })

        expect(matchesAlert(artwork, alert)).toBe(false)
    })

    it('should return true when all criteria are empty (catch-all alert)', () => {
        const artwork = createMockArtwork()
        const alert = createMockAlert({
            artistIds: [],
            categoryIds: [],
            styles: [],
            mediums: [],
            priceMin: null,
            priceMax: null,
        })

        expect(matchesAlert(artwork, alert)).toBe(true)
    })

    it('should return false when styles do not overlap', () => {
        const artwork = createMockArtwork({
            style: ['figurative', 'impressionist'],
        })
        const alert = createMockAlert({
            styles: ['abstract', 'expressionist'],
        })

        expect(matchesAlert(artwork, alert)).toBe(false)
    })

    it('should return true when price is within range', () => {
        const artwork = createMockArtwork({
            price: 2500,
        })
        const alert = createMockAlert({
            priceMin: 1000,
            priceMax: 5000,
        })

        expect(matchesAlert(artwork, alert)).toBe(true)
    })

    it('should return true when artist matches', () => {
        const artwork = createMockArtwork({
            artistId: 'specific-artist',
        })
        const alert = createMockAlert({
            artistIds: ['specific-artist', 'other-artist'],
        })

        expect(matchesAlert(artwork, alert)).toBe(true)
    })

    it('should return false when artist does not match', () => {
        const artwork = createMockArtwork({
            artistId: 'different-artist',
        })
        const alert = createMockAlert({
            artistIds: ['specific-artist', 'other-artist'],
        })

        expect(matchesAlert(artwork, alert)).toBe(false)
    })

    it('should return true when medium matches', () => {
        const artwork = createMockArtwork({
            medium: 'oil',
        })
        const alert = createMockAlert({
            mediums: ['oil', 'acrylic'],
        })

        expect(matchesAlert(artwork, alert)).toBe(true)
    })

    it('should return false when medium does not match', () => {
        const artwork = createMockArtwork({
            medium: 'watercolor',
        })
        const alert = createMockAlert({
            mediums: ['oil', 'acrylic'],
        })

        expect(matchesAlert(artwork, alert)).toBe(false)
    })
})
