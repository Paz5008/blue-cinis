"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { SmartImage } from "../SmartImage";
import { buildArtworkPath } from "@/lib/artworkSlug";

export const OeuvreRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { artist, LinkComponent } = context;
    const baseStyle = composeBlockStyle(block.style || {});

    // 1. Data Selection
    const ids = Array.isArray(block.artworks) ? block.artworks : [];
    let artworks = ids.length
        ? ids
            .map((id: string) => (artist.artworks || []).find((art: any) => art?.id === id))
            .filter(Boolean)
        : (artist.artworks || []);

    // Sorting (basic implementation)
    if (block.sortBy === 'title') {
        artworks.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
    } else if (block.sortBy === 'year') {
        // year might be string or number
        artworks.sort((a: any, b: any) => (b.year || '').toString().localeCompare(a.year || ''));
    }
    // Apply SortOrder
    if (block.sortOrder === 'desc') {
        artworks.reverse();
    }

    if (block.limit && Number(block.limit) > 0) {
        artworks = artworks.slice(0, Number(block.limit));
    }

    // Handle Empty State
    if (artworks.length === 0) {
        if (context.isPreview) {
            return (
                <div
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400"
                    style={{ ...baseStyle, ...injectedStyle, minHeight: '200px' }}
                >
                    <span className="font-medium text-sm text-center">Aucune œuvre sélectionnée</span>
                    <span className="text-xs text-center mt-1">Sélectionnez des œuvres dans le panneau latéral</span>
                </div>
            );
        }
        return null;
    }

    // 2. Layout (Responsive Grid)
    const baseCols = Number(block.columns) || 3;
    const gridClassMap: Record<number, string> = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
    };
    const responsiveClass = gridClassMap[baseCols] || "md:grid-cols-3";
    const gap = typeof block.gap === "number" ? block.gap : 16;

    // Remove gridTemplateColumns from baseStyle
    const { gridTemplateColumns, ...restStyle } = {
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width ? { marginLeft: "auto", marginRight: "auto" } : {}),
        gap,
    } as any;

    // 3. Card Renderer
    const renderArtwork = (art: any) => {
        if (!art) return null;

        // Metadata Lines
        const details: React.ReactNode[] = [];

        if (block.showYear !== false && art.year) details.push(<span key="year">{art.year}</span>);
        if (block.showDimensions !== false && art.dimensions) details.push(<span key="dims">{art.dimensions}</span>);
        if (block.showTechnique !== false && art.technique) details.push(<span key="tech" className="block sm:inline sm:before:content-['•'] sm:before:mx-1">{art.technique}</span>);

        const priceElement = (block.showPrice !== false && art.price) ? (
            <div className="mt-1 font-medium" style={{ color: block.descriptionColor || "#333" }}>{art.price} €</div>
        ) : null;

        const statusElement = (block.showStatus !== false && (art.status === 'sold' || art.status === 'reserved')) ? (
            <span className="ml-2 text-xs uppercase tracking-wide font-bold text-amber-600">
                {art.status === 'sold' ? 'Vendu' : 'Réservé'}
            </span>
        ) : null;

        const isBoxed = block.cardStyle === 'boxed';
        const isOverlay = block.cardStyle === 'overlay';

        const cardContent = (
            <>
                <div className={`relative ${isOverlay ? 'group overflow-hidden rounded-xl' : 'mb-3'}`}>
                    <SmartImage
                        context={context}
                        src={art.imageUrl || ""}
                        alt={art.title || ""}
                        className={`w-full object-cover transition-transform duration-500 ${isOverlay ? 'group-hover:scale-110' : 'rounded-xl'}`}
                        loading="lazy"
                        style={{ aspectRatio: "1/1" }} // Default to square/consistent aspect if not set? Or auto.
                    />
                    {isOverlay && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-white font-semibold text-lg">{art.title}</h3>
                            <p className="text-white/80 text-sm">{art.year} {art.dimensions}</p>
                        </div>
                    )}
                </div>

                {!isOverlay && (
                    <div className={isBoxed ? "p-4" : ""}>
                        {block.showTitle !== false && (
                            <div className="flex items-start justify-between">
                                <h3
                                    className="font-semibold leading-tight mb-1"
                                    style={{ color: block.titleColor || "inherit", fontSize: block.titleFontSize }}
                                >
                                    {art.title}
                                </h3>
                                {statusElement}
                            </div>
                        )}
                        {(details.length > 0 || priceElement) && (
                            <div className="text-sm opacity-80" style={{ color: block.dimensionsColor || "inherit", fontSize: block.dimensionsFontSize }}>
                                <div className="flex flex-wrap gap-x-1">
                                    {details}
                                </div>
                                {priceElement}
                            </div>
                        )}
                    </div>
                )}
            </>
        );

        return (
            <LinkComponent
                key={art.id}
                href={buildArtworkPath({ id: art.id, title: art.title })}
                className={`block transition-opacity hover:opacity-90 ${isBoxed ? 'rounded-xl overflow-hidden' : ''}`}
                style={isBoxed ? {
                    backgroundColor: block.cardBackgroundColor || '#fff',
                    padding: block.cardPadding,
                    borderRadius: block.cardBorderRadius
                } : undefined}
            >
                {cardContent}
            </LinkComponent>
        );
    };

    return (
        <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${responsiveClass}`}
            style={restStyle}
        >
            {artworks.map(renderArtwork)}
        </div>
    );
};
