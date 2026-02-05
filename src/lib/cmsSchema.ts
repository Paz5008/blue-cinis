import { z } from 'zod';
import { STYLE_FIELD_SCHEMAS } from './cms/style';

const StyleSchema = z
    .object(STYLE_FIELD_SCHEMAS)
    .partial()
    // .strict() // Removed strict validation to allow legacy/custom styles
    .optional();

const BaseBlockSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    style: StyleSchema,
    showOnDesktop: z.boolean().optional(),
    showOnMobile: z.boolean().optional(),
    showOnSm: z.boolean().optional(),
    showOnMd: z.boolean().optional(),
    showOnLg: z.boolean().optional(),
    showOnXl: z.boolean().optional(),
    // Antigravity Geometry
    geometry: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.union([z.number(), z.string()]).optional(),
        rotation: z.number().optional(),
    }).optional(),
});

const TextBlockSchema = BaseBlockSchema.extend({
    type: z.literal('text'),
    content: z.string().default(''),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    fontWeight: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    fontFamily: z.string().optional(),
}).passthrough();

const ImageBlockSchema = BaseBlockSchema.extend({
    type: z.literal('image'),
    src: z.string().default(''),
    caption: z.string().optional(),
    altText: z.string().optional(),
    decorative: z.boolean().optional(),
    size: z.enum(['small', 'medium', 'large', 'full']).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
}).passthrough();

const GalleryImageSchema = z.object({
    id: z.string(),
    src: z.string(),
    caption: z.string().optional(),
    altText: z.string().optional(),
    decorative: z.boolean().optional(),
});
const GalleryBlockSchema = BaseBlockSchema.extend({
    type: z.literal('gallery'),
    images: z.array(GalleryImageSchema),
    layout: z.enum(['grid', 'carousel', 'masonry']).optional(),
    columns: z.number().int().positive().optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    objectPosition: z.string().optional(),
}).passthrough();

const VideoBlockSchema = BaseBlockSchema.extend({
    type: z.literal('video'),
    src: z.string().default(''),
    caption: z.string().optional(),
    autoplay: z.boolean().optional(),
    controls: z.boolean().optional(),
    poster: z.string().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
}).passthrough();

const AllowedEmbedProviders = z.enum(['youtube', 'vimeo', 'soundcloud']);
const EmbedBlockSchema = BaseBlockSchema.extend({
    type: z.literal('embed'),
    url: z.string().url(),
    provider: AllowedEmbedProviders.optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
    allowFullscreen: z.boolean().optional(),
    aspectRatio: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
}).passthrough();

const DividerBlockSchema = BaseBlockSchema.extend({
    type: z.literal('divider'),
    borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
    color: z.string().optional(),
    thickness: z.number().int().optional(),
}).passthrough();

const QuoteBlockSchema = BaseBlockSchema.extend({
    type: z.literal('quote'),
    content: z.string().default(''),
    author: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
}).passthrough();

const ColumnBlockSchema: z.ZodType<any> = BaseBlockSchema.extend({
    type: z.literal('columns'),
    count: z.number().int().min(1),
    columns: z.array(z.array(z.any())),
}).passthrough();

const ButtonBlockSchema = BaseBlockSchema.extend({
    type: z.literal('button'),
    label: z.string(),
    url: z.string(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
}).passthrough();

const ContainerBlockSchema: z.ZodType<any> = BaseBlockSchema.extend({
    type: z.literal('container'),
    children: z.array(z.any()),
    columns: z.number().int().optional(),
    columnsMobile: z.number().int().optional(),
    columnsTablet: z.number().int().optional(),
    columnsDesktop: z.number().int().optional(),
}).passthrough();

const SpacerBlockSchema = BaseBlockSchema.extend({
    type: z.literal('spacer'),
    height: z.string().optional(),
}).passthrough();

const OeuvreBlockSchema = BaseBlockSchema.extend({
    type: z.literal('oeuvre'),
    artworks: z.array(z.string()),
}).passthrough();

const ArtworkListBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artworkList'),
    mode: z.enum(['manual', 'query']).optional(),
    selection: z.array(z.string()).optional(),
    query: z
        .object({
            search: z.string().optional(),
            categoryIds: z.array(z.string()).optional(),
            priceMin: z.number().optional(),
            priceMax: z.number().optional(),
            yearMin: z.number().optional(),
            yearMax: z.number().optional(),
        })
        .optional(),
}).passthrough();

const ArtistNameBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artistName'),
    tag: z.enum(['h1', 'h2', 'h3']).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    fontWeight: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    fontFamily: z.string().optional(),
}).passthrough();

const ArtistPhotoBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artistPhoto'),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    size: z.enum(['small', 'medium', 'large', 'full']).optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    objectPosition: z.string().optional(),
    shapePreset: z.enum(['square', 'rounded', 'soft', 'circle']).optional(),
}).passthrough();

const ArtistBioBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artistBio'),
    content: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    fontWeight: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    fontFamily: z.string().optional(),
}).passthrough();

const ContactFormBlockSchema = BaseBlockSchema.extend({
    type: z.literal('contactForm'),
}).passthrough();

const EventListItemSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    linkLabel: z.string().optional(),
    linkUrl: z.string().optional(),
    highlight: z.boolean().optional(),
});

const EventListBlockSchema = BaseBlockSchema.extend({
    type: z.literal('eventList'),
    events: z.array(EventListItemSchema).default([]),
    layout: z.enum(['timeline', 'cards', 'list']).optional(),
    accentColor: z.string().optional(),
    showPastEvents: z.boolean().optional(),
    showMode: z.enum(['manual', 'startDateAsc', 'startDateDesc']).optional(),
    showDates: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    showDescription: z.boolean().optional(),
    showLink: z.boolean().optional(),
    condensed: z.boolean().optional(),
    heading: z.string().optional(),
    emptyStateMessage: z.string().optional(),
    upcomingBadgeLabel: z.string().optional(),
}).passthrough();

const GenericBlockSchema = BaseBlockSchema.passthrough();

export const BlockSchema = z.union([
    TextBlockSchema,
    ImageBlockSchema,
    GalleryBlockSchema,
    VideoBlockSchema,
    EmbedBlockSchema,
    DividerBlockSchema,
    QuoteBlockSchema,
    ColumnBlockSchema,
    ButtonBlockSchema,
    ContainerBlockSchema,
    SpacerBlockSchema,
    OeuvreBlockSchema,
    ArtworkListBlockSchema,
    ArtistNameBlockSchema,
    ArtistPhotoBlockSchema,
    ArtistBioBlockSchema,
    ContactFormBlockSchema,
    EventListBlockSchema,
    GenericBlockSchema, // Fallback for any other block type or slight mismatch
]);

// Layout configuration for desktop/mobile independence
export const LayoutConfigSchema = z.object({
    desktop: z.array(z.string()),
    mobile: z.array(z.string()),
});

export const ThemeConfigSchema = z
    .object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        headingFont: z.string().optional(),
        bodyFont: z.string().optional(),
        stylePresetId: z.string().optional(),
        colorPresetId: z.string().optional(),
        typographyPresetId: z.string().optional(),
        spacingPresetId: z.enum(['compact', 'balanced', 'airy']).optional(),
        surfaceStyle: z.enum(['rounded', 'soft', 'sharp', 'pill']).optional(),
        tone: z.enum(['light', 'dark', 'contrast']).optional(),
        layout: z.enum(['default', 'modern', 'minimal', 'custom']).optional(),
        backgroundImageUrl: z.string().optional(),
        overlayColor: z.string().optional(),
        overlayOpacity: z.number().optional(),
        gradientFrom: z.string().optional(),
        gradientTo: z.string().optional(),
        gradientDirection: z.string().optional(),
        coverImageUrl: z.string().optional(),
    })
    .passthrough();

const CanonicalUrlSchema = z
    .string()
    .optional()
    .transform((value) => {
        if (typeof value !== 'string') return undefined;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine((value) => {
        if (!value) return true;
        if (/^https?:\/\//i.test(value)) return true;
        if (value.startsWith('/')) return true;
        if (value.startsWith('#')) return true;
        return false;
    }, { message: 'Invalid url' });

export const MetaSchema = z
    .object({
        title: z.string().max(120).optional().default(''),
        description: z.string().max(300).optional().default(''),
        canonicalUrl: CanonicalUrlSchema,
    })
    .passthrough();

export const ContentPayloadSchema = z.object({
    action: z.enum(['publish']).optional(),
    // Support both formats for migration
    blocks: z.array(BlockSchema).optional(),  // Legacy format
    blocksData: z.record(z.string(), BlockSchema).optional(),  // New format
    layout: LayoutConfigSchema.optional(),  // New format
    theme: ThemeConfigSchema.optional().default({}),
    meta: MetaSchema.optional().default({ title: '', description: '' }),
    settings: z.any().optional(),
}).refine(data => {
    // Ensure at least one format is provided
    const hasLegacy = Array.isArray(data.blocks) && data.blocks.length >= 0;
    const hasNew = data.blocksData && data.layout;
    return hasLegacy || hasNew;
}, { message: "Either blocks (legacy) or blocksData+layout (new) must be provided" }).superRefine((data, ctx) => {
    // const MAX_STRING_LENGTH = 500000; // 500 characters limit for standard fields, but base64 can be larger? No, strict limit.
    // Actually images as dataURL should be avoided if possible, but if allowed, 500KB is small for an image. 
    // But prompt says "massive". 5MB is massive. 
    // Let's set 2MB limit.
    const LIMIT = 2 * 1024 * 1024;

    const validate = (value: unknown, path: (string | number)[]) => {
        if (value === null || value === undefined) return;

        if (typeof value === 'string') {
            if (value.length > LIMIT) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `La valeur est trop volumineuse (max ${LIMIT / 1024 / 1024}MB).`,
                    path,
                });
            }
            if (/javascript:/i.test(value)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Les URLs "javascript:" sont interdites.',
                    path,
                });
            }
            if (/data:text\/html/i.test(value)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Le contenu "data:text/html" est interdit.',
                    path,
                });
            }
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => validate(item, [...path, index]));
        } else if (typeof value === 'object') {
            for (const [key, val] of Object.entries(value)) {
                if (/^on[a-z]+/.test(key.toLowerCase())) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `L'attribut "${key}" est interdit.`,
                        path: [...path, key],
                    });
                }
                validate(val, [...path, key]);
            }
        }
    };

    validate(data.blocks, ['blocks']);
    validate(data.theme, ['theme']);
});

export type ContentPayload = z.infer<typeof ContentPayloadSchema>;
