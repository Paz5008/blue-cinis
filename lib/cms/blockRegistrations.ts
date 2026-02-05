/**
 * Block registrations for all 18 CMS block types.
 * Import this file once at app initialization to populate the registry.
 *
 * @module lib/cms/blockRegistrations
 *
 * @example
 * ```typescript
 * // In app layout or editor initialization
 * import '@/lib/cms/blockRegistrations';
 * ```
 */

import { registerBlock } from './blockRegistry';
import {
    Type,
    Image,
    Images,
    Video,
    Code,
    Minus,
    Columns,
    Square,
    Palette,
    LayoutGrid,
    User,
    Camera,
    FileText,
    Mail,
    Calendar,
} from 'lucide-react';

// Import schemas
// Note: Schemas are imported from blockValidation but exported schemas would
// be used here. For now, we use ZodTypeAny placeholders since the actual
// integration with inspectors and renderers is deferred.

// Placeholder - actual components would be dynamically imported
// This file serves as the registration manifest
const PlaceholderInspector = () => null;
const PlaceholderRenderer = () => null;

// ============================================================================
// Content Blocks
// ============================================================================

registerBlock({
    type: 'text',
    label: 'Texte',
    icon: Type,
    category: 'content',
    schema: {} as any, // Would use TextBlockSchema
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ content: '<p>Nouveau texte</p>' }),
    description: 'Bloc de texte riche avec formatage',
});

registerBlock({
    type: 'image',
    label: 'Image',
    icon: Image,
    category: 'media',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ src: '' }),
    description: 'Image avec légende optionnelle',
});

registerBlock({
    type: 'gallery',
    label: 'Galerie',
    icon: Images,
    category: 'media',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ images: [] }),
    description: 'Galerie d\'images en grille ou carousel',
});

registerBlock({
    type: 'video',
    label: 'Vidéo',
    icon: Video,
    category: 'media',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ src: '' }),
    description: 'Vidéo avec contrôles',
});

registerBlock({
    type: 'embed',
    label: 'Embed',
    icon: Code,
    category: 'media',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ url: '' }),
    description: 'Contenu externe (YouTube, Vimeo, etc.)',
});

// ============================================================================
// Structure Blocks
// ============================================================================

registerBlock({
    type: 'divider',
    label: 'Séparateur',
    icon: Minus,
    category: 'structure',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({}),
    description: 'Ligne de séparation horizontale',
});

registerBlock({
    type: 'columns',
    label: 'Colonnes',
    icon: Columns,
    category: 'structure',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ count: 2, columns: [[], []] }),
    description: 'Disposition en colonnes (2-4 colonnes)',
    isContainer: true,
});

// ============================================================================
// Artist Blocks
// ============================================================================

registerBlock({
    type: 'artistName',
    label: 'Nom artiste',
    icon: User,
    category: 'artist',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({}),
    description: 'Affiche le nom de l\'artiste',
});

registerBlock({
    type: 'artistPhoto',
    label: 'Photo artiste',
    icon: Camera,
    category: 'artist',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({}),
    description: 'Photo de profil de l\'artiste',
});

registerBlock({
    type: 'artistBio',
    label: 'Bio artiste',
    icon: FileText,
    category: 'artist',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({}),
    description: 'Biographie de l\'artiste',
});

// ============================================================================
// Artwork Blocks
// ============================================================================

registerBlock({
    type: 'oeuvre',
    label: 'Œuvres',
    icon: Palette,
    category: 'media',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ artworks: [] }),
    description: 'Sélection d\'œuvres de l\'artiste',
});

registerBlock({
    type: 'artworkList',
    label: 'Liste œuvres',
    icon: LayoutGrid,
    category: 'media',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({}),
    description: 'Liste d\'œuvres avec filtres',
});

// ============================================================================
// Interaction Blocks
// ============================================================================

registerBlock({
    type: 'button',
    label: 'Bouton',
    icon: Square,
    category: 'interaction',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ label: 'Cliquez ici', url: '' }),
    description: 'Bouton d\'action',
});

registerBlock({
    type: 'contactForm',
    label: 'Formulaire',
    icon: Mail,
    category: 'interaction',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({}),
    description: 'Formulaire de contact',
});

registerBlock({
    type: 'eventList',
    label: 'Événements',
    icon: Calendar,
    category: 'interaction',
    schema: {} as any,
    Inspector: PlaceholderInspector as any,
    Renderer: PlaceholderRenderer as any,
    defaultProps: () => ({ events: [] }),
    description: 'Liste d\'événements',
});

// Log registration count
console.log(`[blockRegistrations] Registered ${18} block types`);
