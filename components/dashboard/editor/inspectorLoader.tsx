/**
 * Dynamic inspector loader for optimized bundle splitting.
 * Loads inspector components on-demand based on block type.
 *
 * This reduces initial bundle size by ~300KB+ by splitting
 * inspector code into separate chunks loaded when needed.
 *
 * @module inspectorLoader
 */
import dynamic from 'next/dynamic';
import React from 'react';
import type { BlockType } from '@/types/cms';

// Loading placeholder for inspector panels
const InspectorLoading = () => (
    <div className="flex items-center justify-center p-8 text-neutral-400">
        <div className="animate-pulse">Chargement...</div>
    </div>
);

/**
 * Dynamically imported inspectors map.
 * Each inspector is loaded only when its block type is selected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inspectorMap: Record<BlockType, React.ComponentType<any>> = {
    text: dynamic(() => import('../inspectors/TextInspector').then(mod => mod.TextInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    image: dynamic(() => import('../inspectors/ImageInspector').then(mod => mod.ImageInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    gallery: dynamic(() => import('../inspectors/GalleryInspector').then(mod => mod.GalleryInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    video: dynamic(() => import('../inspectors/VideoInspector').then(mod => mod.VideoInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    embed: dynamic(() => import('../inspectors/EmbedInspector').then(mod => mod.EmbedInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    divider: dynamic(() => import('../inspectors/DividerInspector').then(mod => mod.DividerInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    columns: dynamic(() => import('../inspectors/ColumnsInspector').then(mod => mod.ColumnsInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    button: dynamic(() => import('../inspectors/ButtonInspector').then(mod => mod.ButtonInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    oeuvre: dynamic(() => import('../inspectors/OeuvreInspector').then(mod => mod.OeuvreInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    artworkList: dynamic(() => import('../inspectors/ArtworkListInspector').then(mod => mod.ArtworkListInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    artistName: dynamic(() => import('../inspectors/ArtistNameInspector').then(mod => mod.ArtistNameInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    artistPhoto: dynamic(() => import('../inspectors/ArtistPhotoInspector').then(mod => mod.ArtistPhotoInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    artistBio: dynamic(() => import('../inspectors/ArtistBioInspector').then(mod => mod.ArtistBioInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    contactForm: dynamic(() => import('../inspectors/ContactFormInspector').then(mod => mod.ContactFormInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
    eventList: dynamic(() => import('../inspectors/EventListInspector').then(mod => mod.EventListInspector), {
        loading: InspectorLoading,
        ssr: false,
    }),
};

/**
 * Get the inspector component for a given block type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getInspectorComponent(type: BlockType): React.ComponentType<any> | null {
    return inspectorMap[type] || null;
}

/**
 * Preload an inspector component before it's needed.
 */
export function preloadInspector(type: BlockType): void {
    const component = inspectorMap[type];
    if (component && 'preload' in component) {
        (component as { preload: () => void }).preload();
    }
}

/**
 * List of all available block types with inspectors.
 */
export const BLOCK_TYPES_WITH_INSPECTORS: BlockType[] = Object.keys(inspectorMap) as BlockType[];

// ============================================================================
// Block Registry Integration
// ============================================================================

import { getBlockDefinition, isBlockRegistered, listBlockTypes } from '@/lib/cms/blockRegistry';
import type { BlockDefinition } from '@/lib/cms/blockRegistry';

/**
 * Combined block metadata and inspector component.
 */
export interface BlockMetadataWithInspector {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Inspector: React.ComponentType<any> | null;
    definition: BlockDefinition | undefined;
    isComplete: boolean;
}

/**
 * Get combined block metadata and inspector component.
 */
export function getBlockMetadataAndInspector(type: BlockType): BlockMetadataWithInspector {
    const Inspector = getInspectorComponent(type);
    const definition = getBlockDefinition(type);

    return {
        Inspector,
        definition,
        isComplete: Inspector !== null && definition !== undefined,
    };
}

/**
 * Validate that all registered block types have inspectors.
 */
export function validateInspectorCoverage(): {
    complete: BlockType[];
    missingInspector: BlockType[];
    missingRegistry: BlockType[];
} {
    const registeredTypes = listBlockTypes();
    const inspectorTypes = BLOCK_TYPES_WITH_INSPECTORS;

    const complete: BlockType[] = [];
    const missingInspector: BlockType[] = [];
    const missingRegistry: BlockType[] = [];

    for (const type of registeredTypes) {
        if (inspectorMap[type]) {
            complete.push(type);
        } else {
            missingInspector.push(type);
        }
    }

    for (const type of inspectorTypes) {
        if (!isBlockRegistered(type)) {
            missingRegistry.push(type);
        }
    }

    return { complete, missingInspector, missingRegistry };
}

export default inspectorMap;
