'use client'

import { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// ========================================
// Types
// ========================================

export type ArtworkFiltersState = {
    priceMin: number
    priceMax: number
    styles: string[]
    mediums: string[]
    orientation: string | null
    availableOnly: boolean
}

export type ArtworkFiltersProps = {
    /** Initial filter values */
    initialFilters?: Partial<ArtworkFiltersState>
    /** Maximum price for the slider */
    maxPrice?: number
    /** Available style options */
    styleOptions?: { value: string; label: string }[]
    /** Available medium options */
    mediumOptions?: { value: string; label: string }[]
    /** Callback when filters change */
    onFiltersChange?: (filters: ArtworkFiltersState) => void
    /** Custom class name */
    className?: string
}

// ========================================
// Default Options
// ========================================

const DEFAULT_STYLE_OPTIONS = [
    { value: 'abstract', label: 'Abstrait' },
    { value: 'figurative', label: 'Figuratif' },
    { value: 'minimalist', label: 'Minimaliste' },
    { value: 'expressionist', label: 'Expressionniste' },
    { value: 'surrealist', label: 'Surréaliste' },
    { value: 'impressionist', label: 'Impressionniste' },
    { value: 'contemporary', label: 'Contemporain' },
]

const DEFAULT_MEDIUM_OPTIONS = [
    { value: 'oil', label: 'Huile' },
    { value: 'acrylic', label: 'Acrylique' },
    { value: 'watercolor', label: 'Aquarelle' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'mixed-media', label: 'Technique mixte' },
    { value: 'photography', label: 'Photographie' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'digital', label: 'Art numérique' },
]

const ORIENTATION_OPTIONS = [
    { value: null, label: 'Toutes' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Paysage' },
    { value: 'square', label: 'Carré' },
]

// ========================================
// Component
// ========================================

export function ArtworkFilters({
    initialFilters,
    maxPrice = 50000,
    styleOptions = DEFAULT_STYLE_OPTIONS,
    mediumOptions = DEFAULT_MEDIUM_OPTIONS,
    onFiltersChange,
    className,
}: ArtworkFiltersProps) {
    // Initialize state
    const [filters, setFilters] = useState<ArtworkFiltersState>({
        priceMin: initialFilters?.priceMin ?? 0,
        priceMax: initialFilters?.priceMax ?? maxPrice,
        styles: initialFilters?.styles ?? [],
        mediums: initialFilters?.mediums ?? [],
        orientation: initialFilters?.orientation ?? null,
        availableOnly: initialFilters?.availableOnly ?? true,
    })

    // Update filters and notify parent
    const updateFilters = useCallback(
        (updates: Partial<ArtworkFiltersState>) => {
            setFilters(prev => {
                const next = { ...prev, ...updates }
                onFiltersChange?.(next)
                return next
            })
        },
        [onFiltersChange]
    )

    // Toggle a value in an array
    const toggleArrayValue = useCallback(
        (field: 'styles' | 'mediums', value: string) => {
            setFilters(prev => {
                const current = prev[field]
                const next = current.includes(value)
                    ? current.filter(v => v !== value)
                    : [...current, value]
                const updated = { ...prev, [field]: next }
                onFiltersChange?.(updated)
                return updated
            })
        },
        [onFiltersChange]
    )

    // Reset all filters
    const resetFilters = useCallback(() => {
        const reset: ArtworkFiltersState = {
            priceMin: 0,
            priceMax: maxPrice,
            styles: [],
            mediums: [],
            orientation: null,
            availableOnly: true,
        }
        setFilters(reset)
        onFiltersChange?.(reset)
    }, [maxPrice, onFiltersChange])

    // Format price for display
    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(price)
    }, [])

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return (
            filters.priceMin > 0 ||
            filters.priceMax < maxPrice ||
            filters.styles.length > 0 ||
            filters.mediums.length > 0 ||
            filters.orientation !== null ||
            !filters.availableOnly
        )
    }, [filters, maxPrice])

    return (
        <div
            className={cn(
                'flex flex-col gap-6 p-5 rounded-xl',
                'bg-[var(--surface,rgba(22,35,59,0.8))]',
                'border border-[var(--border,rgba(241,245,249,0.12))]',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3
                    className="text-sm font-semibold tracking-wider uppercase"
                    style={{ color: 'var(--text-muted, #cbd5f5)' }}
                >
                    Filtres
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        className={cn(
                            'text-xs font-medium px-3 py-1.5 rounded-full',
                            'bg-[var(--accent,#2dd4bf)]/10',
                            'text-[var(--accent,#2dd4bf)]',
                            'hover:bg-[var(--accent,#2dd4bf)]/20',
                            'transition-colors duration-200'
                        )}
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {/* Price Range */}
            <div className="flex flex-col gap-3">
                <label
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-muted, #cbd5f5)' }}
                >
                    Prix
                </label>
                <div className="px-1">
                    <Slider
                        min={0}
                        max={maxPrice}
                        step={100}
                        value={[filters.priceMin, filters.priceMax]}
                        onValueChange={([min, max]) => updateFilters({ priceMin: min, priceMax: max })}
                    />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text, #f8fafc)' }}>
                    <span>{formatPrice(filters.priceMin)}</span>
                    <span>{formatPrice(filters.priceMax)}</span>
                </div>
            </div>

            {/* Styles */}
            <div className="flex flex-col gap-3">
                <label
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-muted, #cbd5f5)' }}
                >
                    Styles
                </label>
                <div className="flex flex-wrap gap-2">
                    {styleOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => toggleArrayValue('styles', option.value)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-full',
                                'border transition-all duration-200',
                                filters.styles.includes(option.value)
                                    ? 'bg-[var(--accent,#2dd4bf)] text-[var(--background,#0f172a)] border-transparent'
                                    : 'bg-transparent text-[var(--text,#f8fafc)] border-[var(--border,rgba(241,245,249,0.12))] hover:border-[var(--accent,#2dd4bf)]/50'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mediums */}
            <div className="flex flex-col gap-3">
                <label
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-muted, #cbd5f5)' }}
                >
                    Techniques
                </label>
                <div className="flex flex-wrap gap-2">
                    {mediumOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => toggleArrayValue('mediums', option.value)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-full',
                                'border transition-all duration-200',
                                filters.mediums.includes(option.value)
                                    ? 'bg-[var(--secondary,#f0b429)] text-[var(--background,#0f172a)] border-transparent'
                                    : 'bg-transparent text-[var(--text,#f8fafc)] border-[var(--border,rgba(241,245,249,0.12))] hover:border-[var(--secondary,#f0b429)]/50'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orientation */}
            <div className="flex flex-col gap-3">
                <label
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--text-muted, #cbd5f5)' }}
                >
                    Orientation
                </label>
                <div className="flex gap-2">
                    {ORIENTATION_OPTIONS.map(option => (
                        <button
                            key={option.value ?? 'all'}
                            onClick={() => updateFilters({ orientation: option.value })}
                            className={cn(
                                'flex-1 px-3 py-2 text-xs font-medium rounded-lg',
                                'border transition-all duration-200',
                                filters.orientation === option.value
                                    ? 'bg-[var(--primary,#1d3b62)] text-[var(--text,#f8fafc)] border-[var(--primary,#1d3b62)]'
                                    : 'bg-transparent text-[var(--text-muted,#cbd5f5)] border-[var(--border,rgba(241,245,249,0.12))] hover:text-[var(--text,#f8fafc)]'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3 pt-2">
                <Checkbox
                    checked={filters.availableOnly}
                    onCheckedChange={(checked) => updateFilters({ availableOnly: !!checked })}
                    aria-label="Afficher uniquement les œuvres disponibles"
                />
                <label
                    className="text-sm cursor-pointer"
                    style={{ color: 'var(--text, #f8fafc)' }}
                    onClick={() => updateFilters({ availableOnly: !filters.availableOnly })}
                >
                    Disponibles uniquement
                </label>
            </div>
        </div>
    )
}

export default ArtworkFilters
