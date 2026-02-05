import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorMetrics } from '@/components/dashboard/editor/hooks/useEditorMetrics';

// Mock performance API
const mockPerformance = {
    now: vi.fn(() => 1000),
    mark: vi.fn(),
    measure: vi.fn(),
};

Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
});

describe('useEditorMetrics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPerformance.now.mockReturnValue(1000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with correct default values', () => {
        const { result } = renderHook(() => useEditorMetrics(5));

        expect(result.current.metrics.blockCount).toBe(5);
        expect(result.current.metrics.tti).toBeNull();
        expect(result.current.metrics.lastRenderMs).toBeNull();
        expect(result.current.metrics.memoryMB).toBeNull();
        expect(result.current.metrics.isCollecting).toBe(true);
    });

    it('should update block count when changed', () => {
        const { result, rerender } = renderHook(({ count }) => useEditorMetrics(count), {
            initialProps: { count: 5 },
        });

        expect(result.current.metrics.blockCount).toBe(5);

        rerender({ count: 10 });
        expect(result.current.metrics.blockCount).toBe(10);
    });

    it('should track render time between markRenderStart and markRenderEnd', () => {
        const { result } = renderHook(() => useEditorMetrics(5, { enableLogging: false }));

        mockPerformance.now.mockReturnValueOnce(1000); // Start
        act(() => {
            result.current.markRenderStart();
        });

        mockPerformance.now.mockReturnValueOnce(1016); // End (16ms later)
        act(() => {
            result.current.markRenderEnd();
        });

        expect(result.current.metrics.lastRenderMs).toBe(16);
    });

    it('should not update render time if markRenderStart was not called', () => {
        const { result } = renderHook(() => useEditorMetrics(5, { enableLogging: false }));

        act(() => {
            result.current.markRenderEnd();
        });

        expect(result.current.metrics.lastRenderMs).toBeNull();
    });

    it('should call onMetricsCollected callback after render end', () => {
        const onMetricsCollected = vi.fn();
        const { result } = renderHook(() =>
            useEditorMetrics(5, { onMetricsCollected, enableLogging: false })
        );

        mockPerformance.now.mockReturnValueOnce(1000);
        act(() => {
            result.current.markRenderStart();
        });

        mockPerformance.now.mockReturnValueOnce(1010);
        act(() => {
            result.current.markRenderEnd();
        });

        expect(onMetricsCollected).toHaveBeenCalledTimes(1);
        expect(onMetricsCollected).toHaveBeenCalledWith(
            expect.objectContaining({
                lastRenderMs: 10,
                blockCount: 5,
            })
        );
    });

    it('should mark editor-mount-start on mount', () => {
        renderHook(() => useEditorMetrics(5));

        expect(mockPerformance.mark).toHaveBeenCalledWith('editor-mount-start');
    });

    it('should mark editor-mount-end on unmount', () => {
        const { unmount } = renderHook(() => useEditorMetrics(5));

        unmount();

        expect(mockPerformance.mark).toHaveBeenCalledWith('editor-mount-end');
    });

    it('should return markRenderStart function', () => {
        const { result } = renderHook(() => useEditorMetrics(5));

        expect(typeof result.current.markRenderStart).toBe('function');
    });

    it('should return markRenderEnd function', () => {
        const { result } = renderHook(() => useEditorMetrics(5));

        expect(typeof result.current.markRenderEnd).toBe('function');
    });

    it('should return collectMemory function', () => {
        const { result } = renderHook(() => useEditorMetrics(5));

        expect(typeof result.current.collectMemory).toBe('function');
    });
});
