"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";
import { SmartImage } from "../SmartImage";
import { buildArtworkPath } from "@/lib/artworkSlug";

export const ArtworkListRenderer: React.FC<BlockRendererProps> = React.memo(({ block, context, style: injectedStyle }) => {
    const { artist, LinkComponent } = context;
    const baseStyle = composeBlockStyle(block.style || {});

    // Logic extracted from UniversalBlockRenderer
    const list = React.useMemo(() => {
        const artworks = Array.isArray(artist.artworks) ? artist.artworks : [];
        let result: any[] = [];

        if ((block.mode || "manual") === "query") {
            const q = block.query || {};
            result = artworks.filter((art: any) => {
                if (!art) return false;
                if (q.search) {
                    const search = String(q.search).toLowerCase();
                    const hay = `${art.title || ""} ${art.description || ""}`.toLowerCase();
                    if (!hay.includes(search)) return false;
                }
                if (Array.isArray(q.categoryIds) && q.categoryIds.length > 0) {
                    if (!q.categoryIds.includes(art.categoryId)) return false;
                }
                if (typeof q.priceMin === "number" && (art.price ?? 0) < q.priceMin) return false;
                if (typeof q.priceMax === "number" && (art.price ?? 0) > q.priceMax) return false;
                if (typeof q.yearMin === "number" && (art.year ?? 0) < q.yearMin) return false;
                if (typeof q.yearMax === "number" && (art.year ?? 0) > q.yearMax) return false;
                return true;
            });
        } else {
            const selection = Array.isArray(block.selection) ? block.selection : [];
            result = selection
                .map((id: string) => artworks.find((art: any) => art?.id === id))
                .filter(Boolean);
        }

        // Sorting
        if (block.sortBy && block.sortBy !== "manual") {
            const dir = block.sortOrder === "desc" ? -1 : 1;
            const key = block.sortBy;
            result = [...result].sort((a: any, b: any) => {
                const av = a?.[key] ?? "";
                const bv = b?.[key] ?? "";
                if (av < bv) return -1 * dir;
                if (av > bv) return 1 * dir;
                return 0;
            });
        }

        if (block.limit && Number(block.limit) > 0) {
            result = result.slice(0, Number(block.limit));
        }
        return result;
    }, [artist.artworks, block.mode, block.query, block.selection, block.sortBy, block.sortOrder, block.limit]);

    const baseCols = block.columns || block.columnsDesktop || 3;
    const isCarousel = block.layout === 'carousel';

    if (list.length === 0 && (context.disablePositioning || !context.isPreview)) {
        return (
            <div
                className="mb-3 p-6 border-2 border-dashed border-gray-200 rounded text-center"
                style={{ ...baseStyle, ...injectedStyle }}
            >
                <div className="text-slate-400">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-medium">Aucune œuvre trouvée</p>
                    <p className="text-xs text-slate-500">Modifiez les critères de recherche ou la sélection.</p>
                </div>
            </div>
        );
    }

    // Grid Classes
    const gridClassMap: Record<number, string> = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
    };
    const responsiveClass = isCarousel ? "" : (gridClassMap[baseCols] || "md:grid-cols-3");

    // Remove gridTemplateColumns from style if Grid Class is used (unless needed)
    // Actually BaseStyle might contain user overrides.
    // If Carousel, we need flex.

    const containerStyle = {
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width ? { marginLeft: "auto", marginRight: "auto" } : {}),
    };

    return (
        <div
            className={isCarousel
                ? "flex overflow-x-auto gap-4 mb-3 snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
                : `grid gap-4 mb-3 grid-cols-1 sm:grid-cols-2 ${responsiveClass}`
            }
            style={containerStyle}
        >
            {list.map((art) => {
                // Metadata lines
                const details: React.ReactNode[] = [];
                if (block.showYear !== false && art.year) details.push(<span key="year">{art.year}</span>);
                if (block.showDimensions !== false && art.dimensions) details.push(<span key="dims">{art.dimensions}</span>);

                const priceElement = (block.showPrice !== false && art.price) ? (
                    <div className="mt-1 font-medium text-slate-700">{art.price} €</div>
                ) : null;

                return (
                    <div key={art.id} className={isCarousel ? "flex-none w-[80vw] sm:w-[45vw] md:w-[30vw] snap-center" : ""}>
                        <LinkComponent href={buildArtworkPath({ id: art.id, title: art.title })} className="block group">
                            <SmartImage
                                context={context}
                                src={art.imageUrl || ""}
                                alt={art.title || ""}
                                className="w-full object-cover mb-2 rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                                loading="lazy"
                                style={{ aspectRatio: "1/1" }}
                            />
                            {block.showTitle !== false && (
                                <div className="text-sm font-semibold truncate" style={{ color: block.titleColor || "inherit" }}>
                                    {art.title}
                                </div>
                            )}
                            {(details.length > 0 || priceElement) && (
                                <div className="text-sm opacity-80 mt-1">
                                    <div className="flex flex-wrap gap-x-1">
                                        {details}
                                    </div>
                                    {priceElement}
                                </div>
                            )}
                        </LinkComponent>
                    </div>
                );
            })}
        </div>
    );
});
