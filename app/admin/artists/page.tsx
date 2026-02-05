import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import { prisma } from '@/lib/prisma'
import ArtistsClient from './_components/ArtistsClient'

export default async function AdminArtistsPage() {
  await requireAdminSessionOrRedirect('/admin/artists')

  const artists = await prisma.artist.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, isActive: true, isFeatured: true },
  })

  return <ArtistsClient initialArtists={artists} />
}
