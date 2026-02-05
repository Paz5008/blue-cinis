/**
 * Performance metrics hook for editor monitoring.
 * Tracks TTI, render times, and memory usage.
 *
 * @module hooks/useEditorMetrics
 */
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface EditorMetrics {
    /** Time To Interactive in milliseconds */
    tti: number | null;
    /** Last render duration in milliseconds */
    lastRenderMs: number | null;
    /** Estimated memory usage in MB */
    memoryMB: number | null;
    /** Number of blocks in the editor */
    blockCount: number;
    /** Whether metrics collection is active */
    isCollecting: boolean;
}

export interface UseEditorMetricsOptions {
    /** Whether to log metrics to console (default: false in production) */
    enableLogging?: boolean;
    /** Send metrics to analytics (optional callback) */
    onMetricsCollected?: (metrics: EditorMetrics) => void;
}

/**
 * Hook for collecting editor performance metrics.
 *
 * @param blockCount - Current number of blocks in the editor
 * @param options - Configuration options
 * @returns Metrics state and control methods
 *
 * @example
 * ```tsx
 * const { metrics, markRenderStart, markRenderEnd } = useEditorMetrics(blocks.length);
 *
 * // Mark render performance
 * markRenderStart();
 * // ... render blocks ...
 * markRenderEnd();
 *
 * // Display metrics
 * <div>TTI: {metrics.tti}ms</div>
 * ```
 */
export function useEditorMetrics(
    blockCount: number,
    options: UseEditorMetricsOptions = {}
): {
    metrics: EditorMetrics;
    markRenderStart: () => void;
    markRenderEnd: () => void;
    collectMemory: () => void;
} {
    const { enableLogging = process.env.NODE_ENV !== 'production', onMetricsCollected } = options;

    const [metrics, setMetrics] = useState<EditorMetrics>({
        tti: null,
        lastRenderMs: null,
        memoryMB: null,
        blockCount,
        isCollecting: true,
    });

    const mountTimeRef = useRef<number>(0);
    const renderStartRef = useRef<number>(0);
    const hasLoggedTTI = useRef(false);

    // Mark mount start
    useEffect(() => {
        mountTimeRef.current = performance.now();
        performance.mark('editor-mount-start');

        return () => {
            performance.mark('editor-mount-end');
            try {
                performance.measure('editor-session', 'editor-mount-start', 'editor-mount-end');
            } catch {
                // Marks may have been cleared
            }
        };
    }, []);

    // Calculate TTI after initial render
    useEffect(() => {
        if (hasLoggedTTI.current) return;

        // Use requestIdleCallback for accurate TTI measurement
        const measureTTI = () => {
            const tti = performance.now() - mountTimeRef.current;
            hasLoggedTTI.current = true;

            setMetrics((prev) => ({ ...prev, tti, isCollecting: false }));

            if (enableLogging) {
                console.log(`[EditorMetrics] TTI: ${tti.toFixed(2)}ms`);
            }

            performance.mark('editor-interactive');
        };

        if ('requestIdleCallback' in window) {
            (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(measureTTI);
        } else {
            setTimeout(measureTTI, 0);
        }
    }, [enableLogging]);

    // Update block count
    useEffect(() => {
        setMetrics((prev) => ({ ...prev, blockCount }));
    }, [blockCount]);

    /**
     * Mark the start of a render cycle
     */
    const markRenderStart = useCallback(() => {
        renderStartRef.current = performance.now();
    }, []);

    /**
     * Mark the end of a render cycle and calculate duration
     */
    const markRenderEnd = useCallback(() => {
        if (renderStartRef.current === 0) return;

        const renderMs = performance.now() - renderStartRef.current;
        renderStartRef.current = 0;

        setMetrics((prev) => {
            const updated = { ...prev, lastRenderMs: renderMs };

            if (enableLogging && renderMs > 16) {
                console.warn(`[EditorMetrics] Slow render: ${renderMs.toFixed(2)}ms (target: <16ms)`);
            }

            onMetricsCollected?.(updated);
            return updated;
        });
    }, [enableLogging, onMetricsCollected]);

    /**
     * Collect memory usage (if available)
     */
    const collectMemory = useCallback(() => {
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
            const memoryMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
            setMetrics((prev) => ({ ...prev, memoryMB }));

            if (enableLogging) {
                console.log(`[EditorMetrics] Memory: ${memoryMB}MB`);
            }
        }
    }, [enableLogging]);

    return {
        metrics,
        markRenderStart,
        markRenderEnd,
        collectMemory,
    };
}

export default useEditorMetrics;
