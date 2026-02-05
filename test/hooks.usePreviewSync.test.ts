/**
 * Tests for usePreviewSync hook.
 *
 * @module test/hooks.usePreviewSync.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePreviewSync } from '@/components/dashboard/editor/hooks/usePreviewSync';
import type { Block, ThemeConfig } from '@/types/cms';

describe('usePreviewSync', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const createMockBlocks = (): Block[] => [
        { id: 'block-1', type: 'text', x: 0, y: 0 } as Block,
    ];

    const createMockTheme = (): ThemeConfig => ({
        primaryColor: '#000',
        secondaryColor: '#fff',
        backgroundColor: '#f0f0f0',
        textColor: '#333',
        typography: { fontPrimary: 'Inter' } as any,
        borderRadius: '8px',
        buttonStyle: 'filled',
        spacing: { base: 16 },
    } as ThemeConfig);

    describe('initialization', () => {
        it('should return initial blocks and theme', () => {
            const blocks = createMockBlocks();
            const theme = createMockTheme();

            const { result } = renderHook(() => usePreviewSync(blocks, theme));

            expect(result.current.blocks).toEqual(blocks);
            expect(result.current.theme).toEqual(theme);
        });

        it('should set initial timestamp', () => {
            const blocks = createMockBlocks();
            const theme = createMockTheme();

            const { result } = renderHook(() => usePreviewSync(blocks, theme));

            expect(result.current.timestamp).toBeDefined();
            expect(typeof result.current.timestamp).toBe('number');
        });
    });

    describe('debouncing', () => {
        it('should update after default debounce delay (300ms)', async () => {
            const blocks = createMockBlocks();
            const theme = createMockTheme();

            const { result, rerender } = renderHook(
                ({ b, t }) => usePreviewSync(b, t),
                { initialProps: { b: blocks, t: theme } }
            );

            const newBlocks = [{ id: 'block-2', type: 'image', x: 0, y: 0 } as Block];
            rerender({ b: newBlocks, t: theme });

            // Should not update immediately
            expect(result.current.blocks).toEqual(blocks);

            // Fast forward past debounce
            act(() => {
                vi.advanceTimersByTime(350);
            });

            expect(result.current.blocks).toEqual(newBlocks);
        });

        it('should respect custom debounce time', async () => {
            const blocks = createMockBlocks();
            const theme = createMockTheme();

            const { result, rerender } = renderHook(
                ({ b, t, d }) => usePreviewSync(b, t, d),
                { initialProps: { b: blocks, t: theme, d: 500 } }
            );

            const newBlocks = [{ id: 'block-2', type: 'image', x: 0, y: 0 } as Block];
            rerender({ b: newBlocks, t: theme, d: 500 });

            // At 350ms, should still be old
            act(() => {
                vi.advanceTimersByTime(350);
            });
            expect(result.current.blocks).toEqual(blocks);

            // At 550ms, should update
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(result.current.blocks).toEqual(newBlocks);
        });

        it('should cancel previous timeout on rapid updates', () => {
            const blocks = createMockBlocks();
            const theme = createMockTheme();

            const { result, rerender } = renderHook(
                ({ b, t }) => usePreviewSync(b, t),
                { initialProps: { b: blocks, t: theme } }
            );

            // First update
            rerender({ b: [{ id: 'b2', type: 'image', x: 0, y: 0 } as Block], t: theme });

            // Wait 100ms
            act(() => {
                vi.advanceTimersByTime(100);
            });

            // Second update (should cancel first)
            const finalBlocks = [{ id: 'b3', type: 'button', x: 0, y: 0 } as Block];
            rerender({ b: finalBlocks, t: theme });

            // Fast forward past debounce
            act(() => {
                vi.advanceTimersByTime(350);
            });

            // Should have final blocks, not intermediate
            expect(result.current.blocks).toEqual(finalBlocks);
        });
    });

    describe('timestamp', () => {
        it('should update timestamp on sync', () => {
            const blocks = createMockBlocks();
            const theme = createMockTheme();

            const { result, rerender } = renderHook(
                ({ b, t }) => usePreviewSync(b, t),
                { initialProps: { b: blocks, t: theme } }
            );

            const initialTimestamp = result.current.timestamp;

            const newBlocks = [{ id: 'block-2', type: 'image', x: 0, y: 0 } as Block];
            rerender({ b: newBlocks, t: theme });

            act(() => {
                vi.advanceTimersByTime(350);
            });

            expect(result.current.timestamp).toBeGreaterThanOrEqual(initialTimestamp);
        });
    });
});
