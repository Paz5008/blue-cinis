import { z } from 'zod';

const baseStyleSchema = z.object({
    padding: z.string().optional(),
    margin: z.string().optional(),
    backgroundColor: z.string().optional(),
    backgroundImage: z.string().optional(),
    color: z.string().optional(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    fontSize: z.string().optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.string().optional(),
    border: z.string().optional(),
    borderRadius: z.string().optional(),
    boxShadow: z.string().optional(),
    opacity: z.number().optional(),
    display: z.string().optional(),
    flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
    justifyContent: z.enum(['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']).optional(),
    alignItems: z.enum(['flex-start', 'center', 'flex-end', 'stretch', 'baseline']).optional(),
    gap: z.string().optional(),
    gridTemplateColumns: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    minHeight: z.string().optional(),
    backdropFilter: z.string().optional(),
    mixBlendMode: z.string().optional(),
    animation: z.string().optional(),
    transform: z.string().optional(),
    filter: z.string().optional(),
    zIndex: z.number().optional(),
}).passthrough().optional();

const baseBlockSchema = z.object({
    id: z.string(),
    style: baseStyleSchema,
});

export const textBlockSchema = baseBlockSchema.extend({
    type: z.literal('text'),
    content: z.string(),
});

export const imageBlockSchema = baseBlockSchema.extend({
    type: z.literal('image'),
    url: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
});

export const embedBlockSchema = baseBlockSchema.extend({
    type: z.literal('embed'),
    url: z.string(),
    platform: z.enum(['youtube', 'vimeo', 'instagram', 'twitter', 'tiktok', 'spotify', 'soundcloud']).optional(),
});

export const buttonBlockSchema = baseBlockSchema.extend({
    type: z.literal('button'),
    text: z.string(),
    url: z.string().optional(),
    action: z.enum(['link', 'email', 'phone', 'scroll']).optional(),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'link']).optional(),
});

export const galleryImageSchema = z.object({
    id: z.string(),
    url: z.string(),
    alt: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    link: z.string().optional(),
    price: z.number().optional(),
});

export const galleryBlockSchema = baseBlockSchema.extend({
    type: z.literal('gallery'),
    images: z.array(galleryImageSchema),
    layout: z.enum(['grid', 'masonry', 'carousel', 'slideshow']).optional(),
    columnCount: z.number().optional(),
    gap: z.string().optional(),
    aspectRatio: z.string().optional(),
});

export const columnsBlockSchema = baseBlockSchema.extend({
    type: z.literal('columns'),
    columns: z.array(baseBlockSchema.passthrough().array()), // Recursive array of blocks for each column
    gap: z.string().optional(),
    alignItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
});

export const containerBlockSchema = baseBlockSchema.extend({
    type: z.literal('container'),
    children: z.array(baseBlockSchema.passthrough()),
    layout: z.enum(['flex', 'grid']).optional(),
});

export const spacerBlockSchema = baseBlockSchema.extend({
    type: z.literal('spacer'),
    height: z.string().optional(),
}).passthrough();

export const dividerBlockSchema = baseBlockSchema.extend({
    type: z.literal('divider'),
    color: z.string().optional(),
    thickness: z.union([z.string(), z.number()]).optional(),
    borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
}).passthrough();

export const bookBlockSchema = baseBlockSchema.extend({
    type: z.literal('book'),
    items: z.array(z.object({
        id: z.string(),
        url: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
    })).optional().default([]),
    bookStyle: z.enum(['slider', 'coverflow', 'cards', 'fade']).optional(),
}).passthrough();

// --- Blocs IA (générés par OpenClawd) ---
export const artistNameBlockSchema = baseBlockSchema.extend({
    type: z.literal('artistName'),
    tag: z.enum(['h1', 'h2', 'h3']).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    fontWeight: z.string().optional(),
    fontFamily: z.string().optional(),
    letterSpacing: z.string().optional(),
    lineHeight: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
}).passthrough();

export const artistPhotoBlockSchema = baseBlockSchema.extend({
    type: z.literal('artistPhoto'),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    size: z.enum(['small', 'medium', 'large', 'full']).optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    shapePreset: z.enum(['square', 'rounded', 'soft', 'circle']).optional(),
}).passthrough();

export const artistBioBlockSchema = baseBlockSchema.extend({
    type: z.literal('artistBio'),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    fontWeight: z.string().optional(),
    fontFamily: z.string().optional(),
}).passthrough();

export const oeuvreBlockSchema = baseBlockSchema.extend({
    type: z.literal('oeuvre'),
    artworks: z.array(z.string()).optional().default([]),
    layout: z.enum(['grid', 'carousel']).optional(),
    columns: z.number().optional(),
    limit: z.number().optional(),
    showTitle: z.boolean().optional(),
    showPrice: z.boolean().optional(),
    showYear: z.boolean().optional(),
    cardStyle: z.string().optional(),
}).passthrough();

export const blockSchema = z.discriminatedUnion('type', [
    textBlockSchema,
    imageBlockSchema,
    embedBlockSchema,
    buttonBlockSchema,
    galleryBlockSchema,
    columnsBlockSchema,
    containerBlockSchema,
    spacerBlockSchema,
    dividerBlockSchema,
    bookBlockSchema,
    // Blocs IA OpenClawd
    artistNameBlockSchema,
    artistPhotoBlockSchema,
    artistBioBlockSchema,
    oeuvreBlockSchema,
]);

export const blockProtocolSchema = z.array(blockSchema);

export type BlockData = z.infer<typeof blockSchema>;
export type BlockProtocol = z.infer<typeof blockProtocolSchema>;
