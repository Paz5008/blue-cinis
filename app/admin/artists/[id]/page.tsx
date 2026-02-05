import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { ADMIN_ARTIST_DETAIL_SELECT, type AdminArtistDetail } from '@/lib/adminArtists'
import ArtistDetailClient from './_components/ArtistDetailClient'

type AdminAuditEntry = {
  id: string
  action: string
  createdAt: string
  actorEmail?: string | null
  metadata: Record<string, unknown> | null
}

type ArtistDetailView = Omit<AdminArtistDetail, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export default async function ArtistDetailPage({ params }: { params: { id: string } }) {
  const artistId = params.id
  await requireAdminSessionOrRedirect(`/admin/artists/${artistId}`)

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: ADMIN_ARTIST_DETAIL_SELECT,
  })

  if (!artist) {
    notFound()
  }

  const [artworksCount, auditLogs] = await Promise.all([
    prisma.artwork.count({ where: { artistId } }),
    prisma.adminAuditLog.findMany({
      where: { resource: artistId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ])

  const serialized: ArtistDetailView = {
    ...artist,
    createdAt: artist.createdAt.toISOString(),
    updatedAt: artist.updatedAt.toISOString(),
  }

  const timeline: AdminAuditEntry[] = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    actorEmail: log.actorEmail,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
  }))

  return (
    <ArtistDetailClient
      initialArtist={serialized}
      auditLogs={timeline}
      metrics={{ artworks: artworksCount }}
    />
  )
}
