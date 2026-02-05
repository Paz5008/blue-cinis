import { revalidatePath, revalidateTag } from 'next/cache'
import { CACHE_TAG_GROUPS, artworkDetailTag } from '@/lib/cacheTags'

type RevalidateInventoryOptions = {
  artworkIds?: string[]
}

export async function revalidateInventory(options?: RevalidateInventoryOptions) {
  const group = CACHE_TAG_GROUPS.inventory
  const ids = Array.from(new Set(options?.artworkIds?.filter(Boolean) ?? []))
  await Promise.all([
    ...group.tags.map((tag) => revalidateTag(tag)),
    ...group.paths.map((path) => revalidatePath(path)),
    ...ids.map((id) => revalidateTag(artworkDetailTag(id))),
    revalidatePath("/galerie/[slug]"),
  ])
}
