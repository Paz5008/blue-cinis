/**
 * Tests for useEditorDragDrop hook.
 *
 * @module test/hooks.useEditorDragDrop.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorDragDrop } from '@/components/dashboard/editor/hooks/useEditorDragDrop';
import type { Block } from '@/types/cms';

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
    useSensors: vi.fn(() => []),
    useSensor: vi.fn((sensor) => sensor),
    PointerSensor: 'PointerSensor',
    KeyboardSensor: 'KeyboardSensor',
}));

// Mock dnd strategies
vi.mock('@/lib/dnd-strategies/root', () => ({
    moveRootBlock: vi.fn(),
}));
vi.mock('@/lib/dnd-strategies/container', () => ({
    moveContainerChild: vi.fn(),
    moveContainerChildToRoot: vi.fn(),
    insertRootIntoContainer: vi.fn(),
}));
vi.mock('@/lib/dnd-strategies/columns', () => ({
    moveBlockIntoColumns: vi.fn(),
}));

describe('useEditorDragDrop', () => {
    const createMockProps = () => {
        const blocks: Block[] = [
            { id: 'block-1', type: 'text', x: 0, y: 0 } as Block,
            { id: 'block-2', type: 'image', x: 0, y: 100 } as Block,
        ];

        return {
            blocks,
            setBlocks: vi.fn(),
            addBlockAt: vi.fn(),
            setDirty: vi.fn(),
            setSelectedIndex: vi.fn(),
            setSelectedChild: vi.fn(),
            setLiveStatus: vi.fn(),
            blockRefs: { current: {} },
            setIsCanvasDragOver: vi.fn(),
            viewMode: 'edit' as const,
        };
    };

    describe('initialization', () => {
        it('should return sensors array', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            expect(result.current.sensors).toBeDefined();
        });

        it('should initialize activeDragType as null', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            expect(result.current.activeDragType).toBeNull();
        });

        it('should expose all required handlers', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            expect(result.current.handleDndKitDragStart).toBeDefined();
            expect(result.current.handleDndKitDragEnd).toBeDefined();
            expect(result.current.handleDragStart).toBeDefined();
            expect(result.current.handleDrop).toBeDefined();
            expect(result.current.startAbsDrag).toBeDefined();
        });
    });

    describe('handleDndKitDragStart', () => {
        it('should set activeDragType based on block id', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            const mockEvent = {
                active: { id: 'block-1' },
            };

            act(() => {
                result.current.handleDndKitDragStart(mockEvent as any);
            });

            expect(result.current.activeDragType).toBe('text');
        });

        it('should set null for unknown block id', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            const mockEvent = {
                active: { id: 'unknown-id' },
            };

            act(() => {
                result.current.handleDndKitDragStart(mockEvent as any);
            });

            expect(result.current.activeDragType).toBeNull();
        });
    });

    describe('handleDndKitDragEnd', () => {
        it('should reset activeDragType to null', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            // First set a drag type
            act(() => {
                result.current.handleDndKitDragStart({ active: { id: 'block-1' } } as any);
            });
            expect(result.current.activeDragType).toBe('text');

            // Then end drag
            act(() => {
                result.current.handleDndKitDragEnd({ active: { id: 'block-1' }, over: null } as any);
            });
            expect(result.current.activeDragType).toBeNull();
        });

        it('should do nothing if over is null', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            act(() => {
                result.current.handleDndKitDragEnd({ active: { id: 'block-1' }, over: null } as any);
            });

            expect(props.setBlocks).not.toHaveBeenCalled();
        });
    });

    describe('handleDragStart (HTML5)', () => {
        it('should return a function that sets dataTransfer', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            const handler = result.current.handleDragStart('text');

            const mockEvent = {
                dataTransfer: {
                    setData: vi.fn(),
                },
            };

            handler(mockEvent as any);

            expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('block-type', 'text');
        });
    });

    describe('handleDrop (HTML5)', () => {
        it('should call addBlockAt when dropping new block', () => {
            const props = createMockProps();
            props.blockRefs.current = {
                'block-1': { getBoundingClientRect: () => ({ top: 0, height: 100 }) } as any,
                'block-2': { getBoundingClientRect: () => ({ top: 100, height: 100 }) } as any,
            };

            const { result } = renderHook(() => useEditorDragDrop(props));

            const mockEvent = {
                preventDefault: vi.fn(),
                clientY: 250,
                dataTransfer: {
                    getData: vi.fn((key) => (key === 'block-type' ? 'button' : '')),
                },
            };

            act(() => {
                result.current.handleDrop(mockEvent as any);
            });

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(props.addBlockAt).toHaveBeenCalledWith('button', 2);
            expect(props.setIsCanvasDragOver).toHaveBeenCalledWith(false);
        });

        it('should insert at correct position based on clientY', () => {
            const props = createMockProps();
            props.blockRefs.current = {
                'block-1': { getBoundingClientRect: () => ({ top: 0, height: 100 }) } as any,
                'block-2': { getBoundingClientRect: () => ({ top: 100, height: 100 }) } as any,
            };

            const { result } = renderHook(() => useEditorDragDrop(props));

            // Drop at y=25 (before mid of block-1 at 50)
            const mockEvent = {
                preventDefault: vi.fn(),
                clientY: 25,
                dataTransfer: {
                    getData: vi.fn((key) => (key === 'block-type' ? 'text' : '')),
                },
            };

            act(() => {
                result.current.handleDrop(mockEvent as any);
            });

            expect(props.addBlockAt).toHaveBeenCalledWith('text', 0);
        });
    });

    describe('startAbsDrag', () => {
        it('should not start drag if viewMode is not edit', () => {
            const props = createMockProps();
            props.viewMode = 'preview';

            const { result } = renderHook(() => useEditorDragDrop(props));

            const mockEvent = {
                stopPropagation: vi.fn(),
                clientX: 0,
                clientY: 0,
                currentTarget: document.createElement('div'),
            };

            const block = { id: 'block-1', style: { position: 'absolute' } };

            act(() => {
                result.current.startAbsDrag(mockEvent as any, block);
            });

            expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
        });

        it('should not start drag if block is not absolute positioned', () => {
            const props = createMockProps();

            const { result } = renderHook(() => useEditorDragDrop(props));

            const mockEvent = {
                stopPropagation: vi.fn(),
                clientX: 0,
                clientY: 0,
                currentTarget: document.createElement('div'),
            };

            const block = { id: 'block-1', style: {} };

            act(() => {
                result.current.startAbsDrag(mockEvent as any, block);
            });

            expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
        });
    });

    describe('findBlockTypeById', () => {
        it('should find block type in root blocks', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useEditorDragDrop(props));

            // Block type found via handleDndKitDragStart
            act(() => {
                result.current.handleDndKitDragStart({ active: { id: 'block-2' } } as any);
            });

            expect(result.current.activeDragType).toBe('image');
        });

        it('should find block type in container children', () => {
            const props = createMockProps();
            props.blocks = [
                {
                    id: 'container-1',
                    type: 'container',
                    children: [{ id: 'child-1', type: 'text' }],
                } as any,
            ];

            const { result } = renderHook(() => useEditorDragDrop(props));

            act(() => {
                result.current.handleDndKitDragStart({ active: { id: 'child-1' } } as any);
            });

            expect(result.current.activeDragType).toBe('text');
        });

        it('should find block type in columns', () => {
            const props = createMockProps();
            props.blocks = [
                {
                    id: 'columns-1',
                    type: 'columns',
                    columns: [[{ id: 'col-child-1', type: 'button' }], []],
                } as any,
            ];

            const { result } = renderHook(() => useEditorDragDrop(props));

            act(() => {
                result.current.handleDndKitDragStart({ active: { id: 'col-child-1' } } as any);
            });

            expect(result.current.activeDragType).toBe('button');
        });
    });
});
