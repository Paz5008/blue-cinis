"use client";

import React from "react";
import { BlockRegistry } from "./renderers/registry";
import { RenderContext } from "./renderers/types";
import { validateBlock } from "@/lib/validations/cms-blocks";
import { composeBlockStyle } from "@/lib/cms/style";
import { ErrorBlock } from "./renderers/ErrorBlock";


// Re-export RenderContext for Editor usage
export type { RenderContext };

type UniversalBlockRendererProps = {
    block: any;
    index: number;
    context: RenderContext;
};

export const UniversalBlockRenderer = React.memo<UniversalBlockRendererProps>(({ block, index, context }) => {
    const { isMobile, disablePositioning, debug } = context;
    // Base style composition
    let style = composeBlockStyle(block.style || {});

    // Safe Style Fallback
    style = style || {};

    // --- Antigravity / FreeForm Geometry Injection ---
    // If we have root-level geometry, we apply it to style (overriding style if present, or acting as source of truth)
    if (!disablePositioning && (block.x !== undefined || block.y !== undefined)) {
        style.position = 'absolute';
        if (block.x !== undefined) style.left = `${block.x}px`;
        if (block.y !== undefined) style.top = `${block.y}px`;
        if (block.width !== undefined) style.width = typeof block.width === 'number' ? `${block.width}%` : block.width;
        if (block.height !== undefined) style.height = typeof block.height === 'number' ? `${block.height}px` : block.height;
        if (block.zIndex !== undefined) style.zIndex = block.zIndex;
        if (block.rotation !== undefined) style.transform = `rotate(${block.rotation}deg)`;
    }

    // --- Empty State & Debug Logic (Refined) ---
    // Detect layout emptiness
    const isEmptyLayout = !style.width && !style.height && !style.minHeight;
    // Detect content emptiness strictly
    const hasContent = (
        (block.content && block.content.trim().length > 0 && block.content !== '<p></p>') ||
        (block.src && block.src.trim().length > 0) ||
        (block.items && block.items.length > 0) ||
        (block.images && block.images.length > 0) ||
        (block.artworks && block.artworks.length > 0) ||
        (block.artworks && block.artworks.length > 0) ||
        (block.children && block.children.length > 0) ||
        (block.columns && block.columns.length > 0) ||
        block.type === 'spacer' || block.type === 'divider' ||
        block.type === 'contactForm' ||
        block.type === 'columns' || block.type === 'container'
    );

    const isActuallyEmpty = isEmptyLayout && !hasContent;

    if (disablePositioning && isActuallyEmpty && !isMobile) {
        style.minHeight = '50px';
        style.minWidth = '50px';
        style.border = '2px dashed rgba(200, 200, 200, 0.5)'; // Subtler border
        style.boxSizing = 'border-box'; // Ensure border doesn't add to width/height
        style.position = 'relative';
        style.display = 'flex';
        style.alignItems = 'center';
        style.justifyContent = 'center';
        style.backgroundColor = '#f9fafb';
        style.color = '#9ca3af';
        style.fontSize = '10px';
    }

    if (debug) {
        style.border = '1px solid red';
        style.outline = '1px solid red';
        style.position = style.position || 'relative';
    }

    // Error Boundary & Placeholder Render
    try {
        if (disablePositioning && isActuallyEmpty && !isMobile && block.type !== 'spacer') {
            return (
                <div style={style} title={`Bloc ${block.type} vide`}>
                    {block.type} (Vide)
                </div>
            );
        }



        const validBlock = React.useMemo(() => validateBlock(block), [block]);
        if (!validBlock) {
            return <ErrorBlock type={block.type} error="Format de données invalide" />;
        }

        const Renderer = BlockRegistry[validBlock.type];

        if (Renderer) {
            const recursiveRenderBlock = (b: any, idx: number, overrideContext?: Partial<RenderContext>) => {
                const mergedContext = overrideContext
                    ? { ...context, ...overrideContext, renderBlock: recursiveRenderBlock }
                    : contextWithRender;
                return <UniversalBlockRenderer block={b} index={idx} context={mergedContext} />;
            };

            const contextWithRender = { ...context, renderBlock: recursiveRenderBlock };
            return <Renderer block={block} index={index} context={contextWithRender} style={style} />;
        }

        return (
            <div className="p-4 border border-red-300 bg-red-50 text-red-700">
                Type de bloc inconnu: {block.type}
            </div>
        );

    } catch (err) {
        console.error("Erreur rendu bloc", block, err);
        return (
            <div className="p-4 border-l-4 border-red-500 bg-red-100">
                Erreur de rendu
            </div>
        );
    }
});
