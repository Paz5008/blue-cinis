'use client';

import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Smartphone, Monitor } from 'lucide-react';
import type { Block, BlockType } from '@/types/cms';
import { getBlockLabel } from './shared/BlockLabel';



interface SortableBlockItemProps {
    block: Block;
    isHiddenOnMobile: boolean;
    onToggleVisibility: () => void;
    orderDifference?: number; // Difference from desktop position
}

function SortableBlockItem({
    block,
    isHiddenOnMobile,
    onToggleVisibility,
    orderDifference,
}: SortableBlockItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : isHiddenOnMobile ? 0.4 : 1,
    };

    const label = getBlockLabel(block.type, block.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors
        ${isDragging ? 'bg-blue-50 border-blue-300 shadow-lg' : 'bg-white border-neutral-200 hover:border-neutral-300'}
        ${isHiddenOnMobile ? 'bg-neutral-50' : ''}
      `}
            role="listitem"
            aria-label={`${label}${isHiddenOnMobile ? ' - masqué sur mobile' : ''}`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="p-1 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing"
                aria-label="Glisser pour réordonner"
            >
                <GripVertical size={16} />
            </button>

            {/* Block Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isHiddenOnMobile ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                        {label}
                    </span>
                    {orderDifference !== undefined && orderDifference !== 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            {orderDifference > 0 ? `↓${orderDifference}` : `↑${Math.abs(orderDifference)}`}
                        </span>
                    )}
                </div>
                {/* Preview of content if available */}
                {'content' in block && typeof block.content === 'string' && block.content && (
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {block.content.replace(/<[^>]*>/g, '').slice(0, 40)}
                    </p>
                )}
            </div>

            {/* Visibility Toggle */}
            <button
                onClick={onToggleVisibility}
                className={`
          p-1.5 rounded-md transition-colors
          ${isHiddenOnMobile
                        ? 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                        : 'text-blue-600 hover:bg-blue-50'
                    }
        `}
                aria-label={isHiddenOnMobile ? 'Afficher sur mobile' : 'Masquer sur mobile'}
                aria-pressed={!isHiddenOnMobile}
            >
                {isHiddenOnMobile ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
}

interface MobileLayoutManagerProps {
    blocks: Block[];
    mobileOrder: string[];
    onReorder: (newOrder: string[]) => void;
    hiddenOnMobile: Set<string>;
    onToggleVisibility: (blockId: string) => void;
    desktopOrder: string[];
}

/**
 * MobileLayoutManager - Manage block order and visibility for mobile layouts
 * Uses @dnd-kit for drag-and-drop reordering
 */
export function MobileLayoutManager({
    blocks,
    mobileOrder,
    onReorder,
    hiddenOnMobile,
    onToggleVisibility,
    desktopOrder,
}: MobileLayoutManagerProps) {
    const [showHidden, setShowHidden] = useState(true);

    // Sensors for both mouse and touch
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        })
    );

    // Create a map of block id to block
    const blockMap = React.useMemo(() => {
        const map = new Map<string, Block>();
        blocks.forEach(block => map.set(block.id, block));
        return map;
    }, [blocks]);

    // Get ordered blocks based on mobileOrder
    const orderedBlocks = React.useMemo(() => {
        const result: Block[] = [];
        const usedIds = new Set<string>();

        // First, add blocks in mobile order
        for (const id of mobileOrder) {
            const block = blockMap.get(id);
            if (block) {
                result.push(block);
                usedIds.add(id);
            }
        }

        // Then add any blocks not in mobileOrder (new blocks)
        for (const block of blocks) {
            if (!usedIds.has(block.id)) {
                result.push(block);
            }
        }

        return result;
    }, [blocks, mobileOrder, blockMap]);

    // Calculate order difference from desktop
    const getOrderDifference = useCallback((blockId: string) => {
        const mobileIndex = mobileOrder.indexOf(blockId);
        const desktopIndex = desktopOrder.indexOf(blockId);
        if (mobileIndex === -1 || desktopIndex === -1) return undefined;
        return mobileIndex - desktopIndex;
    }, [mobileOrder, desktopOrder]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = orderedBlocks.findIndex(b => b.id === active.id);
            const newIndex = orderedBlocks.findIndex(b => b.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(
                    orderedBlocks.map(b => b.id),
                    oldIndex,
                    newIndex
                );
                onReorder(newOrder);
            }
        }
    }, [orderedBlocks, onReorder]);

    // Filter blocks if hiding hidden ones
    const displayBlocks = showHidden
        ? orderedBlocks
        : orderedBlocks.filter(b => !hiddenOnMobile.has(b.id));

    const hiddenCount = blocks.filter(b => hiddenOnMobile.has(b.id)).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-700">
                        Disposition Mobile
                    </span>
                </div>
                {hiddenCount > 0 && (
                    <button
                        onClick={() => setShowHidden(!showHidden)}
                        className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                        aria-label={showHidden ? 'Masquer les blocs cachés' : 'Afficher les blocs cachés'}
                    >
                        {showHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
                    </button>
                )}
            </div>

            {/* Instructions */}
            <div className="px-3 py-2 bg-blue-50/50 border-b border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                    Glissez les blocs pour réordonner sur mobile. Cliquez l'œil pour masquer.
                </p>
            </div>

            {/* Block List */}
            <div className="flex-1 overflow-y-auto p-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={displayBlocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1.5" role="list" aria-label="Blocs ordonnés pour mobile">
                            {displayBlocks.map(block => (
                                <SortableBlockItem
                                    key={block.id}
                                    block={block}
                                    isHiddenOnMobile={hiddenOnMobile.has(block.id)}
                                    onToggleVisibility={() => onToggleVisibility(block.id)}
                                    orderDifference={getOrderDifference(block.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {displayBlocks.length === 0 && (
                    <div className="text-center py-8 text-neutral-400">
                        <p className="text-sm">Aucun bloc à afficher</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                        <Monitor size={12} />
                        Desktop: {blocks.length} blocs
                    </span>
                    <span className="flex items-center gap-1">
                        <Smartphone size={12} />
                        Mobile: {blocks.length - hiddenCount} visibles
                    </span>
                </div>
            </div>
        </div>
    );
}

export default MobileLayoutManager;
