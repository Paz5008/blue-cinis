import React from "react";

type Artwork = {
    id: string;
    title?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    price?: number | null;
    year?: number | null;
    dimensions?: string | null;
    categoryId?: string | null;
};

export type ArtistContext = {
    id: string;
    name: string;
    slug?: string | null;
    biography?: string | null;
    photoUrl?: string | null;
    artworks?: Artwork[];
};

export type ArtistCanvasPageKey = "banner" | "poster" | "profile";

export type RenderContext = {
    artist: ArtistContext;
    sanitize: (html: string) => string;
    searchString: string;
    isPreview: boolean;
    useNextLink: boolean;
    LinkComponent: React.ComponentType<any> | string;
    pageKey: ArtistCanvasPageKey;
    isMobile: boolean;
    disablePositioning?: boolean;
    debug?: boolean;
    renderBlock?: (block: any, index: number, overrideContext?: Partial<RenderContext>) => React.ReactNode;
};

export type BlockRendererProps<T = any> = {
    block: T;
    index: number;
    context: RenderContext;
    className?: string;
    style?: React.CSSProperties;
};
