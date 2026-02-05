import { describe, it, expect } from 'vitest';
import {
    STYLE_FIELD_SCHEMAS,
    ALLOWED_STYLE_KEYS,
    sanitizeStyleObject,
    sanitizeBlockStylesDeep,
    composeBlockStyle,
    composeWrapperStyle,
    resolveMeasurement,
} from '../src/lib/cms/style';
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

describe('style', () => {
    describe('STYLE_FIELD_SCHEMAS', () => {
        it('should contain margin properties', () => {
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('margin');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('marginTop');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('marginBottom');
        });

        it('should contain background properties', () => {
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('backgroundColor');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('backgroundImage');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('overlayColor');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('overlayOpacity');
        });

        it('should contain gradient properties', () => {
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('gradientFrom');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('gradientTo');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('gradientDirection');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('gradientType');
        });

        it('should contain typography properties', () => {
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('fontFamily');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('fontSize');
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('lineHeight');
        });

        it('should contain canvasAlign enum', () => {
            expect(STYLE_FIELD_SCHEMAS).toHaveProperty('canvasAlign');
        });
    });

    describe('ALLOWED_STYLE_KEYS', () => {
        it('should be a Set', () => {
            expect(ALLOWED_STYLE_KEYS).toBeInstanceOf(Set);
        });

        it('should contain all keys from STYLE_FIELD_SCHEMAS', () => {
            const schemaKeys = Object.keys(STYLE_FIELD_SCHEMAS);
            schemaKeys.forEach(key => {
                expect(ALLOWED_STYLE_KEYS.has(key)).toBe(true);
            });
        });
    });

    describe('sanitizeStyleObject', () => {
        it('returns empty object for null input', () => {
            expect(sanitizeStyleObject(null)).toEqual({});
        });

        it('returns empty object for non-object input', () => {
            expect(sanitizeStyleObject('string')).toEqual({});
            expect(sanitizeStyleObject(123)).toEqual({});
        });

        it('keeps valid string properties', () => {
            const result = sanitizeStyleObject({ marginTop: '10px' });
            expect(result.marginTop).toBe('10px');
        });

        it('keeps valid number properties', () => {
            const result = sanitizeStyleObject({ overlayOpacity: 0.5 });
            expect(result.overlayOpacity).toBe(0.5);
        });

        it('clamps overlayOpacity to 0-1 range', () => {
            expect(sanitizeStyleObject({ overlayOpacity: 1.5 }).overlayOpacity).toBe(1);
            expect(sanitizeStyleObject({ overlayOpacity: -0.5 }).overlayOpacity).toBe(0);
        });

        it('clamps hoverOpacity to 0-1 range', () => {
            expect(sanitizeStyleObject({ hoverOpacity: 2 }).hoverOpacity).toBe(1);
            expect(sanitizeStyleObject({ hoverOpacity: -1 }).hoverOpacity).toBe(0);
        });

        it('filters out unknown keys', () => {
            const result = sanitizeStyleObject({
                marginTop: '10px',
                unknownProperty: 'value',
                anotherInvalid: 123,
            });
            expect(result).toHaveProperty('marginTop');
            expect(result).not.toHaveProperty('unknownProperty');
            expect(result).not.toHaveProperty('anotherInvalid');
        });

        it('truncates very long strings to 500 characters', () => {
            const longString = 'x'.repeat(600);
            const result = sanitizeStyleObject({ marginTop: longString });
            expect(result.marginTop.length).toBe(500);
        });

        it('handles widthResp object correctly', () => {
            const result = sanitizeStyleObject({
                widthResp: {
                    desktop: '100%',
                    mobile: '50%',
                    tablet: '75%',
                },
            });
            expect(result.widthResp).toEqual({
                desktop: '100%',
                mobile: '50%',
                tablet: '75%',
            });
        });

        it('filters empty widthResp values', () => {
            const result = sanitizeStyleObject({
                widthResp: {
                    desktop: '100%',
                    mobile: '',
                },
            });
            expect(result.widthResp).toEqual({ desktop: '100%' });
        });

        it('rejects non-finite numbers', () => {
            const result = sanitizeStyleObject({ zIndex: Infinity });
            expect(result.zIndex).toBeUndefined();
        });
    });

    describe('sanitizeBlockStylesDeep', () => {
        it('returns same value for null input', () => {
            expect(sanitizeBlockStylesDeep(null as any)).toBe(null);
        });

        it('sanitizes block style', () => {
            const block = createBlock({
                style: { marginTop: '10px', unknownProp: 'test' } as any,
            });
            const result = sanitizeBlockStylesDeep(block);
            expect(result.style).toHaveProperty('marginTop');
            expect(result.style).not.toHaveProperty('unknownProp');
        });

        it('recursively sanitizes children', () => {
            const block = {
                ...createBlock({ type: 'container' }),
                children: [createBlock({ style: { padding: '5px', badProp: 'x' } as any })],
            };
            const result = sanitizeBlockStylesDeep(block);
            expect(result.children[0].style).toHaveProperty('padding');
            expect(result.children[0].style).not.toHaveProperty('badProp');
        });

        it('recursively sanitizes columns', () => {
            const block = {
                ...createBlock({ type: 'columns' }),
                columns: [[createBlock({ style: { fontSize: '16px', invalid: 1 } as any })]],
            };
            const result = sanitizeBlockStylesDeep(block);
            expect(result.columns[0][0].style).toHaveProperty('fontSize');
            expect(result.columns[0][0].style).not.toHaveProperty('invalid');
        });

        it('normalizes image altText', () => {
            const block = createBlock({
                type: 'image',
                altText: '  Valid Alt Text  ',
                caption: 'Caption',
            } as any);
            const result = sanitizeBlockStylesDeep(block);
            expect(result.altText).toBe('Valid Alt Text');
        });

        it('uses caption as fallback for empty altText', () => {
            const block = createBlock({
                type: 'image',
                altText: '',
                caption: 'The Caption',
            } as any);
            const result = sanitizeBlockStylesDeep(block);
            expect(result.altText).toBe('The Caption');
        });

        it('normalizes gallery image altTexts', () => {
            const block = {
                ...createBlock({ type: 'gallery' }),
                images: [
                    { id: '1', src: '/img1.jpg', altText: '', caption: 'First Image' },
                    { id: '2', src: '/img2.jpg', altText: 'Valid', caption: '' },
                ],
            };
            const result = sanitizeBlockStylesDeep(block);
            expect(result.images[0].altText).toBe('First Image');
            expect(result.images[1].altText).toBe('Valid');
        });
    });

    describe('composeBlockStyle', () => {
        it('returns style as-is for simple properties', () => {
            const style = { marginTop: '10px', padding: '5px' };
            const result = composeBlockStyle(style);
            expect(result.marginTop).toBe('10px');
            expect(result.padding).toBe('5px');
        });

        it('composes linear gradient from gradientFrom and gradientTo', () => {
            const style = {
                gradientFrom: '#ff0000',
                gradientTo: '#0000ff',
                gradientDirection: 'to right',
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundImage).toContain('linear-gradient');
            expect(result.backgroundImage).toContain('to right');
            expect(result.backgroundImage).toContain('#ff0000');
            expect(result.backgroundImage).toContain('#0000ff');
        });

        it('composes radial gradient when gradientType is radial', () => {
            const style = {
                gradientFrom: '#ff0000',
                gradientTo: '#0000ff',
                gradientType: 'radial',
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundImage).toContain('radial-gradient');
        });

        it('includes gradientMid in gradient', () => {
            const style = {
                gradientFrom: '#ff0000',
                gradientMid: '#00ff00',
                gradientTo: '#0000ff',
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundImage).toContain('#00ff00');
        });

        it('composes overlay layer from overlayColor', () => {
            const style = {
                overlayColor: '#000000',
                overlayOpacity: 0.5,
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundImage).toContain('linear-gradient');
            expect(result.backgroundImage).toContain('rgba(0,0,0,0.5)');
        });

        it('handles hex overlay color conversion to rgba', () => {
            const style = {
                overlayColor: '#ff0000',
                overlayOpacity: 0.3,
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundImage).toContain('rgba(255,0,0,0.3)');
        });

        it('includes backgroundImageUrl in layers', () => {
            const style = {
                backgroundImageUrl: '/image.jpg',
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundImage).toContain('url(/image.jpg)');
        });

        it('sets backgroundSize to cover by default for images', () => {
            const style = { backgroundImageUrl: '/image.jpg' };
            const result = composeBlockStyle(style);
            expect(result.backgroundSize).toBe('cover');
        });

        it('uses custom backgroundSize when specified', () => {
            const style = {
                backgroundImageUrl: '/image.jpg',
                backgroundSize: 'contain',
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundSize).toBe('contain');
        });

        it('uses backgroundSizeCustom when backgroundSize is custom', () => {
            const style = {
                backgroundImageUrl: '/image.jpg',
                backgroundSize: 'custom',
                backgroundSizeCustom: '200px 100px',
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundSize).toBe('200px 100px');
        });

        it('sets backgroundAttachment to fixed when parallax is true', () => {
            const style = {
                backgroundImageUrl: '/image.jpg',
                parallax: true,
            };
            const result = composeBlockStyle(style);
            expect(result.backgroundAttachment).toBe('fixed');
        });

        it('returns empty object for undefined style', () => {
            const result = composeBlockStyle(undefined);
            expect(result).toEqual({});
        });
    });

    describe('composeWrapperStyle', () => {
        it('combines visual and position styles', () => {
            const block = createBlock({
                x: 600, // Use 600px directly instead of percentage
                y: 100,
                style: { backgroundColor: '#fff' },
            });
            const result = composeWrapperStyle(block, true);
            expect(result.left).toBe('600px');
            expect(result.top).toBe('100px');
            expect(result.backgroundColor).toBe('#fff');
        });

        it('applies canvas alignment for non-absolute blocks', () => {
            const block = createBlock({
                width: '50%',
                style: { canvasAlign: 'center' } as any,
            });
            const result = composeWrapperStyle(block, false);
            expect(result.marginLeft).toBe('auto');
            expect(result.marginRight).toBe('auto');
        });

        it('applies right alignment', () => {
            const block = createBlock({
                width: '50%',
                style: { canvasAlign: 'right' } as any,
            });
            const result = composeWrapperStyle(block, false);
            expect(result.marginLeft).toBe('auto');
        });

        it('overrides width from block root', () => {
            const block = createBlock({
                width: '300px',
                style: { width: '100%' },
            });
            const result = composeWrapperStyle(block, false);
            expect(result.width).toBe('300px');
        });

        it('overrides height from block root', () => {
            const block = createBlock({
                height: 200,
                style: { height: '100px' },
            });
            const result = composeWrapperStyle(block, false);
            expect(result.height).toBe(200);
        });

        it('applies zIndex from block root', () => {
            const block = createBlock({ x: 0, y: 0, zIndex: 5 });
            const result = composeWrapperStyle(block, true);
            expect(result.zIndex).toBe(5);
        });
    });

    describe('resolveMeasurement', () => {
        it('returns number as-is', () => {
            expect(resolveMeasurement(100, 1200)).toBe(100);
        });

        it('parses px string to number', () => {
            expect(resolveMeasurement('150px', 1200)).toBe(150);
        });

        it('converts percentage string relative to container', () => {
            expect(resolveMeasurement('50%', 1200)).toBe(600);
        });

        it('returns default for invalid px string', () => {
            expect(resolveMeasurement('invalidpx', 1200, 50)).toBe(50);
        });

        it('returns default for undefined', () => {
            expect(resolveMeasurement(undefined, 1200, 100)).toBe(100);
        });

        it('uses provided default size', () => {
            expect(resolveMeasurement(undefined, 1200, 75)).toBe(75);
        });

        it('handles 0 as valid value', () => {
            expect(resolveMeasurement(0, 1200)).toBe(0);
        });

        it('handles 0% percentage', () => {
            expect(resolveMeasurement('0%', 1200)).toBe(0);
        });

        it('handles 100% percentage', () => {
            expect(resolveMeasurement('100%', 1200)).toBe(1200);
        });
    });
});
