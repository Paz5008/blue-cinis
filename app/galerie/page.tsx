import { Suspense } from "react"
import { getFilteredArtworks, getCategories, getArtists } from "@/lib/db/queries"
import GalleryPageClient from "@/components/features/gallery/GalleryPageClient"

export const metadata = {
  title: "Collection | Blue Cinis",
  description: "Explore our curated selection of contemporary artworks from emerging and established artists.",
}

// Next.js 15 SearchParams type definition
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

// Parse comma-separated string to array
function parseArrayParam(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value.split(',').filter(Boolean)
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // Parse params for the query function
  const queryParams = {
    category: typeof params.category === "string" ? params.category : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    artistId: typeof params.artistId === "string" ? params.artistId : undefined,
    sort: typeof params.sort === "string" ? (params.sort as "newest" | "price_asc" | "price_desc") : undefined,
    // New taxonomy filters
    styles: parseArrayParam(params.styles),
    mediums: parseArrayParam(params.mediums),
    orientation: typeof params.orientation === "string" ? params.orientation : undefined,
    available: typeof params.available === "string" ? params.available : undefined,
  }

  // Parallel data fetching
  const [artworks, categories, artists] = await Promise.all([
    getFilteredArtworks(queryParams),
    getCategories(),
    getArtists(),
  ])

  // Build initial filters for client component
  const initialFilters = {
    priceMin: queryParams.minPrice ? parseInt(queryParams.minPrice) : 0,
    priceMax: queryParams.maxPrice ? parseInt(queryParams.maxPrice) : 50000,
    styles: queryParams.styles,
    mediums: queryParams.mediums,
    orientation: queryParams.orientation || null,
    availableOnly: queryParams.available !== 'false',
  }

  return (
    <GalleryPageClient
      artworks={artworks}
      categories={categories}
      initialFilters={queryParams}
    />
  )
}
