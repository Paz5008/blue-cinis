export const CACHE_TAGS = {
  galleryList: 'gallery-list',
  featuredArtworks: 'featured-artworks',
  artworkDetail: 'artwork-detail',
  artists: 'artists',
  artistsList: 'artists-list',
  featuredArtists: 'featured-artists',
  artistPosters: 'artist-posters',
  newestArtists: 'newest-artists',
  upcomingEvents: 'upcoming-events',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

export function artworkDetailTag(id: string) {
  return `${CACHE_TAGS.artworkDetail}:${id}`
}

export type CacheTagGroupKey = 'artists' | 'inventory' | 'events'

type CacheTagGroupConfig = {
  label: string
  description: string
  tags: readonly CacheTag[]
  paths: readonly string[]
}

export const CACHE_TAG_GROUPS: Record<CacheTagGroupKey, CacheTagGroupConfig> = {
  artists: {
    label: 'Artistes & home hero',
    description:
      'Bannières personnalisées, carrousels artistes, fiches publiques et listings homepage/artistes.',
    tags: [
      CACHE_TAGS.artists,
      CACHE_TAGS.artistsList,
      CACHE_TAGS.featuredArtists,
      CACHE_TAGS.artistPosters,
      CACHE_TAGS.newestArtists,
    ],
    paths: ['/', '/artistes'],
  },
  inventory: {
    label: 'Catalogue & variantes',
    description: 'Pages galerie, cartes œuvres, inventaire, variantes et widgets commerce.',
    tags: [CACHE_TAGS.galleryList, CACHE_TAGS.featuredArtworks],
    paths: ['/galerie'],
  },
  events: {
    label: 'Agenda & évènements',
    description: 'Listings évènementiels et pages associées.',
    tags: [CACHE_TAGS.upcomingEvents],
    paths: ['/evenements'],
  },
}

export type CacheTagGroup = typeof CACHE_TAG_GROUPS[CacheTagGroupKey]

export function listCacheTagGroups() {
  return Object.entries(CACHE_TAG_GROUPS).map(([key, group]) => ({
    key: key as CacheTagGroupKey,
    ...group,
  }))
}

export async function revalidateArtistCaches(trigger: (tag: CacheTag) => Promise<void> | void) {
  await Promise.all(CACHE_TAG_GROUPS.artists.tags.map((tag) => trigger(tag)))
}

export type CacheRevalidationScript = {
  id: string
  label: string
  description: string
  groups: CacheTagGroupKey[]
  extraTags?: CacheTag[]
  extraPaths?: string[]
}

export const CACHE_REVALIDATION_SCRIPTS: CacheRevalidationScript[] = [
  {
    id: 'artists-refresh',
    label: 'Artistes & homepage',
    description: 'Purge les caches bannière, carrousels et fiches artistes.',
    groups: ['artists'],
  },
  {
    id: 'inventory-refresh',
    label: 'Catalogue & variantes',
    description: 'Force la régénération des pages galerie et widgets stock.',
    groups: ['inventory'],
  },
  {
    id: 'events-refresh',
    label: 'Agenda live',
    description: 'Revalide la page évènements et le flux Agenda.',
    groups: ['events'],
  },
  {
    id: 'full-refresh',
    label: 'Purge complète',
    description: 'Ré-exécute l’ensemble des tags publics critiques (home, artistes, inventaire, agenda).',
    groups: ['artists', 'inventory', 'events'],
    extraPaths: ['/'],
  },
]

export function resolveRevalidationScript(id: string) {
  return CACHE_REVALIDATION_SCRIPTS.find((script) => script.id === id)
}

export function collectRevalidationTargets(script: CacheRevalidationScript) {
  const tags = new Set<CacheTag>()
  const paths = new Set<string>()
  script.groups.forEach((groupKey) => {
    const group = CACHE_TAG_GROUPS[groupKey]
    group.tags.forEach((tag) => tags.add(tag))
    group.paths.forEach((path) => paths.add(path))
  })
  script.extraTags?.forEach((tag) => tags.add(tag))
  script.extraPaths?.forEach((path) => paths.add(path))
  return {
    tags: Array.from(tags),
    paths: Array.from(paths),
  }
}
