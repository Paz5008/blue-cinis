import { Block } from '@/types/cms';

export interface LayoutRect {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Extracts layout rectangle from a block.
 * Handles both pixel and percentage values by assuming a reference width.
 * For sorting purposes, we normalize everything to a relative scale.
 */
function getBlockRect(block: Block): LayoutRect {
    // Default to 0,0 if not set (though robust blocks should have coordinates)
    const x = block.x ?? 0;
    const y = block.y ?? 0;

    // Parse width. If number, use as is. If string with %, parse. 
    // If string with px, parse. Default to full width if unknown.
    let w = 0;
    if (typeof block.width === 'number') {
        w = block.width;
    } else if (typeof block.width === 'string') {
        if (block.width.endsWith('%')) {
            w = parseFloat(block.width);
        } else if (block.width.endsWith('px')) {
            // Treat px as relative unit for sorting if mixed, 
            // but ideally we want consistent units. 
            // For now, let's assume the mock 1200px width for % conversion if needed,
            // but simpler: just parse value.
            w = parseFloat(block.width);
        } else {
            w = 100; // Default fallback
        }
    } else {
        w = 100; // Default fallback
    }

    // Height similar parsing
    let h = 0;
    if (typeof block.height === 'number') {
        h = block.height;
    } else if (typeof block.height === 'string') {
        h = parseFloat(block.height);
    } else {
        h = 50; // Arbitrary non-zero default
    }

    return {
        id: block.id,
        x,
        y,
        w,
        h
    };
}

/**
 * Checks if a horizontal line at y intersects any rect.
 */
function hasHorizontalIntersection(y: number, rects: LayoutRect[]): boolean {
    return rects.some(r => y > r.y && y < r.y + r.h);
}

/**
 * Checks if a vertical line at x intersects any rect.
 */
function hasVerticalIntersection(x: number, rects: LayoutRect[]): boolean {
    return rects.some(r => x > r.x && x < r.x + r.w);
}

/**
 * Recursive XY-Cut Algorithm.
 * 1. Try to cut horizontally (find whitespace gaps Y).
 * 2. If valid cuts found, split into top/bottom groups and recurse.
 * 3. If no horizontal cuts, try vertical cuts (find whitespace gaps X).
 * 4. If valid cuts found, split into left/right groups and recurse.
 * 5. If no cuts possible (atomic group), sort by simple Y then X.
 */
function recursiveXYCut(rects: LayoutRect[]): LayoutRect[] {
    if (rects.length <= 1) return rects;

    // 1. Sort by Y to find horizontal gaps
    const sortedByY = [...rects].sort((a, b) => a.y - b.y);
    const horizontalCuts: number[] = [];

    // Find gaps where a horizontal line can pass through without touching any block
    // A simplified approach: check if the bottom of one block is < top of the next block
    // But we must consider ALL blocks.
    // Scanline approach:
    // Collect all unique top and bottom edges
    // Check intervals between them.

    // Simpler heuristic for "Reading Order":
    // Find clusters.

    // Let's implement true XY Cut logic:
    // Project all blocks onto Y axis.
    // If there is a gap in the projection, we can cut there.
    // Group blocks above and below the gap.

    // Boundaries of current set
    const minY = Math.min(...rects.map(r => r.y));
    const maxY = Math.max(...rects.map(r => r.y + r.h));

    // Find a split point
    let splitY = -1;
    // Iterate through sorted Y edges?
    // We can just iterate through the sorted list and see if there is a gap between current max bottom and next top.

    let currentMaxBottom = sortedByY[0].y + sortedByY[0].h;
    for (let i = 1; i < sortedByY.length; i++) {
        const top = sortedByY[i].y;
        if (top >= currentMaxBottom) {
            // Found a clear gap!
            splitY = top; // Cut at the top edge of the lower block
            break;
        }
        currentMaxBottom = Math.max(currentMaxBottom, sortedByY[i].y + sortedByY[i].h);
    }

    if (splitY !== -1) {
        // We have a horizontal cut. Split into groups.
        const topGroup = rects.filter(r => (r.y + r.h) <= splitY); // Completely above or touching line (logic approx)
        // Actually, strictly: r.y + r.h <= splitY is safe? 
        // Our splitY is exactly at 'top' of next block.
        // So any block whose Y start is >= splitY is in bottom group.
        // Any block whose Y end is <= splitY is in top group.
        // Overlap shouldn't happen if it's a gap.

        const topRects = rects.filter(r => r.y < splitY); // Slightly loose but effective if splitY is top of lower
        const bottomRects = rects.filter(r => r.y >= splitY);

        return [...recursiveXYCut(topRects), ...recursiveXYCut(bottomRects)];
    }

    // 2. No Horizontal Gap? Try Vertical Cut.
    const sortedByX = [...rects].sort((a, b) => a.x - b.x);
    let splitX = -1;
    let currentMaxRight = sortedByX[0].x + sortedByX[0].w;

    for (let i = 1; i < sortedByX.length; i++) {
        const left = sortedByX[i].x;
        if (left >= currentMaxRight) {
            splitX = left;
            break;
        }
        currentMaxRight = Math.max(currentMaxRight, sortedByX[i].x + sortedByX[i].w);
    }

    if (splitX !== -1) {
        const leftRects = rects.filter(r => r.x < splitX);
        const rightRects = rects.filter(r => r.x >= splitX);

        return [...recursiveXYCut(leftRects), ...recursiveXYCut(rightRects)];
    }

    // 3. No cuts possible? Leaf node. 
    // This implies blocks overlap or form a complex inter-locked structure.
    // Fallback: Top-Left sort.
    return sortedByY.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 5) { // Tolerance
            return a.x - b.x;
        }
        return a.y - b.y;
    });
}

/**
 * Main function to sort blocks for mobile reading order.
 */
export function sortBlocksForMobile(blocks: Block[]): Block[] {
    const rects = blocks.map(getBlockRect);
    const sortedRects = recursiveXYCut(rects);

    // Map back to blocks
    const sortedIds = new Set(sortedRects.map(r => r.id));
    const blockMap = new Map(blocks.map(b => [b.id, b]));

    const result: Block[] = [];
    sortedRects.forEach(r => {
        const b = blockMap.get(r.id);
        if (b) result.push(b);
    });

    return result;
}
