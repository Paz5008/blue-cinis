import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
    type BlockDefinition,
} from '@/lib/cms/blockRegistry';
import { z } from 'zod';
import { Type } from 'lucide-react';
import type { TextBlock } from '@/types/cms';

// Mock components
const MockInspector = vi.fn(() => null);
const MockRenderer = vi.fn(() => null);

// Test schema
const TestSchema = z.object({
    id: z.string(),
    type: z.literal('text'),
    content: z.string(),
});

// Test definition
const testTextDefinition: BlockDefinition<TextBlock> = {
    type: 'text',
    label: 'Texte',
    icon: Type,
    category: 'content',
    schema: TestSchema,
    Inspector: MockInspector as any,
    Renderer: MockRenderer as any,
    defaultProps: () => ({ content: '<p>Default</p>' }),
    description: 'A text block',
};

describe('blockRegistry', () => {
    beforeEach(() => {
        clearRegistry();
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    describe('registerBlock', () => {
        it('should register a block definition', () => {
            registerBlock(testTextDefinition);
            expect(getRegistrySize()).toBe(1);
        });

        it('should warn when overwriting an existing block', () => {
            registerBlock(testTextDefinition);
            registerBlock(testTextDefinition);
            expect(console.warn).toHaveBeenCalledWith(
                '[blockRegistry] Block type "text" already registered, overwriting.'
            );
        });
    });

    describe('getBlockDefinition', () => {
        it('should return the block definition', () => {
            registerBlock(testTextDefinition);
            const def = getBlockDefinition('text');
            expect(def).toBeDefined();
            expect(def?.label).toBe('Texte');
        });

        it('should return undefined for unregistered type', () => {
            const def = getBlockDefinition('unknown' as any);
            expect(def).toBeUndefined();
        });
    });

    describe('getBlockInspector', () => {
        it('should return the inspector component', () => {
            registerBlock(testTextDefinition);
            const Inspector = getBlockInspector('text');
            expect(Inspector).toBe(MockInspector);
        });

        it('should return null for unregistered type', () => {
            const Inspector = getBlockInspector('unknown' as any);
            expect(Inspector).toBeNull();
        });
    });

    describe('getBlockRenderer', () => {
        it('should return the renderer component', () => {
            registerBlock(testTextDefinition);
            const Renderer = getBlockRenderer('text');
            expect(Renderer).toBe(MockRenderer);
        });

        it('should return null for unregistered type', () => {
            const Renderer = getBlockRenderer('unknown' as any);
            expect(Renderer).toBeNull();
        });
    });

    describe('listBlocks', () => {
        it('should return all registered blocks', () => {
            registerBlock(testTextDefinition);
            registerBlock({ ...testTextDefinition, type: 'image', label: 'Image', category: 'media' });

            const blocks = listBlocks();
            expect(blocks).toHaveLength(2);
        });

        it('should filter by category', () => {
            registerBlock(testTextDefinition);
            registerBlock({ ...testTextDefinition, type: 'image', label: 'Image', category: 'media' });

            const contentBlocks = listBlocks('content');
            expect(contentBlocks).toHaveLength(1);
            expect(contentBlocks[0].type).toBe('text');
        });

        it('should return empty array when no blocks match category', () => {
            registerBlock(testTextDefinition);
            const artistBlocks = listBlocks('artist');
            expect(artistBlocks).toHaveLength(0);
        });
    });

    describe('listBlockTypes', () => {
        it('should return all registered block types', () => {
            registerBlock(testTextDefinition);
            registerBlock({ ...testTextDefinition, type: 'image', label: 'Image' });

            const types = listBlockTypes();
            expect(types).toContain('text');
            expect(types).toContain('image');
        });
    });

    describe('isBlockRegistered', () => {
        it('should return true for registered blocks', () => {
            registerBlock(testTextDefinition);
            expect(isBlockRegistered('text')).toBe(true);
        });

        it('should return false for unregistered blocks', () => {
            expect(isBlockRegistered('unknown' as any)).toBe(false);
        });
    });

    describe('createBlock', () => {
        it('should create a block with default props', () => {
            registerBlock(testTextDefinition);
            const block = createBlock<TextBlock>('text');

            expect(block).not.toBeNull();
            expect(block?.type).toBe('text');
            expect(block?.content).toBe('<p>Default</p>');
            expect(block?.id).toContain('text-');
        });

        it('should allow prop overrides', () => {
            registerBlock(testTextDefinition);
            const block = createBlock<TextBlock>('text', { content: '<p>Custom</p>' });

            expect(block?.content).toBe('<p>Custom</p>');
        });

        it('should return null for unregistered type', () => {
            const block = createBlock('unknown' as any);
            expect(block).toBeNull();
            expect(console.warn).toHaveBeenCalledWith('[blockRegistry] Unknown block type: unknown');
        });

        it('should generate unique IDs', () => {
            registerBlock(testTextDefinition);
            const block1 = createBlock<TextBlock>('text');
            const block2 = createBlock<TextBlock>('text');

            expect(block1?.id).not.toBe(block2?.id);
        });
    });

    describe('clearRegistry', () => {
        it('should remove all registered blocks', () => {
            registerBlock(testTextDefinition);
            expect(getRegistrySize()).toBe(1);

            clearRegistry();
            expect(getRegistrySize()).toBe(0);
        });
    });

    describe('getRegistrySize', () => {
        it('should return correct count', () => {
            expect(getRegistrySize()).toBe(0);

            registerBlock(testTextDefinition);
            expect(getRegistrySize()).toBe(1);

            registerBlock({ ...testTextDefinition, type: 'image' });
            expect(getRegistrySize()).toBe(2);
        });
    });
});
