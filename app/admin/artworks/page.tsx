import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { prisma } from '@/lib/prisma'
import { buildArtworkQuery, resolveArtworkFilters } from '@/lib/adminFilters'
import ArtworksClient from './_components/ArtworksClient'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminArtworksPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminSessionOrRedirect('/admin/artworks')

  const filters = resolveArtworkFilters(searchParams)
  const { where, orderBy } = buildArtworkQuery(filters)

  const total = await prisma.artwork.count({ where })
  const items = await prisma.artwork.findMany({
    where,
    orderBy,
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
    select: { id: true, title: true, price: true, imageUrl: true, artistName: true },
  })

  const artists = await prisma.artist.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, isActive: true },
  })

  return (
    <ArtworksClient
      data={{ page: filters.page, pageSize: filters.pageSize, total, items }}
      filters={{ q: filters.q, sort: filters.sort }}
      artistOptions={artists}
    />
  )
}
