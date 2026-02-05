'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { ArtworkFilters, type ArtworkFiltersState } from '@/components/artwork/ArtworkFilters'

interface GalerieFiltersClientProps {
    /** Initial filter values from URL searchParams */
    initialFilters?: Partial<ArtworkFiltersState>
    /** Custom class name */
    className?: string
}

/**
 * Client wrapper for ArtworkFilters that syncs filter state with URL
 * On filter change, updates the URL searchParams to trigger server-side refetch
 */
export function GalerieFiltersClient({
    initialFilters,
    className,
}: GalerieFiltersClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleFiltersChange = useCallback((filters: ArtworkFiltersState) => {
        // Build new URL with updated filters
        const params = new URLSearchParams(searchParams?.toString() || '')

        // Price range
        if (filters.priceMin > 0) {
            params.set('minPrice', String(filters.priceMin))
        } else {
            params.delete('minPrice')
        }

        if (filters.priceMax < 50000) {
            params.set('maxPrice', String(filters.priceMax))
        } else {
            params.delete('maxPrice')
        }

        // Styles (array to comma-separated)
        if (filters.styles.length > 0) {
            params.set('styles', filters.styles.join(','))
        } else {
            params.delete('styles')
        }

        // Mediums (array to comma-separated)
        if (filters.mediums.length > 0) {
            params.set('mediums', filters.mediums.join(','))
        } else {
            params.delete('mediums')
        }

        // Orientation
        if (filters.orientation) {
            params.set('orientation', filters.orientation)
        } else {
            params.delete('orientation')
        }

        // Available only (default is true, so only add param when false)
        if (!filters.availableOnly) {
            params.set('available', 'false')
        } else {
            params.delete('available')
        }

        // Navigate to new URL (this triggers server component refetch)
        const queryString = params.toString()
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname
        router.push(newUrl, { scroll: false })
    }, [router, pathname, searchParams])

    return (
        <ArtworkFilters
            initialFilters={initialFilters}
            onFiltersChange={handleFiltersChange}
            className={className}
        />
    )
}

export default GalerieFiltersClient
