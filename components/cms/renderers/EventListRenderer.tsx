"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import { composeBlockStyle } from "@/lib/cms/style";

export const EventListRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const { sanitize } = context;
    const baseStyle = composeBlockStyle(block.style || {});
    const accentColor = block.accentColor || "var(--accent, currentColor)";

    // 1. Data Prep
    let events = Array.isArray(block.events) ? block.events : [];

    // Sort by date defaults to asc
    events = [...events].sort((a: any, b: any) =>
        (a.startDate || "").localeCompare(b.startDate || "")
    );

    // Filter Past Events
    if (block.showPastEvents === false) {
        const today = new Date().toISOString().split('T')[0];
        events = events.filter((e: any) => (e.endDate || e.startDate) >= today);
    }

    if (events.length === 0) {
        if (!context.isPreview) return null;
        return (
            <div className="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500 my-4">
                {block.emptyStateMessage || "Aucun événement à afficher."}
            </div>
        );
    }

    const formatDate = (date: string) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderDate = (start: string, end: string) => {
        if (!start) return "";
        const s = formatDate(start);
        if (!end || end === start) return s;
        return `${s} - ${formatDate(end)}`;
    };

    // 2. Render Utilities
    const Heading = () => {
        if (!block.heading) return null;
        return <h3 className="text-xl font-bold mb-4" style={{ color: baseStyle.color }}>{block.heading}</h3>;
    };

    const renderItemContent = (evt: any) => (
        <>
            <div className="mb-1">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>
                    {renderDate(evt.startDate, evt.endDate)}
                </span>
                {block.showLocation !== false && evt.location && (
                    <span className="text-xs text-gray-500 ml-2">• {evt.location}</span>
                )}
            </div>

            <h4 className="text-lg font-semibold mb-2 leading-tight">{evt.title}</h4>

            {block.showDescription !== false && evt.description && (
                <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {evt.description}
                </div>
            )}

            {(evt.linkUrl && evt.linkLabel) && (
                <a
                    href={evt.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium hover:underline"
                    style={{ color: accentColor }}
                >
                    {evt.linkLabel} &rarr;
                </a>
            )}
        </>
    );

    // 3. Layouts
    const layout = block.layout || 'list';

    if (layout === 'cards') {
        const gridCols = block.columns || 3;
        const gridClassMap: Record<number, string> = {
            1: "md:grid-cols-1",
            2: "md:grid-cols-2",
            3: "md:grid-cols-3",
            4: "md:grid-cols-4",
            5: "md:grid-cols-5",
            6: "md:grid-cols-6",
        };
        const responsiveClass = gridClassMap[gridCols] || "md:grid-cols-3";

        return (
            <div className="mb-6" style={{ ...baseStyle, ...injectedStyle }}>
                <Heading />
                <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${responsiveClass}`}>
                    {events.map((evt: any, i: number) => (
                        <div
                            key={evt.id || i}
                            className={`p-4 rounded-lg bg-white border border-gray-100 shadow-sm flex flex-col ${evt.highlight ? 'ring-1 ring-offset-1' : ''}`}
                            style={evt.highlight ? { minHeight: '200px', borderColor: accentColor } : { minHeight: '200px' }}
                        >
                            <div className="flex-grow">
                                {renderItemContent(evt)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (layout === 'timeline') {
        return (
            <div className="mb-6" style={{ ...baseStyle, ...injectedStyle }}>
                <Heading />
                <div className="space-y-6 border-l-2 pl-4 ml-2" style={{ borderColor: accentColor }}>
                    {events.map((evt: any, i: number) => (
                        <div key={evt.id || i} className="relative">
                            <div
                                className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white"
                                style={{ backgroundColor: accentColor }}
                            />
                            {renderItemContent(evt)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default List
    return (
        <div className="mb-6" style={{ ...baseStyle, ...injectedStyle }}>
            <Heading />
            <div className="space-y-4">
                {events.map((evt: any, i: number) => (
                    <div key={evt.id || i} className={`pb-4 border-b border-gray-100 last:border-0 ${evt.highlight ? 'bg-gray-50 p-4 rounded' : ''}`}>
                        {renderItemContent(evt)}
                    </div>
                ))}
            </div>
        </div>
    );
};
