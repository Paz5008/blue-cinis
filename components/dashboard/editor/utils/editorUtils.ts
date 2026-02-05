/**
 * Editor utility functions for block sanitization and data normalization.
 * 
 * These utilities can be progressively adopted to replace inline functions
 * in Editor.tsx during the refactoring process.
 * 
 * @module components/dashboard/editor/utils/editorUtils
 */

import { normalizeCmsUrl, type NormalizeCmsUrlOptions } from '@/lib/url';

/**
 * Coerce a value to a number, returning undefined if not valid.
 */
export function coerceNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.trim());
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

/**
 * Normalize a value to an integer with optional bounds.
 */
export function normalizeInteger(
    value: unknown,
    opts: { fallback?: number; min?: number; max?: number } = {}
): number | undefined {
    const { fallback, min, max } = opts;
    const num = coerceNumber(value);

    if (num === undefined || !Number.isFinite(num)) {
        return fallback;
    }

    let int = Math.round(num);
    if (!Number.isFinite(int)) {
        return fallback;
    }

    if (min !== undefined && int < min) int = min;
    if (max !== undefined && int > max) int = max;

    return int;
}

/**
 * Set an integer property on an object, using fallback if needed.
 */
export function setInt(
    target: Record<string, unknown>,
    key: string,
    opts: { fallback: number; min?: number; max?: number }
): void {
    if (!(key in target)) {
        target[key] = opts.fallback;
        return;
    }
    const normalized = normalizeInteger(target[key], opts);
    target[key] = normalized ?? opts.fallback;
}

/**
 * Set an optional integer property, removing it if undefined.
 */
export function setOptionalInt(
    target: Record<string, unknown>,
    key: string,
    opts: { fallback?: number; min?: number; max?: number }
): void {
    if (!(key in target)) return;
    const normalized = normalizeInteger(target[key], opts);

    if (normalized === undefined) {
        if (opts.fallback === undefined) {
            delete target[key];
        } else {
            target[key] = opts.fallback;
        }
    } else {
        target[key] = normalized;
    }
}

/**
 * Clean and normalize a URL value.
 */
export function cleanUrl(
    value: unknown,
    options?: NormalizeCmsUrlOptions
): string | undefined {
    return typeof value === 'string'
        ? normalizeCmsUrl(value, {
            allowRelative: true,
            allowData: true,
            allowMailto: true,
            ...(options || {}),
        })
        : undefined;
}

/**
 * Assign a normalized URL to an object property.
 */
export function assignUrl(
    target: Record<string, unknown>,
    key: string,
    options?: NormalizeCmsUrlOptions
): void {
    if (!target || typeof target !== 'object' || !(key in target)) return;

    const safe = cleanUrl(target[key], options);
    if (safe) {
        target[key] = safe;
    } else {
        delete target[key];
    }
}

/**
 * Normalize a pixel value to a string with 'px' suffix.
 */
export function normalizePx(value: unknown, defaultValue = 16): string {
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (Number.isFinite(parsed)) {
            return `${Math.max(0, parsed)}px`;
        }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `${Math.max(0, value)}px`;
    }
    return `${defaultValue}px`;
}

/**
 * Clamp a column count to valid values (1-4).
 */
export function clampColumns(value: unknown, fallback: number): 1 | 2 | 3 | 4 {
    const num = normalizeInteger(value, { fallback, min: 1, max: 4 });
    return (num ?? fallback) as 1 | 2 | 3 | 4;
}

/**
 * Format a date string for display.
 */
export function formatDate(iso?: string): string {
    if (!iso) return '';
    try {
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/**
 * Format a date range for display.
 */
export function formatDateRange(start?: string, end?: string): string {
    if (!start && !end) return '';
    if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
    return formatDate(start || end);
}

/**
 * Parse a timestamp string to a Date.
 */
export function parseTimestamp(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if an element is an editable target (input, textarea, contenteditable).
 */
export function isEditableTarget(element: EventTarget | null): boolean {
    if (!element || !(element instanceof HTMLElement)) return false;
    const tagName = element.tagName.toLowerCase();
    return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        element.isContentEditable
    );
}

/**
 * Generate a unique block ID.
 */
export function generateBlockId(prefix = 'block'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
