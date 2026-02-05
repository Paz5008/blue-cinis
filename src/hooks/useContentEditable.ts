import { useRef, useEffect, useCallback } from 'react';
import sanitizeHtml from 'sanitize-html';

interface UseContentEditableOptions {
    initialContent: string;
    onUpdate: (content: string) => void;
    sanitizeOptions?: any;
    tagName?: string;
}

export function useContentEditable({
    initialContent,
    onUpdate,
    sanitizeOptions,
}: UseContentEditableOptions) {
    const ref = useRef<HTMLElement>(null);
    const isFocused = useRef(false);

    // Default sanitization options if none provided
    const defaultSanitizeOptions: any = {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br'],
        allowedAttributes: {
            'a': ['href', 'target']
        }
    };

    const mergedOptions = sanitizeOptions || defaultSanitizeOptions;

    const sanitize = useCallback((html: string) => {
        return sanitizeHtml(html || '', mergedOptions);
    }, [mergedOptions]);

    const handleInput = useCallback(() => {
        if (!ref.current) return;
        const raw = ref.current.innerHTML;
        // We do typically NOT sanitize immediately on input for UX reasons (cursor jumps),
        // but we might want to sanitize before sending update.
        // However, if we want strict control, we sanitize.
        // For smoother typing, we usually debounce or sanitize on blur.
        // Here we pass raw content to update, parent decides when to persist/sanitize fully,
        // OR we sanitize here. 
        // Let's sanitize lightly here to keep safe but avoiding aggressive stripping while typing.
        // Actually, best practice: trust input while typing, sanitize on sync/blur.

        // But for this hook, let's just pass the content.
        // The parent (BlockRenderer) had logic to sanitize.

        const clean = sanitize(raw);
        if (clean !== raw) {
            // If we replace innerHTML here, cursor jumps.
            // So we only update parent state.
        }
        onUpdate(clean);
    }, [onUpdate, sanitize]);

    const handleBlur = useCallback(() => {
        if (!ref.current) return;
        isFocused.current = false;
        const raw = ref.current.innerHTML;
        const clean = sanitize(raw);
        if (ref.current.innerHTML !== clean) {
            ref.current.innerHTML = clean;
        }
    }, [sanitize]);

    const handleFocus = useCallback(() => {
        isFocused.current = true;
    }, []);

    // Sync from props only if not focused to avoid fighting user
    useEffect(() => {
        if (ref.current && !isFocused.current && initialContent !== ref.current.innerHTML) {
            ref.current.innerHTML = sanitize(initialContent);
        }
    }, [initialContent, sanitize]);

    return {
        ref,
        handleInput,
        handleBlur,
        handleFocus,
        sanitize
    };
}
