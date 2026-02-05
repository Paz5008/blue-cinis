import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/components/dashboard/editor/hooks/useAutoSave';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
    },
}));

describe('useAutoSave', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should not save immediately on trigger (debounce)', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 5000, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(result.current.pendingChanges).toBe(true);
    });

    it('should save after debounce delay', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 3000, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        // Advance time but not enough
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        expect(onSave).not.toHaveBeenCalled();

        // Advance past debounce
        await act(async () => {
            vi.advanceTimersByTime(1500);
        });
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on multiple triggers', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 3000, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        // Trigger again - should reset timer
        act(() => {
            result.current.trigger();
        });

        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        expect(onSave).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(1500);
        });
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should flush immediately bypassing debounce', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 5000, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        await act(async () => {
            await result.current.flush();
        });

        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending save', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 3000, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        act(() => {
            result.current.cancel();
        });

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(result.current.pendingChanges).toBe(false);
    });

    it('should set isSaving during save', async () => {
        let resolveSave: () => void = () => { };
        const onSave = vi.fn().mockImplementation(() => {
            return new Promise<void>((resolve) => {
                resolveSave = resolve;
            });
        });

        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 100, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        await act(async () => {
            vi.advanceTimersByTime(150);
        });

        expect(result.current.isSaving).toBe(true);

        await act(async () => {
            resolveSave();
        });

        expect(result.current.isSaving).toBe(false);
    });

    it('should update lastSaved on success', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 100, showToasts: false })
        );

        expect(result.current.lastSaved).toBeNull();

        act(() => {
            result.current.trigger();
        });

        await act(async () => {
            vi.advanceTimersByTime(150);
        });

        expect(result.current.lastSaved).not.toBeNull();
    });

    it('should not save when disabled', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 100, enabled: false, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        await act(async () => {
            vi.advanceTimersByTime(200);
        });

        expect(onSave).not.toHaveBeenCalled();
    });

    it('should retry on failure with backoff', async () => {
        const onSave = vi
            .fn()
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValue(undefined);

        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 100, maxRetries: 3, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        // Initial save attempt
        await act(async () => {
            vi.advanceTimersByTime(200);
        });
        expect(onSave).toHaveBeenCalledTimes(1);

        // First retry (2s backoff)
        await act(async () => {
            vi.advanceTimersByTime(2100);
        });
        expect(onSave).toHaveBeenCalledTimes(2);

        // Second retry (4s backoff)
        await act(async () => {
            vi.advanceTimersByTime(4100);
        });
        expect(onSave).toHaveBeenCalledTimes(3);
    });

    it('should set pendingChanges on max retries exceeded', async () => {
        const onSave = vi.fn().mockRejectedValue(new Error('Always fails'));
        const { result } = renderHook(() =>
            useAutoSave({ onSave, debounceMs: 100, maxRetries: 2, showToasts: false })
        );

        act(() => {
            result.current.trigger();
        });

        // Initial + 2 retries
        await act(async () => {
            vi.advanceTimersByTime(100);
        });
        await act(async () => {
            vi.advanceTimersByTime(2100);
        });

        expect(onSave).toHaveBeenCalledTimes(2);
        expect(result.current.pendingChanges).toBe(true);
    });
});
