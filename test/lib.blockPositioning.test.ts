import { describe, it, expect } from 'vitest';
import {
    EDITOR_CANVAS_WIDTH,
    getBlockPositionStyle,
    calculateContentWidth,
    calculateContentHeight,
} from '@/lib/cms/blockPositioning';
import type { Block } from '@/types/cms';

// Helper to create minimal blocks for testing
function createBlock(overrides: Partial<Block> = {}): Block {
    return {
        id: overrides.id ?? `block-${Math.random().toString(36).slice(2)}`,
        type: overrides.type ?? 'text',
        style: {},
        showOnDesktop: true,
        showOnMobile: true,
        ...overrides,
    } as Block;
}

describe('blockPositioning', () => {
    describe('EDITOR_CANVAS_WIDTH', () => {
        it('should be 1200px', () => {
            expect(EDITOR_CANVAS_WIDTH).toBe(1200);
        });

        it('should be a positive integer', () => {
            expect(Number.isInteger(EDITOR_CANVAS_WIDTH)).toBe(true);
            expect(EDITOR_CANVAS_WIDTH).toBeGreaterThan(0);
        });
    });

    describe('getBlockPositionStyle', () => {
        it('returns empty object when positioning disabled', () => {
            const block = createBlock({ x: 50, y: 100 });
            const result = getBlockPositionStyle(block, false);
            expect(result).toEqual({});
        });

        it('returns empty object when block has no position data', () => {
            const block = createBlock({});
            const result = getBlockPositionStyle(block, true);
            expect(result).toEqual({});
        });

        it('converts x=0% to left: 0px', () => {
            const block = createBlock({ x: 0, y: 100 });
            const style = getBlockPositionStyle(block, true);
            expect(style.left).toBe('0px');
        });

        it('uses x directly as pixels (x=50 → left: 50px)', () => {
            const block = createBlock({ x: 50, y: 100 });
            const style = getBlockPositionStyle(block, true);
            expect(style.left).toBe('50px');
        });

        it('uses x directly as pixels (x=100 → left: 100px)', () => {
            const block = createBlock({ x: 100, y: 0 });
            const style = getBlockPositionStyle(block, true);
            expect(style.left).toBe('100px');
        });

        it('handles fractional x values', () => {
            const block = createBlock({ x: 33.33, y: 0 });
            const style = getBlockPositionStyle(block, true);
            // x is now used directly as pixels
            expect(style.left).toBe('33.33px');
        });

        it('sets y position directly in pixels', () => {
            const block = createBlock({ x: 0, y: 250 });
            const style = getBlockPositionStyle(block, true);
            expect(style.top).toBe('250px');
        });

        it('applies rotation transform', () => {
            const block = createBlock({ x: 50, y: 100, rotation: 45 });
            const style = getBlockPositionStyle(block, true);
            expect(style.transform).toBe('rotate(45deg)');
        });

        it('applies negative rotation', () => {
            const block = createBlock({ x: 50, y: 100, rotation: -15 });
            const style = getBlockPositionStyle(block, true);
            expect(style.transform).toBe('rotate(-15deg)');
        });

        it('omits transform when rotation is 0', () => {
            const block = createBlock({ x: 50, y: 100, rotation: 0 });
            const style = getBlockPositionStyle(block, true);
            expect(style.transform).toBeUndefined();
        });

        it('applies zIndex', () => {
            const block = createBlock({ x: 50, y: 100, zIndex: 10 });
            const style = getBlockPositionStyle(block, true);
            expect(style.zIndex).toBe(10);
        });

        it('defaults zIndex to 0 when not specified', () => {
            const block = createBlock({ x: 50, y: 100 });
            const style = getBlockPositionStyle(block, true);
            expect(style.zIndex).toBe(0);
        });

        it('applies width when specified as number', () => {
            const block = createBlock({ x: 50, y: 100, width: 300 });
            const style = getBlockPositionStyle(block, true);
            expect(style.width).toBe(300);
        });

        it('applies width when specified as string', () => {
            const block = createBlock({ x: 50, y: 100, width: '50%' });
            const style = getBlockPositionStyle(block, true);
            expect(style.width).toBe('50%');
        });

        it('defaults width to auto when not specified', () => {
            const block = createBlock({ x: 50, y: 100 });
            const style = getBlockPositionStyle(block, true);
            expect(style.width).toBe('auto');
        });

        it('sets position to absolute', () => {
            const block = createBlock({ x: 50, y: 100 });
            const style = getBlockPositionStyle(block, true);
            expect(style.position).toBe('absolute');
        });
    });

    describe('calculateContentWidth', () => {
        it('returns canvas width when no blocks', () => {
            const result = calculateContentWidth([], true);
            expect(result).toBe(EDITOR_CANVAS_WIDTH);
        });

        it('returns canvas width when positioning disabled', () => {
            const blocks = [createBlock({ x: 90, width: 500 })];
            const result = calculateContentWidth(blocks, false);
            expect(result).toBe(EDITOR_CANVAS_WIDTH);
        });

        it('returns canvas width when blocks have no x position', () => {
            const blocks = [createBlock({ width: 500 })];
            const result = calculateContentWidth(blocks, true);
            expect(result).toBe(EDITOR_CANVAS_WIDTH);
        });

        it('calculates width based on rightmost block edge (number width)', () => {
            // x=80% = 960px, + 200px width = 1160px
            const blocks = [createBlock({ x: 80, width: 200 })];
            const result = calculateContentWidth(blocks, true);
            expect(result).toBe(EDITOR_CANVAS_WIDTH); // 1160 < 1200, so returns canvas width
        });

        it('returns larger width when block extends beyond canvas', () => {
            // x=1080px + 300px width = 1380px
            const blocks = [createBlock({ x: 1080, width: 300 })];
            const result = calculateContentWidth(blocks, true);
            expect(result).toBe(1380);
        });

        it('handles width as px string', () => {
            // x=960px + 400px width = 1360px
            const blocks = [createBlock({ x: 960, width: '400px' })];
            const result = calculateContentWidth(blocks, true);
            expect(result).toBe(1360);
        });

        it('handles width as percentage string', () => {
            // x=50% = 600px, width=50% of 1200 = 600px, right edge = 1200px
            const blocks = [createBlock({ x: 50, width: '50%' })];
            const result = calculateContentWidth(blocks, true);
            expect(result).toBe(EDITOR_CANVAS_WIDTH);
        });

        it('finds the rightmost block among multiple blocks', () => {
            const blocks = [
                createBlock({ x: 120, width: 100 }), // 120 + 100 = 220
                createBlock({ x: 960, width: 300 }), // 960 + 300 = 1260
                createBlock({ x: 600, width: 200 }), // 600 + 200 = 800
            ];
            const result = calculateContentWidth(blocks, true);
            expect(result).toBe(1260);
        });

        it('handles null blocks array gracefully', () => {
            const result = calculateContentWidth(null as any, true);
            expect(result).toBe(EDITOR_CANVAS_WIDTH);
        });
    });

    describe('calculateContentHeight', () => {
        it('returns 0 when no blocks', () => {
            const result = calculateContentHeight([], true);
            expect(result).toBe(0);
        });

        it('returns 0 when positioning disabled', () => {
            const blocks = [createBlock({ y: 500, height: 200 })];
            const result = calculateContentHeight(blocks, false);
            expect(result).toBe(0);
        });

        it('uses default height (300px) when height not specified', () => {
            const blocks = [createBlock({ x: 0, y: 100 })];
            const result = calculateContentHeight(blocks, true);
            // y=100 + 300 (default) + 150 (padding) = 550
            expect(result).toBe(550);
        });

        it('handles height as number', () => {
            const blocks = [createBlock({ x: 0, y: 100, height: 200 })];
            const result = calculateContentHeight(blocks, true);
            // y=100 + 200 + 150 (padding) = 450
            expect(result).toBe(450);
        });

        it('handles height as px string', () => {
            const blocks = [createBlock({ x: 0, y: 100, height: '150px' })];
            const result = calculateContentHeight(blocks, true);
            // y=100 + 150 + 150 (padding) = 400
            expect(result).toBe(400);
        });

        it('finds the tallest block among multiple blocks', () => {
            const blocks = [
                createBlock({ x: 0, y: 50, height: 100 }),   // 50 + 100 = 150
                createBlock({ x: 0, y: 300, height: 200 }),  // 300 + 200 = 500
                createBlock({ x: 0, y: 100, height: 150 }),  // 100 + 150 = 250
            ];
            const result = calculateContentHeight(blocks, true);
            // max=500 + 150 (padding) = 650
            expect(result).toBe(650);
        });

        it('adds 150px padding to the result', () => {
            const blocks = [createBlock({ x: 0, y: 0, height: 100 })];
            const result = calculateContentHeight(blocks, true);
            // 0 + 100 + 150 = 250
            expect(result).toBe(250);
        });

        it('uses custom default height when provided', () => {
            const blocks = [createBlock({ x: 0, y: 100 })];
            const result = calculateContentHeight(blocks, true, 400);
            // y=100 + 400 (custom default) + 150 (padding) = 650
            expect(result).toBe(650);
        });

        it('handles block with y=0', () => {
            const blocks = [createBlock({ x: 0, y: 0, height: 300 })];
            const result = calculateContentHeight(blocks, true);
            // 0 + 300 + 150 = 450
            expect(result).toBe(450);
        });

        it('handles null blocks array gracefully', () => {
            const result = calculateContentHeight(null as any, true);
            expect(result).toBe(0);
        });
    });
});
