import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { ADMIN_ARTWORK_DETAIL_SELECT, type AdminArtworkDetail } from '@/lib/adminArtworks'
import ArtworkDetailClient from './_components/ArtworkDetailClient'

type AuditEntry = {
  id: string
  action: string
  createdAt: string
  actorEmail?: string | null
  metadata: Record<string, unknown> | null
}

type ArtworkDetailView = Omit<AdminArtworkDetail, 'createdAt' | 'updatedAt' | 'reservedUntil'> & {
  createdAt: string
  updatedAt: string
  reservedUntil: string | null
  dimensions: string | null
}

export default async function ArtworkDetailPage({ params }: { params: { id: string } }) {
  const artworkId = params.id
  await requireAdminSessionOrRedirect(`/admin/artworks/${artworkId}`)

  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    select: ADMIN_ARTWORK_DETAIL_SELECT,
  })

  if (!artwork) {
    notFound()
  }

  const [artistOptions, categoryOptions, variantCount, reservationsCount, auditLogs] = await Promise.all([
    prisma.artist.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.variant.count({ where: { artworkId } }),
    prisma.reservation.count({ where: { artworkId, status: 'active' } }),
    prisma.adminAuditLog.findMany({
      where: { resource: artworkId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ])

  const serialized: ArtworkDetailView = {
    ...artwork,
    createdAt: artwork.createdAt.toISOString(),
    updatedAt: artwork.updatedAt.toISOString(),
    reservedUntil: artwork.reservedUntil ? artwork.reservedUntil.toISOString() : null,
    dimensions: typeof artwork.dimensions === 'string'
      ? artwork.dimensions
      : (artwork.dimensions ? JSON.stringify(artwork.dimensions) : null),
  }

  const timeline: AuditEntry[] = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    actorEmail: log.actorEmail,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
  }))

  return (
    <ArtworkDetailClient
      initialArtwork={serialized}
      artistOptions={artistOptions}
      categoryOptions={categoryOptions}
      auditLogs={timeline}
      metrics={{ variants: variantCount, reservations: reservationsCount }}
    />
  )
}
