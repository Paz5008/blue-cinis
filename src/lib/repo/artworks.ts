import { prisma } from './util'
import { safeQuery } from './util'

export type FeaturedArtwork = {
  id: string
  title: string
  imageUrl: string
  price: number
  artistId: string
  artistName: string
  artistSlug?: string
  artistHasStripe?: boolean
  artistEnableCommerce?: boolean
  year?: number
  dimensions?: string
  description?: string
}

export async function getFeatured(limit: number): Promise<FeaturedArtwork[]> {
  const take = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 8
  const res = await safeQuery(async () => {
    const rows = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        price: true,
        artistId: true,
        year: true,
        dimensions: true,
        description: true,
        artist: { select: { id: true, name: true, slug: true, stripeAccountId: true, enableCommerce: true } },
      },
    })
    return rows.map((a) => ({
      id: a.id,
      title: a.title,
      imageUrl: a.imageUrl || '',
      price: a.price,
      artistId: a.artistId,
      artistName: a.artist?.name || '',
      artistSlug: a.artist?.slug || undefined,
      artistHasStripe: !!a.artist?.stripeAccountId,
      artistEnableCommerce: a.artist?.enableCommerce !== false,
      year: a.year ?? undefined,
      dimensions: typeof a.dimensions === 'string' ? a.dimensions : JSON.stringify(a.dimensions),
      description: a.description ?? undefined,
    }))
  }, [] as FeaturedArtwork[])
  return res.data
}
