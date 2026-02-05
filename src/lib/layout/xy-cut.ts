import type { Block } from '@/types/cms';

/**
 * Normalizes coordinates, treating undefined as 0.
 */
function getCoordinate(val: number | undefined): number {
    return typeof val === 'number' && !isNaN(val) ? val : 0;
}

/**
 * Sorts blocks based on their visual position (reading order).
 * 1. Primary Sort: Y coordinate (Top -> Bottom).
 * 2. Secondary Sort: X coordinate (Left -> Right) if within Y tolerance.
 * 
 * @param blocks Array of blocks to sort
 * @param yTolerance Pixel threshold to consider blocks as being on the same "row" (default: 50)
 * @returns New sorted array of blocks
 */
export function sortBlocksByVisualOrder(blocks: Block[], yTolerance: number = 50): Block[] {
    // Create a shallow copy to sort
    return [...blocks].sort((a, b) => {
        // 1. Get coordinates
        const ay = getCoordinate(a.y);
        const by = getCoordinate(b.y);

        // 2. Check Y difference
        const diffY = ay - by;

        // If they are roughly on the same vertical level (within tolerance)
        if (Math.abs(diffY) < yTolerance) {
            // Sort by X (Left to Right)
            const ax = getCoordinate(a.x);
            const bx = getCoordinate(b.x);
            return ax - bx;
        }

        // Otherwise, sort by Y (Top to Bottom)
        return diffY;
    });
}
