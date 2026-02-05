// components/ArtworkCard.tsx
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { shimmerDataURL } from '@/lib/blur';
import Link from 'next/link';
// Importation des icônes supplémentaires
import { User, Tag, Ruler, CalendarDays, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { type FeaturedArtwork } from "@/lib/data/artworks";
import AddToCartButton from "@/components/features/commerce/AddToCartButton";
import { SubTitle, BodyText } from "@/components/typography";
import CardShell from "@/components/ui/CardShell";
import { useI18n } from '@/i18n/provider'
import { buildArtworkPath } from '@/lib/artworkSlug'

// --- Interface Artwork (doit inclure les nouveaux champs) ---
interface Artwork {
    id: string | number;
    artworkId?: string;
    slug?: string;
    title: string;
    imageUrl?: string;
    price: number | null;
    artistId: string | number;
    artistSlug?: string;
    artistName: string;
    dimensions?: string; // Ajouté
    year?: number | string; // Ajouté
    status?: 'available' | 'sold' | 'archived'; // Ajouté
    description?: string;
    /** L'artiste dispose d'un compte Stripe connecté */
    artistHasStripe?: boolean;
    /** L'artiste a activé la vente en ligne */
    artistEnableCommerce?: boolean;
}

interface ArtworkCardProps {
    artwork: Artwork;
    className?: string;
    /** Inline styles to override default card styling */
    style?: CSSProperties;
    /**
     * Controls for what the card renders. All default to true for backward compatibility.
     * This allows callers (e.g. the CMS "oeuvre" block) to avoid duplicating
     * metadata below the card by hiding it inside the card when desired.
     */
    showTitle?: boolean;
    showArtist?: boolean;
    showPrice?: boolean;
    showYear?: boolean;
    showDimensions?: boolean;
    /** Show the artwork description inside the card (hidden by default) */
    showDescription?: boolean;
    /** Show availability badge if provided */
    showAvailability?: boolean;
    /** Show an "Add to cart" button when e-commerce flow is enabled */
    showAddToCart?: boolean;
    /** Optional class to override default image container sizing */
    imageClassName?: string;
    inEditor?: boolean;
}

export default function ArtworkCard({
    artwork,
    className,
    style,
    showTitle = true,
    showArtist = true,
    showPrice = true,
    showYear = true,
    showDimensions = true,
    showDescription = false,
    showAvailability = true,
    showAddToCart,
    imageClassName,
    inEditor = false,
}: ArtworkCardProps) {
    const { t } = useI18n()
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return
        }
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        const handler = () => setPrefersReducedMotion(media.matches)
        setPrefersReducedMotion(media.matches)
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handler)
        } else {
            media.addListener(handler)
        }
        return () => {
            if (typeof media.removeEventListener === 'function') {
                media.removeEventListener('change', handler)
            } else {
                media.removeListener(handler)
            }
        }
    }, [])
    const withFallback = (key: string, fallback: string) => {
        const value = t(key)
        return value === key ? fallback : value
    }
    const {
        id,
        artworkId,
        title,
        imageUrl,
        price,
        artistId,
        artistSlug,
        artistName,
        dimensions, // Nouveau champ
        year,       // Nouveau champ
        status      // Nouveau champ (optionnel)
    } = artwork;

    const canonicalId = typeof artworkId === "string" && artworkId.length > 0
        ? artworkId
        : String(id);
    const artworkLink = buildArtworkPath({
        id: canonicalId,
        title,
        slug: artwork.slug,
    });
    const artistLink = `/artistes/${artistSlug || artistId}`;
    const imageSrc = imageUrl || '/images/placeholder-artwork.jpg';

    const hasNumericPrice = typeof price === 'number' && Number.isFinite(price);
    const formattedPrice = hasNumericPrice
        ? new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price)
        : withFallback('common.price_on_request', 'Prix sur demande');

    // E-commerce feature flag: default to NEXT_PUBLIC_ECOMMERCE_ENABLED if present, otherwise false in production
    const ecommerceEnabled = typeof showAddToCart === 'boolean'
        ? showAddToCart
        : (process.env.NEXT_PUBLIC_ECOMMERCE_ENABLED === '1' || process.env.NEXT_PUBLIC_ECOMMERCE_ENABLED === 'true' || process.env.NODE_ENV !== 'production');
    const isAvailableFlag = status === 'available';
    const commerceAllowed = ecommerceEnabled
        && isAvailableFlag
        && hasNumericPrice
        && !!artwork.artistHasStripe
        && (artwork.artistEnableCommerce !== false);
    return (
        <CardShell
            style={style}
            className={clsx(
                "relative h-full flex flex-col group transform-gpu",
                !prefersReducedMotion &&
                "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)] focus-within:-translate-y-1.5 focus-within:shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
                className
            )}
        >
            {/* Image Area - Linked */}
            <Link
                href={artworkLink}
                aria-label={`Voir les détails de l'œuvre ${title || 'sans titre'}`}
                className={clsx(
                    "block relative w-full overflow-hidden",
                    imageClassName || "h-56 sm:h-64"
                )}
            >
                <Image
                    src={imageSrc}
                    alt={title ? `Image de l'œuvre ${title}` : "Œuvre d'art"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-slow ease-in-out group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={shimmerDataURL(16, 9)}
                />
                <div
                    className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-normal"
                    aria-hidden="true"
                />
            </Link>

            {/* Content Area */}
            {/* Augmentation légère du padding */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Title - Linked */}
                {showTitle && (
                    <SubTitle as="h3" className="leading-snug mb-1 line-clamp-2 text-heading">
                        <Link href={artworkLink} className="hover:text-accent transition-colors duration-fast">
                            {title || "Titre non disponible"}
                        </Link>
                    </SubTitle>
                )}

                {/* Artist Info - Linked */}
                {showArtist && (
                    <div className="mt-1 mb-2"> {/* Léger ajustement marge */}
                        <Link
                            href={artistLink}
                            className={clsx(
                                "inline-flex items-center text-sm group/artist",
                                "text-body-subtle hover:text-accent",
                                "transition-colors duration-fast"
                            )}
                            aria-label={`Voir le profil de l'artiste ${artistName || 'inconnu'}`}
                        >
                            <User size={14} className="mr-1.5 flex-shrink-0 text-icon-subtle group-hover/artist:text-accent transition-colors duration-fast" aria-hidden="true" />
                            <span>{artistName || "Artiste inconnu"}</span>
                        </Link>
                    </div>
                )}

                {/* --- Details (Dimensions, Year, Description) --- */}
                {(showDimensions || showYear || (showDescription && !!artwork.description)) && (
                    <div className="text-xs text-body-subtle space-y-1 mt-2 mb-3">
                        {showDimensions && dimensions && (
                            <BodyText as="p" className="flex items-center text-xs" title="Dimensions">
                                <Ruler size={13} className="mr-1.5 flex-shrink-0 text-icon-subtle" aria-hidden="true" />
                                {dimensions}
                            </BodyText>
                        )}
                        {showYear && year && (
                            <BodyText as="p" className="flex items-center text-xs" title="Année de création">
                                <CalendarDays size={13} className="mr-1.5 flex-shrink-0 text-icon-subtle" aria-hidden="true" />
                                {year}
                            </BodyText>
                        )}
                        {showDescription && artwork.description && (
                            <BodyText as="p" className="leading-relaxed text-body line-clamp-3">{artwork.description}</BodyText>
                        )}
                    </div>
                )}

                {/* Bottom Section: Price and Availability */}
                {/* Utilisation de flex pour aligner prix et badge (si présent) */}
                <div className="mt-auto pt-3 flex items-center justify-between text-base gap-2">
                    {/* Price */}
                    {showPrice && (
                        <span className="font-medium text-accent flex items-center">
                            {/* Icône de prix légèrement plus grande */}
                            <Tag size={16} className="mr-1.5 flex-shrink-0 opacity-90 text-current" aria-hidden="true" />
                            {formattedPrice}
                        </span>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                        {/* CTA: Voir l'œuvre */}
                        <Link href={artworkLink} className="inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                            {t('common.view_artwork')} <ChevronRight size={14} className="ml-1" />
                        </Link>
                        {/* Availability Badge (Optionnel) */}
                        {showAvailability && status === 'sold' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                Vendu
                            </span>
                        )}
                        {/* Add to cart button when enabled */}
                        {commerceAllowed && (
                            <AddToCartButton
                                artwork={{ id: String(id), artworkId: String(id), title: title || 'Œuvre', price: price as number }}
                                disabled={!isAvailableFlag}
                                className="ml-1"
                            />
                        )}
                        {/* Editor-only hint when e-comm enabled but stripe not connected */}
                        {inEditor && ecommerceEnabled && !artwork.artistHasStripe && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 ml-1" title="Connectez Stripe pour activer le bouton ‘Ajouter à la sélection’.">
                                Paiements désactivés
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </CardShell>
    );
}
