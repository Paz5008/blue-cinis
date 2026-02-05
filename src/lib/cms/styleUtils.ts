
import { CSSProperties } from "react";

/**
 * Converts a block's dynamic style properties into a CSS-variable-based style object.
 * This allows us to keep React components clean and use CSS classes for structure,
 * while injecting user-defined values (colors, specific widths) as variables.
 */
export function composeDynamicStyle(style: Record<string, any> | undefined): CSSProperties {
    if (!style) return {};

    const vars: Record<string, string | number> = {};

    // Color & Topography
    if (style.color) vars['--block-color'] = style.color;
    if (style.backgroundColor) vars['--block-bg-color'] = style.backgroundColor;
    if (style.fontSize) vars['--block-font-size'] = style.fontSize;
    if (style.fontFamily) vars['--block-font-family'] = style.fontFamily;
    if (style.textAlign) vars['--block-text-align'] = style.textAlign;

    // Dimensions & Spacing
    if (style.width) vars['--block-width'] = style.width;
    if (style.height) vars['--block-height'] = style.height;
    if (style.gap) vars['--block-gap'] = typeof style.gap === 'number' ? `${style.gap}px` : style.gap;
    if (style.padding) vars['--block-padding'] = style.padding;
    if (style.margin) vars['--block-margin'] = style.margin;

    // Effects
    if (style.borderRadius) vars['--block-radius'] = style.borderRadius;
    if (style.borderColor) vars['--block-border-color'] = style.borderColor;
    if (style.borderWidth) vars['--block-border-width'] = style.borderWidth;

    // Grid
    if (style.gridTemplateColumns) vars['--block-grid-cols'] = style.gridTemplateColumns;

    // Return as CSSProperties (casting needed for custom props)
    return vars as CSSProperties;
}
