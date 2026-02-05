// Type declarations for sonner toast library
// This file provides type safety for dynamic import in useAutoSave.ts

declare module 'sonner' {
    export interface ToastOptions {
        duration?: number;
        id?: string;
        action?: {
            label: string;
            onClick: () => void;
        };
    }

    export const toast: {
        success: (message: string, options?: ToastOptions) => void;
        warning: (message: string, options?: ToastOptions) => void;
        error: (message: string, options?: ToastOptions) => void;
        info: (message: string, options?: ToastOptions) => void;
        loading: (message: string, options?: ToastOptions) => void;
        dismiss: (id?: string) => void;
    };

    export function Toaster(props?: Record<string, unknown>): JSX.Element;
}
