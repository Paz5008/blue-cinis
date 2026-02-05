
import { Block } from '@/types/cms';

/**
 * Sorts blocks for mobile display based on their Desktop Y/X coordinates.
 * This guarantees a logical flow (Top-Down, Left-Right) even if the blocks are unordered in the array.
 * Note: This function returns a sorted COPY of the array.
 */
export function sortBlocksForMobile(blocks: Block[]): Block[] {
    return [...blocks].sort((a, b) => {
        // 1. Get Desktop Y position (fallback to 0)
        const yA = a.y ?? 0;
        const yB = b.y ?? 0;

        // 2. Sorting Logic
        // Primary: Vertical position
        // We use a small threshold (e.g., 5px) to consider elements "on the same line" but generally strict Y is safer for simple stacking.
        if (Math.abs(yA - yB) > 5) {
            return yA - yB;
        }

        // Secondary: Horizontal position (Left to Right)
        const xA = a.x ?? 0;
        const xB = b.x ?? 0;
        return xA - xB;
    });
}
