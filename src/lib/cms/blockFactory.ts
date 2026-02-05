import {
    Block,
    BlockType,
} from '@/types/cms';

// Helper type to define Block data without the ID
type BlockDraft<T extends Block> = Omit<T, 'id'>;

// Complete map of default values for every block type
const BLOCK_DEFAULTS: { [K in BlockType]: BlockDraft<Extract<Block, { type: K }>> } = {
    text: {
        type: 'text',
        content: 'Nouveau texte',
        alignment: 'left',
        fontSize: '16px',
        color: '#000000',
        style: { width: '350px' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    image: {
        type: 'image',
        src: '',
        caption: '',
        altText: '',
        alignment: 'center',
        style: { width: '350px' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    gallery: {
        type: 'gallery',
        images: [],
        layout: 'grid',
        columns: 3,
        style: { width: '350px' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    video: {
        type: 'video',
        src: '',
        caption: '',
        autoplay: false,
        controls: true,
        style: { width: '350px' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    embed: {
        type: 'embed',
        url: '',
        width: '350px',
        height: '300px',
        aspectRatio: '16:9',
        style: { width: '350px' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    divider: {
        type: 'divider',
        borderStyle: 'solid',
        color: '#e5e7eb',
        thickness: 1,
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    columns: {
        type: 'columns',
        count: 2,
        columns: [[], []],
        gap: '16px',
        alignItems: 'stretch',
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    button: {
        type: 'button',
        label: 'En savoir plus',
        url: '#',
        alignment: 'center',
        style: { width: 'auto' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    oeuvre: {
        type: 'oeuvre',
        artworks: [],
        layout: 'grid',
        columns: 3,
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    artworkList: {
        type: 'artworkList',
        mode: 'query',
        query: { status: 'available' },
        layout: 'grid',
        columnsMobile: 2,
        columnsDesktop: 3,
        gap: 16,
        limit: 12,
        showTitle: true,
        showArtist: true,
        showPrice: true,
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    artistName: {
        type: 'artistName',
        tag: 'h1',
        alignment: 'center',
        fontSize: '2.5rem',
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    artistPhoto: {
        type: 'artistPhoto',
        size: 'medium',
        alignment: 'center',
        objectFit: 'cover',
        shapePreset: 'circle',
        style: { width: '180px', height: '180px', overflow: 'hidden' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    artistBio: {
        type: 'artistBio',
        alignment: 'center',
        fontSize: '1rem',
        lineHeight: '1.6',
        style: { maxWidth: '600px' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    contactForm: {
        type: 'contactForm',
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
    eventList: {
        type: 'eventList',
        events: [],
        layout: 'list',
        showPastEvents: false,
        showLocation: true,
        showDescription: true,
        style: { width: '100%' },
        showOnDesktop: true,
        showOnMobile: true,
    },
};

/**
 * Creates a new block instance with a unique ID and default values.
 * Uses discriminated unions to ensure type safety without 'as any'.
 */
export function createBlockInstance<T extends BlockType>(type: T, isBanner = false): Extract<Block, { type: T }> {
    // Retrieve defaults using type indexing
    const defaults = BLOCK_DEFAULTS[type];
    if (!defaults) {
        // Should never happen if T extends BlockType and BLOCK_DEFAULTS has all keys
        throw new Error(`Block factory error: No defaults defined for type '${type}'`);
    }

    // Deep clone to safely detach from the defaults object
    // Using JSON.parse(JSON.stringify) is safe here as Blocks are JSON-serializable
    const clone = JSON.parse(JSON.stringify(defaults));

    // Construct the final block with a new ID
    // We cast the result of spreading to the specific Block type.
    // This cast is safe because `defaults` is derived from the map which matches the type T
    const block = {
        ...clone,
        id: crypto.randomUUID(),
    } as Extract<Block, { type: T }>;

    // Apply conditional overrides for Banner usage in a type-safe way
    if (isBanner) {
        applyBannerOverrides(block);
    }

    return block;
}

/**
 * Applies banner-specific style overrides to a block.
 * Uses type guards to safely modify properties based on block type.
 */
function applyBannerOverrides(block: Block): void {
    switch (block.type) {
        case 'text':
            // block is automatically narrowed to TextBlock by the switch
            block.alignment = 'left';
            block.style = {
                ...(block.style || {}),
                marginTop: '0',
                marginBottom: '0.4rem',
                maxWidth: '560px',
            };
            break;
        case 'image':
            block.alignment = 'center';
            block.style = {
                ...(block.style || {}),
                borderRadius: '24px',
                objectFit: 'cover',
                width: '100%',
                maxHeight: '260px',
            };
            break;
        default:
            // No overrides for other types
            break;
    }
}

// ============================================================================
// NEW: Intelligent Placeholder & Factory (User Request)
// ============================================================================

/**
 * Generates context-aware placeholder content for blocks.
 * Used to populate templates with realistic data instead of empty strings.
 */
export function generatePlaceholder(type: BlockType): Partial<Block> {
    switch (type) {
        case 'text':
            return {
                content: `<h3>Une Nouvelle Vision</h3>
<p>L'art de la photographie réside dans la capacité à capturer l'éphémère. Chaque cliché est une fenêtre ouverte sur un instant suspendu, une émotion brute figée dans le temps.</p>
<p>Dans cette série, j'explore les jeux de lumière naturelle et les textures organiques, cherchant à révéler la beauté cachée du quotidien.</p>`
            };
        case 'image':
            // Default to a cinematic landscape ratio usually, but easily overridden
            return {
                src: 'https://placehold.co/1200x800/2A2A2A/FFF?text=Vision+Artistique',
                altText: 'Photographie artistique',
                caption: 'Capture de lumière naturelle'
            };
        case 'gallery':
            return {
                images: [
                    { id: crypto.randomUUID(), src: 'https://placehold.co/600x800/2A2A2A/FFF?text=Portrait', altText: 'Portrait' }, // Portrait
                    { id: crypto.randomUUID(), src: 'https://placehold.co/800x600/333/FFF?text=Paysage', altText: 'Paysage' }, // Landscape
                    { id: crypto.randomUUID(), src: 'https://placehold.co/600x600/444/FFF?text=Detail', altText: 'Détail' },   // Square
                    { id: crypto.randomUUID(), src: 'https://placehold.co/800x500/555/FFF?text=Atmosphere', altText: 'Ambiance' },
                    { id: crypto.randomUUID(), src: 'https://placehold.co/600x900/222/FFF?text=Vertical', altText: 'Vertical' },
                    { id: crypto.randomUUID(), src: 'https://placehold.co/700x700/3A3A3A/FFF?text=Carre', altText: 'Carré' },
                ]
            };
        case 'video':
            return {
                caption: 'Immersion dans l\'atelier (Making-of)',
            };
        case 'button':
            return {
                label: 'Voir l\'exposition complète',
                url: '/works'
            };
        case 'oeuvre':
            return {
                // Use the first 3 lorem artworks by default
                artworks: ['lorem-artwork-1', 'lorem-artwork-2', 'lorem-artwork-3'],
                showTitle: true,
                showYear: true,
                showPrice: true
            };
        default:
            return {};
    }
}

/**
 * BlockFactory: Unified interface for creating blocks.
 * Supports static creation and dynamic placeholder injection.
 */
export const BlockFactory = {
    /**
     * Creates a block of a specific type.
     * @param type The type of block to create
     * @param overrides Optional properties to override defaults
     * @param usePlaceholders If true, injects "Lorem Ipsum" style placeholders
     */
    create: <T extends BlockType>(
        type: T,
        overrides: Partial<Extract<Block, { type: T }>> = {},
        usePlaceholders = false
    ): Extract<Block, { type: T }> => {
        // 1. Create base block with defaults and ID
        const block = createBlockInstance(type);

        // 2. (Optional) Inject rich placeholders
        if (usePlaceholders) {
            const placeholders = generatePlaceholder(type);
            Object.assign(block, placeholders);
        }

        // 3. Apply manual overrides (highest priority)
        // We do a deep merge for 'style' to avoid wiping out default styles if overrides.style is partial
        if (overrides.style) {
            block.style = { ...block.style, ...overrides.style };
            // Remove style from overrides to prevent overwrite during Object.assign
            const { style, ...rest } = overrides;
            Object.assign(block, rest);
        } else {
            Object.assign(block, overrides);
        }

        return block;
    }
};
