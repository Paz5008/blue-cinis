/**
 * Tests for useBlockOperations hook.
 *
 * @module test/hooks.useBlockOperations.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlockOperations } from '@/components/dashboard/editor/hooks/useBlockOperations';
import type { Block, BlockType, ThemeConfig } from '@/types/cms';

// Mock createBlockInstance
vi.mock('@/components/dashboard/editor/EditorUtils', () => ({
    createBlockInstance: vi.fn((type: BlockType) => ({
        id: `mock-${type}-${Date.now()}`,
        type,
        x: 0,
        y: 0,
        width: 100,
        height: 50,
    })),
}));

// Mock getTemplateByKey
vi.mock('@/lib/cms/templates', () => ({
    getTemplateByKey: vi.fn((key: string, ctx: any) => {
        if (key === 'columns-2') {
            return [
                { id: 'col-1', type: 'columns', columns: [[], []] },
            ];
        }
        return [];
    }),
}));

describe('useBlockOperations', () => {
    const createMockProps = () => {
        const blocks: Block[] = [
            { id: 'block-1', type: 'text', content: 'Hello', x: 0, y: 0 } as Block,
            { id: 'block-2', type: 'image', src: '/img.png', x: 0, y: 100 } as Block,
        ];

        return {
            blocks,
            setBlocks: vi.fn(),
            addBlock: vi.fn(),
            removeBlock: vi.fn(),
            duplicateBlock: vi.fn(),
            updateBlock: vi.fn(),
            setSelectedIndex: vi.fn(),
            setNextFocusBlockId: vi.fn(),
            setLiveStatus: vi.fn(),
            setMeta: vi.fn(),
            artistData: { name: 'Test Artist' },
            isBanner: false,
            rememberBlock: vi.fn(),
            setPostInsertChecklist: vi.fn(),
            theme: {} as ThemeConfig,
            oeuvreOptions: [],
            getHeroBg: vi.fn(),
            pickUpload: vi.fn(),
            getLoremImages: vi.fn(() => []),
        };
    };

    describe('handleAddBlock', () => {
        it('should call rememberBlock and baseAddBlock', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.handleAddBlock('text');
            });

            expect(props.rememberBlock).toHaveBeenCalledWith('text');
            expect(props.addBlock).toHaveBeenCalledWith('text');
        });

        it('should set meta title for banner when empty', () => {
            const props = createMockProps();
            props.isBanner = true;

            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.handleAddBlock('image');
            });

            expect(props.setMeta).toHaveBeenCalled();
        });
    });

    describe('addBlockAt', () => {
        it('should call baseAddBlock with type and index', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.addBlockAt('button', 1);
            });

            expect(props.rememberBlock).toHaveBeenCalledWith('button');
            expect(props.addBlock).toHaveBeenCalledWith('button', 1);
        });
    });

    describe('handleAddStructuralBlock', () => {
        it('should add template blocks and update selection', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.handleAddStructuralBlock('columns-2');
            });

            expect(props.setBlocks).toHaveBeenCalled();
            expect(props.setSelectedIndex).toHaveBeenCalledWith(props.blocks.length);
            expect(props.setNextFocusBlockId).toHaveBeenCalled();
            expect(props.setLiveStatus).toHaveBeenCalledWith('Structure ajoutée');
        });

        it('should not update if template returns empty', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.handleAddStructuralBlock('nonexistent');
            });

            expect(props.setBlocks).not.toHaveBeenCalled();
        });
    });

    describe('updateBlockAtIndex', () => {
        it('should call baseUpdateBlock with updated block', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            const updatedBlock = { ...props.blocks[0], content: 'Updated' } as Block;

            act(() => {
                result.current.updateBlockAtIndex(0, updatedBlock);
            });

            expect(props.updateBlock).toHaveBeenCalledWith(updatedBlock);
        });
    });

    describe('convertBlock', () => {
        it('should convert image to oeuvre preserving common props', () => {
            const props = createMockProps();
            props.blocks = [
                {
                    id: 'img-block',
                    type: 'image',
                    src: '/test.png',
                    x: 10,
                    y: 20,
                    style: { backgroundColor: 'red' },
                } as Block,
            ];

            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.convertBlock('img-block', 'oeuvre');
            });

            expect(props.setBlocks).toHaveBeenCalled();
            const setBlocksFn = props.setBlocks.mock.calls[0][0];
            const newBlocks = setBlocksFn(props.blocks);

            expect(newBlocks[0].type).toBe('oeuvre');
            expect(newBlocks[0].x).toBe(10);
            expect(newBlocks[0].y).toBe(20);
            expect(newBlocks[0].style).toEqual({ backgroundColor: 'red' });
        });

        it('should convert oeuvre to image preserving common props', () => {
            const props = createMockProps();
            props.blocks = [
                {
                    id: 'oeuvre-block',
                    type: 'oeuvre',
                    artworks: ['art-1'],
                    x: 5,
                    y: 15,
                    rotation: 45,
                } as Block,
            ];

            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.convertBlock('oeuvre-block', 'image');
            });

            expect(props.setBlocks).toHaveBeenCalled();
            const setBlocksFn = props.setBlocks.mock.calls[0][0];
            const newBlocks = setBlocksFn(props.blocks);

            expect(newBlocks[0].type).toBe('image');
            expect(newBlocks[0].x).toBe(5);
            expect(newBlocks[0].rotation).toBe(45);
        });

        it('should do nothing if blockId not found', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.convertBlock('nonexistent', 'text');
            });

            expect(props.setBlocks).toHaveBeenCalled();
            const setBlocksFn = props.setBlocks.mock.calls[0][0];
            const newBlocks = setBlocksFn(props.blocks);

            // Should return same blocks unchanged
            expect(newBlocks).toEqual(props.blocks);
        });
    });

    describe('returned functions', () => {
        it('should expose removeBlock and duplicateBlock from base', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            act(() => {
                result.current.removeBlock(0);
            });
            expect(props.removeBlock).toHaveBeenCalledWith(0);

            act(() => {
                result.current.duplicateBlock(1);
            });
            expect(props.duplicateBlock).toHaveBeenCalledWith(1);
        });

        it('should expose updateBlock from base', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useBlockOperations(props));

            const block = { id: 'test', type: 'text' } as Block;
            act(() => {
                result.current.updateBlock(block);
            });

            expect(props.updateBlock).toHaveBeenCalledWith(block);
        });
    });
});
