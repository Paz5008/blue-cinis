import { requireAdminSessionOrRedirect } from '@/lib/adminGuard'
import VariantsClient from './_components/VariantsClient'

export default async function ArtworkVariantsAdminPage({ params }: { params: { id: string } }) {
  const artworkId = params.id
  await requireAdminSessionOrRedirect(`/admin/artworks/${artworkId}/variants`)
  return <VariantsClient artworkId={artworkId} />
}
