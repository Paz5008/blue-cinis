/**
 * Tests for useCanvasInteraction hook.
 *
 * @module test/hooks.useCanvasInteraction.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasInteraction } from '@/components/dashboard/editor/hooks/useCanvasInteraction';
import type { Block } from '@/types/cms';

describe('useCanvasInteraction', () => {
    const createMockProps = () => ({
        viewMode: 'edit' as const,
        activeBlockId: 'block-1',
        blocksData: {
            'block-1': {
                id: 'block-1',
                type: 'text',
                style: { position: 'absolute', top: '100px', left: '50px' },
            } as Block,
        },
        updateBlock: vi.fn(),
        blockRefs: { current: {} as Record<string, HTMLElement | null> },
        nextFocusBlockId: null as string | null,
        setNextFocusBlockId: vi.fn(),
        setShowPalette: vi.fn(),
        setShowInspector: vi.fn(),
        showPalette: true,
        showInspector: true,
    });

    describe('initialization', () => {
        it('should return goToBlock function', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useCanvasInteraction(props));

            expect(result.current.goToBlock).toBeDefined();
            expect(typeof result.current.goToBlock).toBe('function');
        });

        it('should return toggleFocusMode function', () => {
            const props = createMockProps();
            const { result } = renderHook(() => useCanvasInteraction(props));

            expect(result.current.toggleFocusMode).toBeDefined();
            expect(typeof result.current.toggleFocusMode).toBe('function');
        });
    });

    describe('toggleFocusMode', () => {
        it('should hide palette and inspector if both are shown', () => {
            const props = createMockProps();
            props.showPalette = true;
            props.showInspector = true;

            const { result } = renderHook(() => useCanvasInteraction(props));

            act(() => {
                result.current.toggleFocusMode();
            });

            expect(props.setShowPalette).toHaveBeenCalledWith(false);
            expect(props.setShowInspector).toHaveBeenCalledWith(false);
        });

        it('should show palette and inspector if both are hidden', () => {
            const props = createMockProps();
            props.showPalette = false;
            props.showInspector = false;

            const { result } = renderHook(() => useCanvasInteraction(props));

            act(() => {
                result.current.toggleFocusMode();
            });

            expect(props.setShowPalette).toHaveBeenCalledWith(true);
            expect(props.setShowInspector).toHaveBeenCalledWith(true);
        });

        it('should hide if only one is shown', () => {
            const props = createMockProps();
            props.showPalette = true;
            props.showInspector = false;

            const { result } = renderHook(() => useCanvasInteraction(props));

            act(() => {
                result.current.toggleFocusMode();
            });

            expect(props.setShowPalette).toHaveBeenCalledWith(false);
            expect(props.setShowInspector).toHaveBeenCalledWith(false);
        });
    });

    describe('goToBlock', () => {
        it('should scroll to block element', () => {
            const mockScrollIntoView = vi.fn();
            const mockFocus = vi.fn();

            const props = createMockProps();
            props.blockRefs.current = {
                'block-1': {
                    scrollIntoView: mockScrollIntoView,
                    focus: mockFocus,
                } as any,
            };

            const { result } = renderHook(() => useCanvasInteraction(props));

            act(() => {
                result.current.goToBlock('block-1');
            });

            expect(mockScrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'center',
            });
        });

        it('should do nothing if block ref not found', () => {
            const props = createMockProps();
            props.blockRefs.current = {};

            const { result } = renderHook(() => useCanvasInteraction(props));

            // Should not throw
            act(() => {
                result.current.goToBlock('nonexistent');
            });
        });
    });

    describe('keyboard nudge effect', () => {
        it('should add keydown event listener', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

            const props = createMockProps();
            renderHook(() => useCanvasInteraction(props));

            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            addEventListenerSpy.mockRestore();
        });

        it('should remove keydown event listener on unmount', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            const props = createMockProps();
            const { unmount } = renderHook(() => useCanvasInteraction(props));

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('nextFocusBlockId effect', () => {
        it('should focus element when nextFocusBlockId changes', async () => {
            vi.useFakeTimers();
            const mockFocus = vi.fn();

            const props = createMockProps();
            props.nextFocusBlockId = 'block-1';
            props.blockRefs.current = {
                'block-1': { focus: mockFocus } as any,
            };

            renderHook(() => useCanvasInteraction(props));

            // Run the setTimeout
            vi.runAllTimers();

            expect(mockFocus).toHaveBeenCalled();
            expect(props.setNextFocusBlockId).toHaveBeenCalledWith(null);

            vi.useRealTimers();
        });

        it('should not focus if nextFocusBlockId is null', () => {
            const mockFocus = vi.fn();

            const props = createMockProps();
            props.nextFocusBlockId = null;
            props.blockRefs.current = {
                'block-1': { focus: mockFocus } as any,
            };

            renderHook(() => useCanvasInteraction(props));

            expect(mockFocus).not.toHaveBeenCalled();
            expect(props.setNextFocusBlockId).not.toHaveBeenCalled();
        });
    });
});
