/**
 * Hook for auto-saving editor content with debouncing and retry logic.
 *
 * Features:
 * - Configurable debounce delay (default 8s)
 * - Automatic retry with backoff (max 3 attempts)
 * - UI feedback via toast notifications
 * - Flush method for immediate save
 * - Status tracking (isSaving, lastSaved)
 *
 * @module hooks/useAutoSave
 */
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Dynamic toast import to avoid vitest resolution issues
let toastModule: typeof import('sonner') | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    toastModule = require('sonner');
} catch {
    // In test environment or if sonner not available
}

const showToast = {
    success: (message: string, options?: object) => toastModule?.toast.success(message, options),
    warning: (message: string, options?: object) => toastModule?.toast.warning(message, options),
    error: (message: string, options?: object) => toastModule?.toast.error(message, options),
};

export interface UseAutoSaveOptions {
    /** Debounce delay in milliseconds before triggering save (default: 8000) */
    debounceMs?: number;
    /** Maximum number of retry attempts on failure (default: 3) */
    maxRetries?: number;
    /** Async function to perform the save operation */
    onSave: () => Promise<void>;
    /** Whether auto-save is enabled (default: true) */
    enabled?: boolean;
    /** Whether to show toast notifications (default: true) */
    showToasts?: boolean;
}

export interface UseAutoSaveReturn {
    /** Trigger a debounced save. Call this when content changes. */
    trigger: () => void;
    /** Flush pending save immediately (bypasses debounce). */
    flush: () => Promise<void>;
    /** Cancel any pending save. */
    cancel: () => void;
    /** Whether a save is currently in progress. */
    isSaving: boolean;
    /** Timestamp of the last successful save. */
    lastSaved: Date | null;
    /** Number of pending changes not yet saved. */
    pendingChanges: boolean;
}

/**
 * Auto-save hook with debouncing, retry logic, and UI feedback.
 *
 * @param options - Configuration options
 * @returns Control methods and status
 *
 * @example
 * ```tsx
 * const { trigger, flush, isSaving, lastSaved } = useAutoSave({
 *   onSave: async () => {
 *     await saveArtistPageLayout(blocks);
 *   },
 *   debounceMs: 5000,
 * });
 *
 * // Call trigger() whenever content changes
 * const handleBlockUpdate = (block: Block) => {
 *   updateBlock(block);
 *   trigger();
 * };
 *
 * // Call flush() before navigation/unmount
 * useEffect(() => {
 *   return () => { flush(); };
 * }, [flush]);
 * ```
 */
export function useAutoSave({
    debounceMs = 8000,
    maxRetries = 3,
    onSave,
    enabled = true,
    showToasts = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [pendingChanges, setPendingChanges] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout>();
    const retryCountRef = useRef(0);
    const onSaveRef = useRef(onSave);

    // Keep onSave ref updated to avoid stale closures
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    /**
     * Perform the actual save with retry logic
     */
    const save = useCallback(async () => {
        if (!enabled) return;

        setIsSaving(true);
        setPendingChanges(false);

        try {
            await onSaveRef.current();
            setLastSaved(new Date());
            retryCountRef.current = 0;

            if (showToasts) {
                showToast.success('Modifications enregistrées', {
                    duration: 2000,
                    id: 'auto-save-success',
                });
            }
        } catch (error) {
            retryCountRef.current++;

            if (retryCountRef.current < maxRetries) {
                // Schedule retry with exponential backoff
                const backoffMs = 2000 * Math.pow(2, retryCountRef.current - 1);

                if (showToasts) {
                    showToast.warning(
                        `Erreur de sauvegarde, nouvelle tentative (${retryCountRef.current}/${maxRetries})`,
                        {
                            duration: 3000,
                            id: 'auto-save-retry',
                        }
                    );
                }

                timeoutRef.current = setTimeout(save, backoffMs);
            } else {
                // Max retries exceeded
                if (showToasts) {
                    showToast.error('Échec de la sauvegarde après plusieurs tentatives', {
                        duration: 5000,
                        id: 'auto-save-failed',
                    });
                }

                console.error('[useAutoSave] Save failed after retries:', error);
                setPendingChanges(true);
            }
        } finally {
            setIsSaving(false);
        }
    }, [enabled, maxRetries, showToasts]);

    /**
     * Trigger a debounced save
     */
    const trigger = useCallback(() => {
        if (!enabled) return;

        setPendingChanges(true);

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Reset retry count on new trigger
        retryCountRef.current = 0;

        // Schedule save after debounce delay
        timeoutRef.current = setTimeout(save, debounceMs);
    }, [save, debounceMs, enabled]);

    /**
     * Flush: save immediately, bypassing debounce
     */
    const flush = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (pendingChanges || isSaving) {
            await save();
        }
    }, [save, pendingChanges, isSaving]);

    /**
     * Cancel any pending save
     */
    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
        setPendingChanges(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Warn user about unsaved changes before leaving
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (pendingChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [pendingChanges]);

    return {
        trigger,
        flush,
        cancel,
        isSaving,
        lastSaved,
        pendingChanges,
    };
}

export default useAutoSave;
