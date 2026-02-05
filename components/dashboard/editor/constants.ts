import {
    Text as TextIcon,
    Image as ImageIcon,
    LayoutGrid as LayoutGridIcon,
    Video as VideoIcon,
    Share2 as EmbedIcon,
    Divide as DivideIcon,
    Columns as ColumnsIcon,
    User as UserIcon,
    CalendarDays as CalendarIcon,
    Mail as MailIcon,
    GalleryVertical as GalleryIcon,
    Palette as PaletteIcon,
    Type as TypeIcon,
    Square as ButtonIcon,
} from 'lucide-react';
import { BlockType } from '@/types/cms';
import { QuickSectionTag } from './types';

export const BANNER_ELEMENT_OPTIONS: ReadonlyArray<{ type: BlockType; label: string; description: string }> = [
    { type: 'text', label: 'Texte', description: 'Racontez votre message en 55 mots ou moins.' },
    { type: 'image', label: 'Visuel', description: 'Ajoutez une oeuvre ou une texture pour ancrer le ton.' },
    { type: 'button', label: 'Bouton', description: 'Dirigez les visiteurs vers votre action principale.' },
    { type: 'columns', label: 'Colonnes', description: 'Disposition en 2-4 colonnes.' },
];

export const iconMap: Record<string, any> = {
    text: TextIcon,
    image: ImageIcon,
    gallery: GalleryIcon,
    video: VideoIcon,
    embed: EmbedIcon,
    divider: DivideIcon,
    button: ButtonIcon,
    columns: ColumnsIcon,
    oeuvre: PaletteIcon,
    artworkList: LayoutGridIcon,
    artistName: TypeIcon,
    artistPhoto: UserIcon,
    artistBio: TextIcon,
    contactForm: MailIcon,
    eventList: CalendarIcon,
};

export const QUICK_SECTION_TAG_MAP: Record<string, QuickSectionTag[]> = {
    heroSpotlight: ['hero'],
    storyTimeline: ['story'],
    pressQuote: ['story'],
    ctaBand: ['interaction', 'commerce'],
    newsletterInvite: ['interaction'],
    editorialGlowHero: ['hero'],
    editorialGlowNarrative: ['story'],
    editorialGlowGallery: ['gallery'],
    nocturneHero: ['hero'],
    nocturneShowcase: ['gallery', 'commerce'],
    nocturneContact: ['interaction'],
    atelierHero: ['hero'],
    atelierProcess: ['story'],
    atelierCatalogue: ['gallery', 'commerce'],
    atelierMoodboard: ['gallery'],
    chromaticHero: ['hero'],
    chromaticHighlights: ['story', 'interaction'],
    chromaticCallToAction: ['interaction', 'commerce'],
    whiteCubeHero: ['hero'],
    whiteCubeGallery: ['gallery'],
    whiteCubeDetails: ['story', 'interaction'],
    posterSpotlight: ['hero', 'interaction'],
    posterHighlights: ['gallery', 'story'],
    posterEditorial: ['hero', 'story'],
    posterCollector: ['story', 'interaction'],
    bannerHeroCentered: ['hero'],
    bannerHeroSplit: ['hero'],
    bannerHeroMinimal: ['hero'],
    bannerKeywords: ['story'],
    bannerMoodStrip: ['gallery'],
    bannerManifesto: ['story'],
    bannerCTACompact: ['interaction'],
    bannerNewsletterInvite: ['interaction'],
};

export const BLOCK_DESCRIPTIONS: Partial<Record<BlockType, string>> = {
    text: 'Texte riche HTML',
    image: 'Image avec legende et alt text',
    gallery: 'Galerie images',
    video: 'Video avec poster et controles',
    divider: 'Separateur visuel',
    button: 'Bouton avec lien',
    columns: 'Disposition en colonnes (2-4)',
    oeuvre: 'Selection oeuvres de votre portfolio',
    artworkList: 'Liste oeuvres (manuel ou requete dynamique)',
    artistName: 'Nom artiste (dynamique)',
    artistPhoto: 'Photo artiste (dynamique)',
    artistBio: 'Biographie (dynamique)',
    contactForm: 'Formulaire de contact',
    eventList: 'Programme, expositions et dates cles',
};

// DnD-kit prefixes
export const CONTAINER_COLUMN_DROPPABLE_PREFIX = 'container-column:';

// Design dimensions
export const DESIGN_DIMENSIONS = {
    mobilePreviewWidth: 375,
    poster: {
        width: 800,
        height: 1130,
        heightMobile: 600,
    },
    desktop: {
        maxWidth: 1200,
    },
} as const;
