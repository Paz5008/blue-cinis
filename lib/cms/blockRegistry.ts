/**
 * Block Registry SDK for extensible CMS block management.
 * 
 * This module provides a centralized registry for all block types,
 * enabling plugin-style block definitions with associated schemas,
 * inspectors, and renderers.
 * 
 * @module lib/cms/blockRegistry
 * 
 * @example
 * ```typescript
 * // Register a custom block
 * registerBlock({
 *   type: 'custom',
 *   label: 'Custom Block',
 *   icon: BoxIcon,
 *   category: 'content',
 *   schema: CustomBlockSchema,
 *   Inspector: CustomInspector,
 *   Renderer: CustomRenderer,
 *   defaultProps: () => ({ content: '' }),
 * });
 * 
 * // Use registry
 * const def = getBlockDefinition('custom');
 * const Inspector = def?.Inspector;
 * ```
 */

import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ZodTypeAny } from 'zod';
import type { Block, BlockType } from '@/types/cms';

// ============================================================================
// Types
// ============================================================================

/**
 * Category for grouping blocks in the palette
 */
export type BlockCategory = 'content' | 'structure' | 'artist' | 'interaction' | 'media';

/**
 * Complete definition for a block type
 */
export interface BlockDefinition<T extends Block = Block> {
    /** Unique block type identifier */
    type: BlockType;
    /** Human-readable label for UI */
    label: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Category for palette grouping */
    category: BlockCategory;
    /** Zod schema for validation */
    schema: ZodTypeAny;
    /** Inspector component for editing */
    Inspector: ComponentType<{ block: T; onUpdate: (block: T) => void }>;
    /** Renderer component for display */
    Renderer: ComponentType<{ block: T }>;
    /** Factory function for default props */
    defaultProps: () => Partial<T>;
    /** Optional description for tooltips */
    description?: string;
    /** Whether this block can contain children */
    isContainer?: boolean;
    /** Minimum required fields for creation */
    requiredFields?: (keyof T)[];
}

// ============================================================================
// Registry Storage
// ============================================================================

const registry = new Map<BlockType, BlockDefinition>();

// ============================================================================
// Registry Functions
// ============================================================================

/**
 * Register a new block type.
 * 
 * @param definition - Complete block definition
 * @throws Warning if block type already registered
 * 
 * @example
 * ```typescript
 * registerBlock({
 *   type: 'text',
 *   label: 'Texte',
 *   icon: Type,
 *   category: 'content',
 *   schema: TextBlockSchema,
 *   Inspector: TextInspector,
 *   Renderer: TextRenderer,
 *   defaultProps: () => ({ content: '<p>Nouveau texte</p>' }),
 * });
 * ```
 */
export function registerBlock<T extends Block>(definition: BlockDefinition<T>): void {
    if (registry.has(definition.type)) {
        console.warn(`[blockRegistry] Block type "${definition.type}" already registered, overwriting.`);
    }
    // Cast via unknown to handle generic variance - runtime behavior is correct
    registry.set(definition.type, definition as unknown as BlockDefinition);
}

/**
 * Get the definition for a block type.
 * 
 * @param type - Block type to lookup
 * @returns Block definition or undefined if not found
 */
export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
    return registry.get(type);
}

/**
 * Get the Inspector component for a block type.
 * 
 * @param type - Block type to lookup
 * @returns Inspector component or null
 */
export function getBlockInspector(type: BlockType): ComponentType<{ block: Block; onUpdate: (block: Block) => void }> | null {
    const def = registry.get(type);
    return def?.Inspector || null;
}

/**
 * Get the Renderer component for a block type.
 * 
 * @param type - Block type to lookup
 * @returns Renderer component or null
 */
export function getBlockRenderer(type: BlockType): ComponentType<{ block: Block }> | null {
    const def = registry.get(type);
    return def?.Renderer || null;
}

/**
 * List all registered blocks, optionally filtered by category.
 * 
 * @param category - Optional category filter
 * @returns Array of block definitions
 */
export function listBlocks(category?: BlockCategory): BlockDefinition[] {
    const blocks = Array.from(registry.values());
    return category ? blocks.filter(b => b.category === category) : blocks;
}

/**
 * Get all registered block types.
 * 
 * @returns Array of block type strings
 */
export function listBlockTypes(): BlockType[] {
    return Array.from(registry.keys());
}

/**
 * Check if a block type is registered.
 * 
 * @param type - Block type to check
 * @returns True if registered
 */
export function isBlockRegistered(type: BlockType): boolean {
    return registry.has(type);
}

/**
 * Create a new block instance with default props.
 * 
 * @param type - Block type to create
 * @param overrides - Optional prop overrides
 * @returns New block instance or null if type not found
 */
export function createBlock<T extends Block>(
    type: BlockType,
    overrides: Partial<T> = {}
): T | null {
    const def = registry.get(type);
    if (!def) {
        console.warn(`[blockRegistry] Unknown block type: ${type}`);
        return null;
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    return {
        id,
        type,
        ...def.defaultProps(),
        ...overrides,
    } as T;
}

/**
 * Clear all registered blocks (useful for testing).
 */
export function clearRegistry(): void {
    registry.clear();
}

/**
 * Get registry size.
 * 
 * @returns Number of registered blocks
 */
export function getRegistrySize(): number {
    return registry.size;
}

// ============================================================================
// Exports
// ============================================================================

export default {
    registerBlock,
    getBlockDefinition,
    getBlockInspector,
    getBlockRenderer,
    listBlocks,
    listBlockTypes,
    isBlockRegistered,
    createBlock,
    clearRegistry,
    getRegistrySize,
};
