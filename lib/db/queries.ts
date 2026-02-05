import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type ArtworksSearchParams = {
    category?: string
    minPrice?: string
    maxPrice?: string
    artistId?: string
    sort?: "newest" | "price_asc" | "price_desc"
    // New taxonomy filters
    styles?: string | string[]
    mediums?: string | string[]
    orientation?: string
    available?: string
}

export async function getFilteredArtworks(params: ArtworksSearchParams) {
    const { category, minPrice, maxPrice, artistId, sort, styles, mediums, orientation, available } = params

    // Build the where clause
    const where: Prisma.ArtworkWhereInput = {}

    // Availability filter (default to only available if not specified)
    if (available === 'false') {
        // Show all statuses
    } else {
        where.status = 'available'
    }

    if (category) {
        where.category = {
            name: category,
        }
    }

    if (artistId) {
        where.artistId = artistId
    }

    if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = parseInt(minPrice)
        if (maxPrice) where.price.lte = parseInt(maxPrice)
    }

    // Styles filter (array overlap)
    if (styles) {
        const styleArray = Array.isArray(styles) ? styles : [styles]
        if (styleArray.length > 0) {
            where.style = { hasSome: styleArray }
        }
    }

    // Mediums filter (medium is a string field)
    if (mediums) {
        const mediumArray = Array.isArray(mediums) ? mediums : [mediums]
        if (mediumArray.length > 0) {
            where.medium = { in: mediumArray }
        }
    }

    // Orientation filter
    if (orientation) {
        where.orientation = orientation
    }

    // Build the orderBy clause
    let orderBy: Prisma.ArtworkOrderByWithRelationInput = { createdAt: "desc" }

    if (sort === "price_asc") {
        orderBy = { price: "asc" }
    } else if (sort === "price_desc") {
        orderBy = { price: "desc" }
    }

    try {
        const artworks = await prisma.artwork.findMany({
            where,
            orderBy,
            include: {
                artist: {
                    select: {
                        name: true,
                        id: true,
                    },
                },
                category: {
                    select: {
                        name: true,
                        id: true,
                    },
                },
            },
        })
        return artworks
    } catch (error) {
        console.error("Error fetching filtered artworks:", error)
        return []
    }
}

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
        })
        return categories
    } catch (error) {
        console.error("Error fetching categories:", error)
        return []
    }
}

export async function getArtists(sort: 'name_asc' | 'name_desc' | 'artworks_desc' | 'style_asc' = 'name_asc') {
    try {
        let orderBy: Prisma.ArtistOrderByWithRelationInput = { name: "asc" }

        if (sort === 'name_desc') {
            orderBy = { name: "desc" }
        } else if (sort === 'artworks_desc') {
            orderBy = { artworks: { _count: "desc" } }
        } else if (sort === 'style_asc') {
            orderBy = { artStyle: "asc" }
        }

        const artists = await prisma.artist.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                photoUrl: true,
                artStyle: true,
                slug: true,
                _count: {
                    select: { artworks: true }
                }
            },
            orderBy,
        })
        return artists
    } catch (error) {
        console.error("Error fetching artists:", error)
        return []
    }
}
