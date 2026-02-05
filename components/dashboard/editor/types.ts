

import type { Block, BlockType, ThemeConfig } from '@/types/cms';
import { type ThemeTokens } from '@/lib/cms/themeTokens';
import { CategoryOption } from '../ArtworkCreateForm';

export type QuickSectionTag = 'hero' | 'story' | 'gallery' | 'interaction' | 'commerce';
export type QuickSectionFilter = 'all' | QuickSectionTag;
export type EditorPageKey = 'profile' | 'poster' | 'banner';
// PaletteView is already defined here
export type PaletteView = 'blocks' | 'sections' | 'guides' | 'structure';
export type EditorMode = 'edit' | 'preview' | 'theme';

export interface OeuvreOption {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    dimensions?: string;
    year?: number;
    description?: string;
    artistName?: string;
    artistHasStripe?: boolean;
    artistEnableCommerce?: boolean;
    categoryId?: string | null;
}

export type QuickSectionBuilderContext = {
    make: <T extends Block>(type: BlockType) => T;
    artistData: ArtistData;
    safeBio: string;
    theme: ThemeConfig;
    themeTokens: ThemeTokens;
    getLoremImages: (count: number, seed: number) => { src: string; alt: string }[];
    pickUpload: (seed: number) => string | undefined;
    oeuvreOptions: OeuvreOption[];
    escapeHtml: (value: string) => string;
    getHeroBg: (presetKey: string) => string | undefined;
};

export interface QuickSectionSection {
    key: string;
    label: string;
    description: string;
    accentColor: string;
    tone?: 'light' | 'dark';
    tips?: string[];
    tags?: QuickSectionTag[];
    thumbnail?: string;
    // New Fields for V2
    mood?: 'minimal' | 'editorial' | 'dark' | 'vibrant' | 'soft' | 'classic';
    category?: 'header' | 'gallery' | 'text' | 'contact' | 'footer' | 'promotion' | 'navigation';
    build: (ctx: QuickSectionBuilderContext) => Block[];
}

export interface QuickSectionFamily {
    key: string;
    label: string;
    description: string;
    accentColor: string;
    sections: QuickSectionSection[];
}

export interface PublishWarning {
    id: string;
    message: string;
    description: string;
    actionLabel?: string;
    action?: () => void;
}

export type DragMeta =
    | { type: 'root'; index: number }
    | { type: 'container-child'; parentIndex: number; childIndex: number };

export interface EditorMeta {
    title: string;
    description: string;
    canonicalUrl: string;
}

export interface ArtistData {
    id: string;
    slug?: string | null;
    name: string;
    photoUrl?: string;
    biography?: string;
    artworks?: { id: string; title?: string | null; imageUrl?: string | null }[];
}

export interface EditorProps {
    initialContent: any;
    /** Options détaillées d'œuvres pour le bloc 'oeuvre' */
    oeuvreOptions?: OeuvreOption[];
    /** Données de l'artiste pour les blocs dynamiques */
    artistData: ArtistData;
    /** URL publique du profil pour l'aperçu */
    previewUrl?: string;
    /** Statut initial de publication (draft/published) */
    initialPublicationStatus?: 'draft' | 'published';
    /** Clé de page (profile/poster/banner) pour l'API multi-pages */
    pageKey?: string;
    /** Artiste connecté à Stripe (pour activer la vente en ligne) */
    artistHasStripe?: boolean;
    artistEnableCommerce?: boolean;
    bannerInsights?: any;
    pageNavigation?: { key: string; label: string; href: string }[];
    lastPublishedAt?: string | null;
    artworkCategories?: CategoryOption[];
    initialArtworkModalOpen?: boolean;
}

export const QUICK_SECTION_TAG_LABELS: Record<QuickSectionTag, string> = {
    hero: 'Héros',
    story: 'Storytelling',
    gallery: 'Galeries',
    interaction: 'Engagement',
    commerce: 'Commerce',
};

export const QUICK_SECTION_FILTERS: { value: QuickSectionFilter; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'hero', label: QUICK_SECTION_TAG_LABELS.hero },
    { value: 'story', label: QUICK_SECTION_TAG_LABELS.story },
    { value: 'gallery', label: QUICK_SECTION_TAG_LABELS.gallery },
    { value: 'interaction', label: QUICK_SECTION_TAG_LABELS.interaction },
    { value: 'commerce', label: QUICK_SECTION_TAG_LABELS.commerce },
];
