'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    DndContext,
    useDraggable,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    MouseSensor
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { Block } from '@/types/cms';
import { cn } from '@/lib/utils';
import { resolveMeasurement } from '@/lib/cms/style';
import { Modifier } from '@dnd-kit/core';
import { useEditorContext } from './editor/EditorContext';


// We need a wrapper that uses useDraggable
interface DraggableBlockProps {
    block: Block;
    isSelected?: boolean;
    onSelect: (id: string) => void;
    scale?: number; // Zoom level of canvas if any
    isPreview?: boolean;
    debugLabel?: string;
    renderBlock?: (block: Block, index: number) => React.ReactNode;
}

const DraggableBlock = React.memo(({ block, isSelected, onSelect, isPreview, renderBlock, debugLabel }: DraggableBlockProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        data: { block },
        disabled: isPreview,
    });


    const isTextBased = ['text', 'artistName', 'artistBio', 'quote'].includes(block.type);

    const style: React.CSSProperties = {
        position: 'absolute',
        left: block.x ?? 0, // Default to 0 if undefined
        top: block.y ?? 0,
        width: block.width,
        height: isTextBased ? 'auto' : block.height,
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${block.rotation || 0}deg)`
            : `rotate(${block.rotation || 0}deg)`,
        zIndex: isDragging ? 9999 : (block.zIndex || 10),
        // Noise effect (parallax) - simplified for now
        animation: (block.noise && !isDragging) ? 'float 6s ease-in-out infinite' : 'none',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group transition-shadow cursor-grab active:cursor-grabbing touch-none",
                isSelected && "ring-2 ring-blue-500",
                !block.width && "w-fit", // Auto width if not set
                !block.height && "h-fit"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(block.id);
            }}
            {...listeners}
            {...attributes}
        >
            {/* Debug Label */}
            {debugLabel && (
                <div className="absolute top-0 right-0 z-[100] bg-cyan-400 text-black text-[9px] font-bold uppercase px-1 py-0.5 pointer-events-none whitespace-nowrap">
                    {debugLabel}
                </div>
            )}

            {/* Debug Outline (Optional: if we want outline to move with block) */}
            {debugLabel && (
                <div className="absolute inset-0 border border-dashed border-cyan-400 pointer-events-none z-[100]" />
            )}

            {/* Content */}
            <div className="pointer-events-none w-full h-full">
                {renderBlock ? (
                    renderBlock(block, 0)
                ) : (
                    <div className="w-full h-full min-w-[100px] min-h-[50px] bg-white border border-dashed border-gray-300 overflow-hidden relative">
                        <span className="absolute top-0 left-0 text-xs bg-gray-100 p-1 opacity-50 group-hover:opacity-100">
                            {block.type}
                        </span>
                        {block.type === 'text' && (block as any).content && (
                            <div dangerouslySetInnerHTML={{ __html: (block as any).content }} className="p-2" />
                        )}
                        {block.type === 'image' && (block as any).src && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(block as any).src} alt="" className="w-full h-full object-cover" />
                        )}
                    </div>
                )}
            </div>

            {/* Visual noise keyframes injection if needed */}
            {block.noise && (
                <style dangerouslySetInnerHTML={{
                    __html: `
          @keyframes float {
            0% { transform: translateY(0px) rotate(${block.rotation || 0}deg); }
            50% { transform: translateY(-10px) rotate(${(block.rotation || 0) + 1}deg); }
            100% { transform: translateY(0px) rotate(${block.rotation || 0}deg); }
          }
        `}} />
            )}
        </div>
    );
});

interface FreeFormCanvasProps {
    width?: number; // Canvas width
    minHeight?: number;
    renderBlock?: (block: Block, index: number) => React.ReactNode;
    backgroundColor?: string;
}

export function FreeFormCanvas({
    width = 1200,
    minHeight = 800,
    renderBlock,
    backgroundColor = '#ffffff',
}: FreeFormCanvasProps) {
    const {
        blocks,
        setBlocks,
        selectedIndex,
        setSelectedIndex,
        setSelectedChild,
        device,
        debugOutlines = false,
    } = useEditorContext();

    const isMobileView = device === 'mobile';
    const selectedBlockId = selectedIndex !== null ? blocks[selectedIndex]?.id || null : null;

    const onSelectBlock = (id: string | null) => {
        if (!id) {
            setSelectedIndex(null);
            setSelectedChild(null);
            return;
        }
        const idx = blocks.findIndex(b => b.id === id);
        if (idx >= 0) {
            setSelectedIndex(idx);
            setSelectedChild(null);
        }
    };

    const onChange = setBlocks;

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const modifiers = React.useMemo(() => {
        const mods: Modifier[] = [];
        if (isMobileView) mods.push(restrictToParentElement);
        return mods;
    }, [isMobileView]);

    const validateCoordinates = (x: number, y: number, blockWidth?: number | string): { x: number, y: number } => {
        let newX = x;
        let newY = y;

        if (isMobileView) {
            // Force X to be within bounds or reset if way off
            // User requirement: "Si x > 390 ou x < 0, force x = 0"
            if (newX < 0 || newX > 390) {
                newX = 0;
            }
            // User requirement: "Si y < 0, force y = 0"
            if (newY < 0) {
                newY = 0;
            }
        } else {
            // Desktop Constrain Logic
            // Calculate effective block width in pixels
            const pixelWidth = resolveMeasurement(blockWidth as (string | number | undefined), width, 50);
            const maxX = width - pixelWidth;

            newX = Math.max(0, Math.min(newX, maxX));

            // Constrain Y (Prevent going above 0)
            newY = Math.max(0, newY);
        }
        return { x: newX, y: newY };
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const blockId = active.id;

        // Try to get actual rendered dimensions from dnd-kit event
        // @ts-ignore - accessing internal dnd-kit rect data if explicit type missing
        const measuredWidth = active.rect?.current?.translated?.width || active.rect?.current?.initial?.width;

        onChange(blocks.map(b => {
            if (b.id === blockId) {
                const currentX = b.x || 0;
                const currentY = b.y || 0;
                const nextX = currentX + delta.x;
                const nextY = currentY + delta.y;

                // Fallback width calculation if measurement fails
                let finalWidth = 50; // Safety min
                if (measuredWidth) {
                    finalWidth = measuredWidth;
                } else {
                    finalWidth = resolveMeasurement(b.width, width, 50);
                }

                const validated = validateCoordinates(nextX, nextY, finalWidth);

                return {
                    ...b,
                    x: validated.x,
                    y: validated.y,
                };
            }
            return b;
        }));
    };

    // Dynamic Height Logic
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial calculation helper based on data (for fast paint)
    const calculateMinHeightFromData = (currentBlocks: Block[]) => {
        if (!currentBlocks || currentBlocks.length === 0) return 0;
        const maxY = currentBlocks.reduce((max, b) => {
            const y = b.y || 0;
            // Best guess if height is auto: assume 300px (safer for "visual" blocks).
            // If height is fixed number, use it. If string 'px', parse it.
            let h = 300;
            if (typeof b.height === 'number') h = b.height;
            if (typeof b.height === 'string' && b.height.endsWith('px')) h = parseInt(b.height, 10);
            return Math.max(max, y + h);
        }, 0);
        return maxY + 200; // Add generous padding
    };

    const [manualMinHeight, setManualMinHeight] = useState(() => {
        const dataHeight = calculateMinHeightFromData(blocks);
        return Math.max(minHeight, dataHeight);
    });

    const [dynamicHeight, setDynamicHeight] = useState(() => {
        return Math.max(minHeight, calculateMinHeightFromData(blocks));
    });

    // Sync prop minHeight changes if needed
    useEffect(() => {
        setManualMinHeight(prev => Math.max(prev, minHeight));
    }, [minHeight]);

    // Update manual min height aggressively on block load
    useEffect(() => {
        const dataHeight = calculateMinHeightFromData(blocks);
        setManualMinHeight(prev => Math.max(prev, dataHeight));
    }, [blocks]);

    useEffect(() => {
        const measureHeight = () => {
            if (!containerRef.current) return;
            // TARGET FIX: We must measure the absolute child, not the static wrapper
            const items = containerRef.current.querySelectorAll('[data-dnd-item] > div');
            let maxY = 0;
            items.forEach((el: Element) => {
                const htmlEl = el as HTMLElement;
                // For absolute elements, offsetTop is relative to the parent frame (which is relative/positioned)
                const bottom = htmlEl.offsetTop + htmlEl.offsetHeight;
                if (bottom > maxY) {
                    maxY = bottom;
                }
            });
            // Height is max of content (+padding) OR user's manual setting
            const newHeight = Math.max(manualMinHeight, maxY + 150);
            setDynamicHeight(newHeight);
        };

        measureHeight();
        const t1 = setTimeout(measureHeight, 100);
        const t2 = setTimeout(measureHeight, 500);
        const t3 = setTimeout(measureHeight, 2000);

        const resizeObserver = new ResizeObserver(() => measureHeight());
        if (containerRef.current) {
            Array.from(containerRef.current.children).forEach(child => resizeObserver.observe(child));
        }

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            resizeObserver.disconnect();
        };
    }, [blocks, manualMinHeight, isMobileView]);

    // Frame Style Logic
    const frameStyle: React.CSSProperties = isMobileView
        ? {
            width: '390px',
            minHeight: '844px',
            height: `${dynamicHeight}px`,
            paddingBottom: '200px',
            margin: '0 auto',
            overflow: 'visible',
            position: 'relative',
        }
        : {
            width,
            minHeight: manualMinHeight, // Ensure CSS respects it too
            height: `${dynamicHeight}px`,
            position: 'relative',
        };

    const wrapperClass = isMobileView
        ? "relative shadow-[0_0_0_12px_#1a1a1a,0_20px_50px_-12px_rgba(0,0,0,1)] rounded-[3rem] my-8 mx-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent bg-background transition-all duration-300"
        : "relative bg-white shadow-2xl mx-auto overflow-hidden transition-all duration-300 ring-1 ring-black/5";

    return (
        <div className="flex flex-col items-center pb-20">
            <div
                ref={containerRef}
                className={wrapperClass}
                style={frameStyle}
                onClick={() => onSelectBlock(null)}
            >
                {isMobileView && (
                    <style dangerouslySetInnerHTML={{
                        __html: `
                    .resize-handle, [data-resize-handle] { pointer-events: none !important; opacity: 0 !important; }
                    ::-webkit-scrollbar { width: 6px; }
                    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }
                    `
                    }} />
                )}



                <DndContext
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                    modifiers={modifiers}
                >
                    {blocks.map(block => (
                        <div key={block.id} data-dnd-item data-block-type={block.type}>
                            <DraggableBlock
                                block={block}
                                isSelected={selectedBlockId === block.id}
                                debugLabel={debugOutlines ? block.type : undefined}
                                onSelect={onSelectBlock}
                                renderBlock={renderBlock}
                            />
                        </div>
                    ))}
                </DndContext>

                {!isMobileView && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            height: '100%'
                        }}
                    />
                )}
            </div>

            {/* Manual Height Controls */}
            <div className="flex items-center gap-4 mt-8 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-neutral-900/90 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl border border-white/10 ring-1 ring-black/50">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hauteur</span>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setManualMinHeight(h => Math.max(minHeight, h - 100)); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition ring-1 ring-white/5"
                        title="Réduire hauteur (-100px)"
                    >
                        -
                    </button>
                    <span className="min-w-[4rem] text-center text-xs font-mono font-medium text-neutral-200">{Math.round(manualMinHeight)}px</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setManualMinHeight(h => h + 100); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 transition shadow-lg shadow-white/10"
                        title="Augmenter hauteur (+100px)"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}
