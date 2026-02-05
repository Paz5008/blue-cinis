import { sortBlocksByVisualOrder } from '@/lib/layout/xy-cut';
import { Block } from '@/types/cms';

console.log('--- Verifying XY Cut Sorting ---');

// Mock blocks helper
const makeBlock = (id: string, x?: number, y?: number): Block => ({
    id,
    type: 'text',
    x,
    y,
} as Block);

// 1. Vertical Stack
const vertical = [
    makeBlock('b', 0, 200),
    makeBlock('a', 0, 100),
    makeBlock('c', 0, 300),
];
const sortedVertical = sortBlocksByVisualOrder(vertical);
console.log('Vertical Sort (should be a, b, c):', sortedVertical.map(b => b.id).join(', '));
if (sortedVertical[0].id === 'a' && sortedVertical[2].id === 'c') console.log('✅ Vertical pass'); else console.error('❌ Vertical fail');

// 2. Horizontal Row (Same Y)
const horizontal = [
    makeBlock('2', 200, 100),
    makeBlock('1', 50, 100),
    makeBlock('3', 400, 100),
];
const sortedHorizontal = sortBlocksByVisualOrder(horizontal);
console.log('Horizontal Sort (should be 1, 2, 3):', sortedHorizontal.map(b => b.id).join(', '));
if (sortedHorizontal[0].id === '1' && sortedHorizontal[2].id === '3') console.log('✅ Horizontal pass'); else console.error('❌ Horizontal fail');

// 3. Tolerance Test
// A (0, 100)
// B (100, 120) -> Should be same row as A because |100-120| < 50
// C (0, 200) -> Next row
const toleranceBlocks = [
    makeBlock('c', 0, 200),
    makeBlock('b', 100, 120),
    makeBlock('a', 0, 100),
];
const sortedTolerance = sortBlocksByVisualOrder(toleranceBlocks, 50);
console.log('Tolerance Sort (should be a, b, c):', sortedTolerance.map(b => b.id).join(', '));
// Expected: A (y=100) comes before B (y=120) if strictly Y, BUT diff is 20 < 50.
// So they are "same row". Then sort by X. A(x=0) < B(x=100). So A, then B.
// C (y=200) is diff 100 > 50 from A. So C is last.
if (sortedTolerance[0].id === 'a' && sortedTolerance[1].id === 'b' && sortedTolerance[2].id === 'c') console.log('✅ Tolerance pass'); else console.error('❌ Tolerance fail');

// 4. Inverted X in same row check
// D (200, 100)
// E (0, 110)
// Should be E, D because E is left of D, even though E is slightly lower.
const invertedX = [
    makeBlock('d', 200, 100),
    makeBlock('e', 0, 110),
];
const sortedInverted = sortBlocksByVisualOrder(invertedX, 50);
console.log('Inverted X Sort (should be e, d):', sortedInverted.map(b => b.id).join(', '));
if (sortedInverted[0].id === 'e') console.log('✅ Inverted X pass'); else console.error('❌ Inverted X fail');

console.log('--- Verification Complete ---');
