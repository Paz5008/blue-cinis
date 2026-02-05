"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

export const ColumnsRenderer: React.FC<BlockRendererProps> = React.memo(({ block, context, style: injectedStyle }) => {
    const { renderBlock } = context;
    const baseStyle = composeBlockStyle(block.style || {});

    const count = Math.max(1, Number(block.count) || 2);

    // Extract gridTemplateColumns to handle it responsively manually
    // @ts-ignore
    const { gridTemplateColumns, ...restStyle } = {
        ...baseStyle,
        ...injectedStyle,
        ...(baseStyle?.width ? { marginLeft: "auto", marginRight: "auto" } : {}),
    } as any;

    const gridClassMap: Record<number, string> = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
        5: "md:grid-cols-5",
        6: "md:grid-cols-6",
    };

    // Default standard class based on column count
    let responsiveClass = gridClassMap[count] || "md:grid-cols-2";

    // CSS Variable logic for custom grids
    const customStyles: React.CSSProperties = { ...restStyle };

    // Advanced: Handle responsive grid template object { desktop: '...', mobile: '...' }
    if (gridTemplateColumns) {
        if (typeof gridTemplateColumns === 'object') {
            const { desktop, mobile } = gridTemplateColumns;
            if (desktop || mobile) {
                // We use CSS variables for dynamic overrides
                // and a standard class that consumes them via arbitrary values or style tag in global (if we had one)
                // But simpler: just use style with media queries? No, inline styles don't support media queries.
                // Best approach with Tailwind/Next: Use CSS variables and a utility class that relies on them isn't standard in Tailwind without config.
                // However, we can use the technique of "--grid-cols" variable and then `grid-cols-[var(--grid-cols)]`.
                // BUT media queries in inline styles are not possible.

                // ALTERNATIVE: Use the previous class-based approach but clean it up?
                // OR: Since we want to Avoid DangerouslySetInnerHTML, we can't easily do media queries inline.
                // Wait.
                // The PLAN was "Use CSS Variables".
                // We can set "--grid-mobile" and "--grid-desktop".
                // Then in className we can use: "grid-cols-[var(--grid-mobile)] md:grid-cols-[var(--grid-desktop)]"
                // This requires valid CSS grid-template-columns values in the variables.

                const mobileTpl = mobile || '1fr';
                // Fallback for desktop is mobile or 1fr
                const desktopTpl = desktop || mobile || '1fr';

                // @ts-ignore
                customStyles['--grid-mobile'] = mobileTpl;
                // @ts-ignore
                customStyles['--grid-desktop'] = desktopTpl;

                responsiveClass = "grid-cols-[var(--grid-mobile)] md:grid-cols-[var(--grid-desktop)]";
            }
        } else if (typeof gridTemplateColumns === 'string') {
            // Flat string override
            // @ts-ignore
            customStyles['--grid-mobile'] = gridTemplateColumns;
            // @ts-ignore
            customStyles['--grid-desktop'] = gridTemplateColumns;
            responsiveClass = "grid-cols-[var(--grid-mobile)] md:grid-cols-[var(--grid-desktop)]";
        }
    }

    return (
        <div
            className={`grid gap-4 mb-6 grid-cols-1 ${responsiveClass}`}
            style={customStyles}
        >
            {(block.columns || []).map((col: any[], colIdx: number) => {
                const isEmpty = !col || col.length === 0;

                return (
                    <div
                        key={colIdx}
                        className={`
                            space-y-4 
                            ${context.isPreview
                                ? 'min-h-[50px] rounded-lg transition-all duration-200 hover:ring-1 hover:ring-slate-200/50'
                                : ''}
                        `}
                    >
                        {Array.isArray(col) && col.length > 0
                            ? col.map((child, idx) => (
                                renderBlock ? renderBlock(child, idx, { disablePositioning: true }) : null
                            ))
                            : context.isPreview ? (
                                <div className="h-full min-h-[80px] flex items-center justify-center border border-dashed border-slate-200 rounded text-xs text-slate-400 font-medium">
                                    Colonne vide
                                </div>
                            ) : null}
                    </div>
                );
            })}
        </div>
    );
});
