/**
 * Tests for useBeforeUnload hook.
 *
 * @module test/hooks.useBeforeUnload.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBeforeUnload } from '@/components/dashboard/editor/hooks/useBeforeUnload';

describe('useBeforeUnload', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    describe('event listener management', () => {
        it('should add beforeunload event listener', () => {
            renderHook(() => useBeforeUnload(false));

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'beforeunload',
                expect.any(Function)
            );
        });

        it('should remove beforeunload event listener on unmount', () => {
            const { unmount } = renderHook(() => useBeforeUnload(false));

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'beforeunload',
                expect.any(Function)
            );
        });
    });

    describe('isDirty behavior', () => {
        it('should not prevent unload when isDirty is false', () => {
            renderHook(() => useBeforeUnload(false));

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'beforeunload'
            )?.[1] as EventListener;

            const mockEvent = {
                preventDefault: vi.fn(),
                returnValue: '',
            } as unknown as BeforeUnloadEvent;

            const result = handler(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        it('should prevent unload when isDirty is true', () => {
            renderHook(() => useBeforeUnload(true));

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'beforeunload'
            )?.[1] as EventListener;

            const mockEvent = {
                preventDefault: vi.fn(),
                returnValue: '',
            } as unknown as BeforeUnloadEvent;

            const result = handler(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should update handler when isDirty changes', () => {
            const { rerender } = renderHook(({ dirty }) => useBeforeUnload(dirty), {
                initialProps: { dirty: false },
            });

            // First listener for dirty=false
            expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

            rerender({ dirty: true });

            // Should have removed old and added new
            expect(removeEventListenerSpy).toHaveBeenCalled();
            expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('custom message', () => {
        it('should use default message when not provided', () => {
            renderHook(() => useBeforeUnload(true));

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'beforeunload'
            )?.[1] as EventListener;

            const mockEvent = {
                preventDefault: vi.fn(),
                returnValue: '',
            } as unknown as BeforeUnloadEvent;

            const result = handler(mockEvent) as string;

            expect(result).toContain('modifications non sauvegardées');
        });

        it('should use custom message when provided', () => {
            const customMessage = 'Custom unsaved changes warning';
            renderHook(() => useBeforeUnload(true, customMessage));

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'beforeunload'
            )?.[1] as EventListener;

            const mockEvent = {
                preventDefault: vi.fn(),
                returnValue: '',
            } as unknown as BeforeUnloadEvent;

            const result = handler(mockEvent) as string;

            expect(result).toBe(customMessage);
        });
    });
});
