/**
 * Runtime validation for CMS blocks using Zod.
 * Ensures data integrity at runtime before persisting/rendering.
 *
 * - `getSchemaForType`: Returns the Zod schema for a specific block type
 * @module lib/cms/blockValidation
 */
import { z } from 'zod';
import type { Block, BlockType } from '@/types/cms';
import { cmsLogger } from '@/lib/logger';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Zod schema for BlockStyle (permissive - allows any string/number values)
 */
const BlockStyleSchema = z.record(
    z.union([z.string(), z.number(), z.boolean(), z.undefined(), z.record(z.unknown())])
).optional();

/**
 * Base block schema shared by all block types
 */
const BaseBlockSchema = z.object({
    id: z.string().min(1, 'Block ID is required'),
    type: z.string(),
    style: BlockStyleSchema,
    x: z.number().min(0).max(200).optional(),
    y: z.number().min(-1000).optional(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
    rotation: z.number().min(-360).max(360).optional(),
    zIndex: z.number().optional(),
    noise: z.boolean().optional(),
    showOnDesktop: z.boolean().optional(),
    showOnMobile: z.boolean().optional(),
});

// ============================================================================
// Type-Specific Schemas
// ============================================================================

const TextBlockSchema = BaseBlockSchema.extend({
    type: z.literal('text'),
    content: z.string(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    fontSize: z.string().optional(),
    color: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    fontWeight: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    fontFamily: z.string().optional(),
});

const ImageBlockSchema = BaseBlockSchema.extend({
    type: z.literal('image'),
    src: z.string(),
    caption: z.string().optional(),
    altText: z.string().optional(),
    decorative: z.boolean().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    keepAspect: z.boolean().optional(),
    aspectRatio: z.number().optional(),
});

const GalleryImageSchema = z.object({
    id: z.string(),
    src: z.string(),
    caption: z.string().optional(),
    altText: z.string().optional(),
    decorative: z.boolean().optional(),
});

const GalleryBlockSchema = BaseBlockSchema.extend({
    type: z.literal('gallery'),
    images: z.array(GalleryImageSchema).default([]),
    layout: z.enum(['grid', 'carousel', 'masonry']).optional(),
    columns: z.number().min(1).max(12).optional(),
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    objectPosition: z.string().optional(),
});

const VideoBlockSchema = BaseBlockSchema.extend({
    type: z.literal('video'),
    src: z.string(),
    caption: z.string().optional(),
    autoplay: z.boolean().optional(),
    controls: z.boolean().optional(),
    poster: z.string().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
});

const EmbedBlockSchema = BaseBlockSchema.extend({
    type: z.literal('embed'),
    url: z.string(),
    provider: z.enum(['youtube', 'vimeo', 'soundcloud']).optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
    allowFullscreen: z.boolean().optional(),
    aspectRatio: z.string().optional(),
    thumbnailUrl: z.string().optional(),
});

const DividerBlockSchema = BaseBlockSchema.extend({
    type: z.literal('divider'),
    borderStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
    color: z.string().optional(),
    thickness: z.number().optional(),
});

// Recursive schema for blocks inside columns
const LazyBlockSchema: z.ZodTypeAny = z.lazy(() => BlockSchema);

const ColumnBlockSchema = BaseBlockSchema.extend({
    type: z.literal('columns'),
    count: z.number().min(1).max(6).default(2),
    columns: z.array(z.array(LazyBlockSchema)).default([]),
    gap: z.string().optional(),
    alignItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    minHeight: z.string().optional(),
});

const ButtonBlockSchema = BaseBlockSchema.extend({
    type: z.literal('button'),
    label: z.string(),
    url: z.string().default(''),
    variant: z.enum(['solid', 'outline', 'ghost', 'link']).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
});

const OeuvreBlockSchema = BaseBlockSchema.extend({
    type: z.literal('oeuvre'),
    artworks: z.array(z.string()).default([]),
    columns: z.number().optional(),
    showTitle: z.boolean().optional(),
    showYear: z.boolean().optional(),
    showPrice: z.boolean().optional(),
    showDimensions: z.boolean().optional(),
    clickAction: z.enum(['detail', 'modal', 'none']).optional(),
});

const ArtworkListBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artworkList'),
    layout: z.enum(['grid', 'carousel', 'list', 'mosaic']).optional(),
    columnsDesktop: z.number().optional(),
    columnsMobile: z.number().optional(),
    gap: z.number().optional(),
    limit: z.number().optional(),
    source: z.enum(['all', 'featured', 'category']).optional(),
    categoryId: z.string().optional(),
    showTitle: z.boolean().optional(),
    showPrice: z.boolean().optional(),
});

const ArtistNameBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artistName'),
    tag: z.enum(['h1', 'h2', 'h3', 'p', 'span']).optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
});

const ArtistPhotoBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artistPhoto'),
    shape: z.enum(['square', 'circle', 'rounded']).optional(),
    size: z.enum(['small', 'medium', 'large', 'custom']).optional(),
});

const ArtistBioBlockSchema = BaseBlockSchema.extend({
    type: z.literal('artistBio'),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    maxLines: z.number().optional(),
});

const ContactFormBlockSchema = BaseBlockSchema.extend({
    type: z.literal('contactForm'),
    variant: z.enum(['default', 'minimal', 'boxed', 'floating']).optional(),
    submitLabel: z.string().optional(),
    showSubject: z.boolean().optional(),
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

const EventListBlockSchema = BaseBlockSchema.extend({
    type: z.literal('eventList'),
    events: z.array(EventListItemSchema).default([]),
    layout: z.enum(['list', 'grid', 'timeline']).optional(),
    showLocation: z.boolean().optional(),
    maxItems: z.number().optional(),
});

const BookBlockSchema = BaseBlockSchema.extend({
    type: z.literal('book'),
    items: z.array(z.object({
        id: z.string(),
        url: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
    })).default([]),
    bookStyle: z.enum(['slider', 'coverflow', 'cards', 'fade']).optional(),
});

// ============================================================================
// Union Schema (Discriminated Union)
// ============================================================================

/**
 * Complete Block schema using discriminated union on 'type' field
 */
export const BlockSchema = z.discriminatedUnion('type', [
    TextBlockSchema,
    ImageBlockSchema,
    GalleryBlockSchema,
    VideoBlockSchema,
    EmbedBlockSchema,
    DividerBlockSchema,
    ColumnBlockSchema,
    ButtonBlockSchema,
    OeuvreBlockSchema,
    ArtworkListBlockSchema,
    ArtistNameBlockSchema,
    ArtistPhotoBlockSchema,
    ArtistBioBlockSchema,
    ContactFormBlockSchema,
    EventListBlockSchema,
    BookBlockSchema,
]);

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
    success: boolean;
    data?: Block;
    errors?: z.ZodError['errors'];
}

/**
 * Validates a single block against the schema.
 * Returns typed Block if valid, null with console warning if invalid.
 *
 * @param block - Unknown data to validate as Block
 * @returns Validated Block or null
 *
 * @example
 * ```typescript
 * const block = validateBlock(rawData);
 * if (block) {
 *   // block is now typed as Block
 * }
 * ```
 */
export function validateBlock(block: unknown): Block | null {
    const result = BlockSchema.safeParse(block);
    if (result.success) {
        return result.data as Block;
    }
    cmsLogger.warn({ errors: result.error.errors }, 'Block validation failed');
    return null;
}

/**
 * Validates a block and returns detailed result with errors.
 *
 * @param block - Unknown data to validate
 * @returns ValidationResult with success status and errors if any
 */
export function validateBlockWithDetails(block: unknown): ValidationResult {
    const result = BlockSchema.safeParse(block);
    if (result.success) {
        return { success: true, data: result.data as Block };
    }
    return { success: false, errors: result.error.errors };
}

/**
 * Validates an array of blocks, filtering out invalid ones.
 * Logs warnings for invalid blocks but continues processing.
 *
 * @param blocks - Array of unknown data to validate
 * @returns Array of valid Blocks (invalid blocks are filtered out)
 *
 * @example
 * ```typescript
 * const validBlocks = validateBlocks(rawBlocks);
 * // validBlocks contains only blocks that passed validation
 * ```
 */
export function validateBlocks(blocks: unknown[]): Block[] {
    if (!Array.isArray(blocks)) {
        cmsLogger.warn({ receivedType: typeof blocks }, 'validateBlocks expected array');
        return [];
    }
    return blocks
        .map((block, index) => {
            const result = validateBlock(block);
            if (!result) {
                cmsLogger.warn({ blockIndex: index }, 'Block at index is invalid');
            }
            return result;
        })
        .filter((b): b is Block => b !== null);
}

/**
 * Checks if a block type is a valid BlockType.
 *
 * @param type - String to check
 * @returns True if type is a valid BlockType
 */
export function isValidBlockType(type: string): type is BlockType {
    const validTypes: BlockType[] = [
        'text', 'image', 'gallery', 'video', 'embed', 'divider',
        'columns', 'button', 'oeuvre', 'artworkList',
        'artistName', 'artistPhoto', 'artistBio', 'contactForm', 'eventList',
    ];
    return validTypes.includes(type as BlockType);
}

/**
 * Returns the specific schema for a block type.
 * Useful for validating partial updates.
 *
 * @param type - BlockType to get schema for
 * @returns Zod schema for the type or null if not found
 */
export function getSchemaForType(type: BlockType): z.ZodTypeAny | null {
    const schemaMap: Record<BlockType, z.ZodTypeAny> = {
        text: TextBlockSchema,
        image: ImageBlockSchema,
        gallery: GalleryBlockSchema,
        video: VideoBlockSchema,
        embed: EmbedBlockSchema,
        divider: DividerBlockSchema,
        columns: ColumnBlockSchema,
        button: ButtonBlockSchema,
        oeuvre: OeuvreBlockSchema,
        artworkList: ArtworkListBlockSchema,
        artistName: ArtistNameBlockSchema,
        artistPhoto: ArtistPhotoBlockSchema,
        artistBio: ArtistBioBlockSchema,
        contactForm: ContactFormBlockSchema,
        eventList: EventListBlockSchema,
        book: BookBlockSchema,
    };
    return schemaMap[type] || null;
}
