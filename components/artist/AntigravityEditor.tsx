'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    DndContext,
    useDraggable,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragEndEvent,
    DragOverlay,
    Modifier
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Block } from '@/types/cms';
import { cn } from '@/lib/utils';
import { Monitor, Smartphone, Grid, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- Utils ---
const formatPercentage = (val: number) => `${val.toFixed(2)}%`;

const SNAP_SIZE = 10; // 10px grid

// Snap Logic Helper
const snapToGrid = (value: number) => Math.round(value / SNAP_SIZE) * SNAP_SIZE;

// --- Draggable Block Component ---
interface DraggableBlockProps {
    block: Block;
    isSelected?: boolean;
    onSelect: (id: string) => void;
    containerWidth: number; // Needed to render % as px for drag visual
    containerHeight: number;
}

const DraggableBlock = ({ block, isSelected, onSelect, containerWidth, containerHeight }: DraggableBlockProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        data: { block },
    });

    // Geometry Resolution
    const geo = {
        x: block.x || 0,
        y: block.y || 0,
        w: typeof block.width === 'number' ? block.width : 20,
        h: block.height || 'auto',
        rotation: block.rotation || 0
    };

    // Render Position (Convert % to px for absolute positioning if needed, or use % in style)
    // We use % for left/width as requested.
    const left = isDragging ? undefined : `${geo.x}%`;
    const top = isDragging ? undefined : geo.y; // pixels

    // During drag, we might stick to transform.
    // dnd-kit transform is delta.

    // If dragging, we want to maintain the visual position including delta.
    // Transform is: { x: number, y: number } (pixels)

    const rotation = geo.rotation || 0;

    // We apply style. 
    // Note: dnd-kit's `transform` is the delta from original position? 
    // No, useDraggable transform is the movement delta. The element stays at original position in DOM flow (or absolute).
    // We apply translate3d with the DELTA.

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${geo.x}%`,
        top: geo.y,
        width: `${geo.w}%`,
        height: geo.h === 'auto' ? 'auto' : geo.h,
        zIndex: isDragging ? 9999 : (block.zIndex || 1),
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${rotation}deg)`
            : `rotate(${rotation}deg)`,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400 select-none",
                isSelected && "ring-2 ring-blue-600 shadow-xl",
                isDragging && "opacity-80 z-[9999]"
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
            {...listeners}
            {...attributes}
        >
            <div className="w-full h-full overflow-hidden bg-white/50 backdrop-blur-sm border border-gray-100/50 rounded-sm">
                {block.type === 'image' && (block as any).src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(block as any).src} alt="" className="w-full h-full object-cover pointer-events-none" />
                ) : (
                    <div className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest break-all">
                        {block.type}
                    </div>
                )}
            </div>

            {/* Dimension Helper on Hover */}
            <div className="absolute -top-5 left-0 text-[9px] bg-black text-white px-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                X:{geo.x.toFixed(1)}% Y:{Math.round(geo.y)}px
            </div>
        </div>
    );
};

// --- Editor Component ---

const CONTAINER_WIDTH = 1200;
const CONTAINER_HEIGHT = 800; // Example fixed height for canvas

export function AntigravityEditor({ initialBlocks = [], onSave }: { initialBlocks?: Block[], onSave?: any }) {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);

    // DND Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    // Clamp Modifier (Restrict Logic)
    // We'll implement restriction in onDragEnd for simplicity, or we could use modifier hook.
    // But strict real-time restriction requires custom modifier. 
    // We'll trust the final clamp in onDragEnd for this exercise.

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const id = active.id;

        setBlocks(prev => prev.map(block => {
            if (block.id !== id) return block;

            const geo = {
                x: block.x || 0,
                y: block.y || 0,
                w: typeof block.width === 'number' ? block.width : 20,
                h: block.height || 'auto',
                rotation: block.rotation || 0
            };

            // 1. Calculate new Pixel Coordinates
            const currentXpx = (geo.x / 100) * CONTAINER_WIDTH;
            const newXpx = currentXpx + delta.x;
            const newYpx = geo.y + delta.y;

            // 2. Snap to Grid (10px)
            const snappedXpx = snapToGrid(newXpx);
            const snappedYpx = snapToGrid(newYpx);

            // 3. Restrict to Parent (Clamp)
            // Max X is container width - block width (approx)
            // We need block width in px.
            const blockWidthPx = (geo.w / 100) * CONTAINER_WIDTH;
            const maxX = CONTAINER_WIDTH - blockWidthPx;
            const maxY = CONTAINER_HEIGHT; // or infinity? User said "zone éditable".

            const clampedX = Math.max(0, Math.min(maxX, snappedXpx));
            const clampedY = Math.max(0, Math.min(maxY, snappedYpx));

            // 4. Convert X back to %
            const finalXpercent = (clampedX / CONTAINER_WIDTH) * 100;

            return {
                ...block,
                x: Number(finalXpercent.toFixed(2)),
                y: clampedY,
            };
        }));
        setActiveId(null);
    };

    const save = () => {
        // Save logic calling API
        // Validation is handled by Zod on backend
        fetch('/api/artist/customization/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_draft', blocks })
        })
            .then(r => {
                if (r.ok) toast.success('Canvas sauvegardé');
                else toast.error('Erreur sauvegarde');
            });
    };

    return (
        <div className="flex flex-col h-screen bg-stone-50">
            <header className="h-14 bg-white border-b flex items-center justify-between px-4">
                <h1 className="font-serif text-lg">Antigravity Editor</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={cn("p-2 rounded text-sm hover:bg-gray-100", showGrid && "bg-blue-50 text-blue-600")}
                        title="Toggle Snap Grid"
                    >
                        <Grid size={18} />
                    </button>
                    <button onClick={save} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800">
                        <Save size={16} /> Sauvegarder
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-10 flex justify-center items-start">
                <div
                    className="relative bg-white shadow-2xl overflow-hidden transition-all"
                    style={{
                        width: CONTAINER_WIDTH,
                        height: CONTAINER_HEIGHT,
                        // Grid Visualization
                        backgroundImage: showGrid
                            ? 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)'
                            : 'none',
                        backgroundSize: '10px 10px'
                    }}
                    onClick={() => setSelectedId(null)}
                >
                    <DndContext
                        sensors={sensors}
                        onDragStart={({ active }) => setActiveId(active.id as string)}
                        onDragEnd={handleDragEnd}
                    // modifiers could be added here for real-time restriction
                    >
                        {blocks.map(block => (
                            <DraggableBlock
                                key={block.id}
                                block={block}
                                isSelected={selectedId === block.id}
                                onSelect={setSelectedId}
                                containerWidth={CONTAINER_WIDTH}
                                containerHeight={CONTAINER_HEIGHT}
                            />
                        ))}
                    </DndContext>
                </div>
            </main>
        </div>
    );
}
