import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    validateBlock,
    validateBlocks,
    validateBlockWithDetails,
    isValidBlockType,
    getSchemaForType,
    BlockSchema,
} from '@/lib/cms/blockValidation';

describe('blockValidation', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('isValidBlockType', () => {
        it('returns true for valid block types', () => {
            expect(isValidBlockType('text')).toBe(true);
            expect(isValidBlockType('image')).toBe(true);
            expect(isValidBlockType('gallery')).toBe(true);
            expect(isValidBlockType('contactForm')).toBe(true);
        });

        it('returns false for invalid block types', () => {
            expect(isValidBlockType('invalid')).toBe(false);
            expect(isValidBlockType('')).toBe(false);
            expect(isValidBlockType('TEXT')).toBe(false);
        });
    });

    describe('validateBlock', () => {
        describe('TextBlock', () => {
            it('validates a valid text block', () => {
                const block = {
                    id: 'text-1',
                    type: 'text',
                    content: 'Hello World',
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.type).toBe('text');
            });

            it('validates text block with all optional fields', () => {
                const block = {
                    id: 'text-2',
                    type: 'text',
                    content: 'Styled text',
                    alignment: 'center',
                    fontSize: '16px',
                    color: '#333333',
                    lineHeight: '1.5',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.alignment).toBe('center');
            });

            it('rejects text block without content', () => {
                const block = { id: 'text-3', type: 'text' };
                const result = validateBlock(block);
                expect(result).toBeNull();
            });
        });

        describe('ImageBlock', () => {
            it('validates a valid image block', () => {
                const block = {
                    id: 'img-1',
                    type: 'image',
                    src: '/path/to/image.jpg',
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.type).toBe('image');
            });

            it('validates image block with accessibility fields', () => {
                const block = {
                    id: 'img-2',
                    type: 'image',
                    src: '/image.jpg',
                    altText: 'Description of image',
                    caption: 'Image caption',
                    decorative: false,
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.altText).toBe('Description of image');
            });
        });

        describe('GalleryBlock', () => {
            it('validates gallery with images array', () => {
                const block = {
                    id: 'gallery-1',
                    type: 'gallery',
                    images: [
                        { id: 'g1', src: '/img1.jpg' },
                        { id: 'g2', src: '/img2.jpg', altText: 'Alt text' },
                    ],
                    layout: 'grid',
                    columns: 3,
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.images).toHaveLength(2);
            });

            it('validates empty gallery', () => {
                const block = {
                    id: 'gallery-2',
                    type: 'gallery',
                    images: [],
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
            });
        });

        describe('ButtonBlock', () => {
            it('validates button with variant', () => {
                const block = {
                    id: 'btn-1',
                    type: 'button',
                    label: 'Click me',
                    variant: 'outline',
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.variant).toBe('outline');
            });

            it('rejects button without label', () => {
                const block = { id: 'btn-2', type: 'button' };
                const result = validateBlock(block);
                expect(result).toBeNull();
            });
        });

        describe('ColumnBlock (recursive)', () => {
            it('validates columns with nested blocks', () => {
                const block = {
                    id: 'col-1',
                    type: 'columns',
                    count: 2,
                    columns: [
                        [{ id: 'text-nested', type: 'text', content: 'Left column' }],
                        [{ id: 'img-nested', type: 'image', src: '/right.jpg' }],
                    ],
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.columns).toHaveLength(2);
            });
        });

        describe('Base block properties', () => {
            it('validates x and y positioning', () => {
                const block = {
                    id: 'pos-1',
                    type: 'text',
                    content: 'Positioned',
                    x: 50,
                    y: 200,
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.x).toBe(50);
            });

            it('validates visibility flags', () => {
                const block = {
                    id: 'vis-1',
                    type: 'divider',
                    showOnDesktop: true,
                    showOnMobile: false,
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.showOnMobile).toBe(false);
            });

            it('validates style object', () => {
                const block = {
                    id: 'styled-1',
                    type: 'divider',
                    style: {
                        marginTop: '20px',
                        backgroundColor: '#f0f0f0',
                    },
                };
                const result = validateBlock(block);
                expect(result).not.toBeNull();
                expect(result?.style?.marginTop).toBe('20px');
            });
        });

        describe('edge cases', () => {
            it('rejects block without id', () => {
                const block = { type: 'text', content: 'No ID' };
                const result = validateBlock(block);
                expect(result).toBeNull();
            });

            it('rejects block with empty id', () => {
                const block = { id: '', type: 'text', content: 'Empty ID' };
                const result = validateBlock(block);
                expect(result).toBeNull();
            });

            it('rejects unknown block type', () => {
                const block = { id: '1', type: 'unknown', content: 'test' };
                const result = validateBlock(block);
                expect(result).toBeNull();
            });
        });
    });

    describe('validateBlocks', () => {
        it('validates array of mixed blocks', () => {
            const blocks = [
                { id: '1', type: 'text', content: 'Text' },
                { id: '2', type: 'image', src: '/img.jpg' },
                { id: '3', type: 'divider' },
            ];
            const result = validateBlocks(blocks);
            expect(result).toHaveLength(3);
        });

        it('filters out invalid blocks', () => {
            const blocks = [
                { id: '1', type: 'text', content: 'Valid' },
                { id: '2', type: 'text' }, // Invalid - no content
                { id: '3', type: 'image', src: '/img.jpg' },
            ];
            const result = validateBlocks(blocks);
            expect(result).toHaveLength(2);
        });

        it('returns empty array for non-array input', () => {
            const result = validateBlocks('not an array' as any);
            expect(result).toEqual([]);
        });

        it('returns empty array for empty input', () => {
            const result = validateBlocks([]);
            expect(result).toEqual([]);
        });
    });

    describe('validateBlockWithDetails', () => {
        it('returns success true for valid block', () => {
            const block = { id: '1', type: 'divider' };
            const result = validateBlockWithDetails(block);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.errors).toBeUndefined();
        });

        it('returns success false with errors for invalid block', () => {
            const block = { id: '', type: 'text' };
            const result = validateBlockWithDetails(block);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
        });
    });

    describe('getSchemaForType', () => {
        it('returns schema for valid type', () => {
            const schema = getSchemaForType('text');
            expect(schema).not.toBeNull();
        });

        it('returns null for invalid type', () => {
            const schema = getSchemaForType('invalid' as any);
            expect(schema).toBeNull();
        });
    });

    describe('ContactFormBlock', () => {
        it('validates contactForm with variant', () => {
            const block = {
                id: 'cf-1',
                type: 'contactForm',
                variant: 'minimal',
                submitLabel: 'Envoyer',
                showSubject: true,
            };
            const result = validateBlock(block);
            expect(result).not.toBeNull();
            expect(result?.variant).toBe('minimal');
        });
    });

    describe('EventListBlock', () => {
        it('validates eventList with events', () => {
            const block = {
                id: 'ev-1',
                type: 'eventList',
                events: [
                    { id: 'e1', title: 'Exposition' },
                    { id: 'e2', title: 'Vernissage', startDate: '2026-01-15' },
                ],
                layout: 'timeline',
            };
            const result = validateBlock(block);
            expect(result).not.toBeNull();
            expect(result?.events).toHaveLength(2);
        });
    });
});
