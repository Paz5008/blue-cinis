import type { CanvasSettings } from "@/types/cms";

export type Artwork = {
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

export type BannerContent = {
    blocks?: any[];
    theme?: Record<string, any>;
    settings?: (CanvasSettings & Record<string, any>) | null;
};

export type ArtistCanvasPageKey = "banner" | "poster";

export type ArtistPosterCanvasProps = {
    artist: ArtistContext;
    content: BannerContent | null | undefined;
    searchParams?: Record<string, string | string[] | undefined>;
    variant?: "standalone" | "preview" | "home";
    showBackLink?: boolean;
    pageKey?: ArtistCanvasPageKey;
    fallbackRenderer?: (artist: ArtistContext, context: { isPreview: boolean }) => React.ReactNode;
};
