import { z } from 'zod';
import type { Block } from '@/types/cms';

// -----------------------------------------------------------------------------
// Shared Schemas
// -----------------------------------------------------------------------------

const responsiveDimensionSchema = z.object({
    desktop: z.string().optional(),
    mobile: z.string().optional(),
});

const blockStyleSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), responsiveDimensionSchema, z.undefined()])
).optional();

const baseBlockSchema = z.object({
    id: z.string().min(1),
    type: z.string(), // refined in discriminated union
    style: blockStyleSchema,
    showOnDesktop: z.boolean().optional(),
    showOnMobile: z.boolean().optional(),
    showOnSm: z.boolean().optional(),
    showOnMd: z.boolean().optional(),
    showOnLg: z.boolean().optional(),
    showOnXl: z.boolean().optional(),
    // Legacy / Antigravity Props
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
    rotation: z.number().optional(),
    zIndex: z.number().optional(),
    noise: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Primitive Block Schemas
// -----------------------------------------------------------------------------

export const TextBlockSchema = baseBlockSchema.extend({
    type: z.literal('text'),
    content: z.string().default(''),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
});

export const ImageBlockSchema = baseBlockSchema.extend({
    type: z.literal('image'),
    src: z.string().default(''),
    caption: z.string().optional(),
    altText: z.string().optional(),
    decorative: z.boolean().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    keepAspect: z.boolean().optional(),
    aspectRatio: z.number().optional(),
});

const GalleryImageSchema = z.object({
    id: z.string(),
    src: z.string().default(''),
    caption: z.string().optional(),
    altText: z.string().optional(),
    decorative: z.boolean().optional(),
});

export const GalleryBlockSchema = baseBlockSchema.extend({
    type: z.literal('gallery'),
    images: z.array(GalleryImageSchema).default([]),
    layout: z.enum(['grid', 'carousel', 'masonry']).optional(),
    columns: z.number().min(1).max(12).optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    objectPosition: z.string().optional(),
});

export const VideoBlockSchema = baseBlockSchema.extend({
    type: z.literal('video'),
    src: z.string().default(''),
    caption: z.string().optional(),
    autoplay: z.boolean().optional(),
    controls: z.boolean().optional(),
    poster: z.string().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
});

export const EmbedBlockSchema = baseBlockSchema.extend({
    type: z.literal('embed'),
    url: z.string().default(''),
    provider: z.enum(['youtube', 'vimeo', 'soundcloud']).optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
    allowFullscreen: z.boolean().optional(),
    aspectRatio: z.string().optional(),
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
    thumbnailUrl: z.string().optional(),
});

export const DividerBlockSchema = baseBlockSchema.extend({
    type: z.literal('divider'),
    borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
    color: z.string().optional(),
    thickness: z.number().optional(),
});

export const ButtonBlockSchema = baseBlockSchema.extend({
    type: z.literal('button'),
    label: z.string().default(''),
    url: z.string().default(''),
    alignment: z.enum(['left', 'center', 'right']).optional(),
});

export const ContactFormBlockSchema = baseBlockSchema.extend({
    type: z.literal('contactForm'),
});

export const ArtistNameBlockSchema = baseBlockSchema.extend({
    type: z.literal('artistName'),
    tag: z.enum(['h1', 'h2', 'h3']).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
});

export const ArtistPhotoBlockSchema = baseBlockSchema.extend({
    type: z.literal('artistPhoto'),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    size: z.enum(['small', 'medium', 'large', 'full']).optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    objectPosition: z.string().optional(),
    shapePreset: z.enum(['square', 'rounded', 'soft', 'circle']).optional(),
    src: z.string().optional(),
});

export const ArtistBioBlockSchema = baseBlockSchema.extend({
    type: z.literal('artistBio'),
    content: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
});

export const OeuvreBlockSchema = baseBlockSchema.extend({
    type: z.literal('oeuvre'),
    artworks: z.array(z.string()).default([]),
    limit: z.number().optional(),
    layout: z.enum(['grid', 'carousel']).optional(),
    columns: z.number().optional(),
    gap: z.number().optional(),
    showTitle: z.boolean().optional(),
    showArtist: z.boolean().optional(),
    showPrice: z.boolean().optional(),
    showYear: z.boolean().optional(),
    titleFontSize: z.string().optional(),
    titleColor: z.string().optional(),
    cardBackgroundColor: z.string().optional(),
    cardTextColor: z.string().optional(),
    cardPadding: z.string().optional(),
});

export const ArtworkListBlockSchema = baseBlockSchema.extend({
    type: z.literal('artworkList'),
    mode: z.enum(['manual', 'query']).optional(),
    selection: z.array(z.string()).optional(),
    query: z.object({
        search: z.string().optional(),
        categoryIds: z.array(z.string()).optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        yearMin: z.number().optional(),
        yearMax: z.number().optional(),
        status: z.enum(['available', 'sold', 'all']).optional(),
    }).optional(),
    layout: z.enum(['grid', 'carousel']).optional(),
    columnsDesktop: z.number().optional(),
    columnsMobile: z.number().optional(),
    gap: z.number().optional(),
    limit: z.number().optional(),
    showTitle: z.boolean().optional(),
    showPrice: z.boolean().optional(),
});

const EventListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    linkLabel: z.string().optional(),
    linkUrl: z.string().optional(),
    highlight: z.boolean().optional(),
});

export const EventListBlockSchema = baseBlockSchema.extend({
    type: z.literal('eventList'),
    events: z.array(EventListItemSchema).default([]),
    layout: z.enum(['timeline', 'cards', 'list']).optional(),
    showPastEvents: z.boolean().optional(),
    heading: z.string().optional(),
    emptyStateMessage: z.string().optional(),
    upcomingBadgeLabel: z.string().optional(),
    accentColor: z.string().optional(),
    sortMode: z.enum(['manual', 'startDateAsc', 'startDateDesc']).optional(),
    showDates: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    showDescription: z.boolean().optional(),
    showLink: z.boolean().optional(),
    condensed: z.boolean().optional(),
});

// -----------------------------------------------------------------------------
// Recursive / Container Schemas
// -----------------------------------------------------------------------------

// Use z.lazy for recursive ColumnBlock schema
export const ColumnBlockSchema: z.ZodTypeAny = baseBlockSchema.extend({
    type: z.literal('columns'),
    count: z.number().default(2),
    columns: z.array(z.array(z.lazy(() => BlockSchema))).default([]),
    gap: z.string().optional(),
    alignItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    minHeight: z.string().optional(),
});

export const BlockSchema: z.ZodType<Block, z.ZodTypeDef, any> = z.lazy(() => z.union([
    TextBlockSchema,
    ImageBlockSchema,
    GalleryBlockSchema,
    VideoBlockSchema,
    EmbedBlockSchema,
    DividerBlockSchema,
    ButtonBlockSchema,
    ContactFormBlockSchema,
    ArtistNameBlockSchema,
    ArtistPhotoBlockSchema,
    ArtistBioBlockSchema,
    OeuvreBlockSchema,
    ArtworkListBlockSchema,
    EventListBlockSchema,
    ColumnBlockSchema
]));

// -----------------------------------------------------------------------------
// Validator
// -----------------------------------------------------------------------------

/**
 * Validates a block object against the strict schemas.
 * Strps unknown keys by default (Zod behavior).
 */
export function validateBlock(data: unknown): { success: true; data: Block } | { success: false; error: z.ZodError } {
    const result = BlockSchema.safeParse(data);
    return result;
}

/**
 * Validates a block and throws if invalid. Returns typed data.
 */
export function validateBlockOrThrow(data: unknown): Block {
    return BlockSchema.parse(data);
}
