
import React from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block } from '@/types/cms';
import { FreeFormCanvas } from './FreeFormCanvas';
import { PreviewFrame } from './PreviewFrame';

export interface EditorCanvasProps {
    blocks: Block[];
    onChange: (blocks: Block[]) => void;
    renderBlock: (block: Block, index: number, isDragOverlay?: boolean) => React.ReactNode;
    isFreeForm: boolean;
    viewMode: 'edit' | 'preview' | 'theme';
    device: 'desktop' | 'mobile';
    className?: string;
    style?: React.CSSProperties;
    /** Width/Height constraints for Banner/Poster */
    designSize?: { width?: number; height?: number };
}

export const DesktopEditorCanvas: React.FC<EditorCanvasProps> = ({
    blocks,
    onChange,
    renderBlock,
    isFreeForm,
    viewMode,
    device, // Should stay 'desktop' here usually, but kept for interface consistency
    className,
    style,
    designSize
}) => {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex(b => b.id === active.id);
            const newIndex = blocks.findIndex(b => b.id === over.id);
            if (oldIndex >= 0 && newIndex >= 0) {
                onChange(arrayMove(blocks, oldIndex, newIndex));
            }
        }
    };

    // Desktop FreeForm / Preview Logic
    if (isFreeForm) {
        if (viewMode === 'preview') {
            return (
                <PreviewFrame
                    blocks={blocks}
                    width={designSize?.width}
                    height={designSize?.height}
                />
            );
        }
        return (
            <FreeFormCanvas
                width={designSize?.width}
                minHeight={designSize?.height}
                renderBlock={renderBlock}
            />
        );
    }

    // List Mode (Desktop List)
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className={className} style={style}>
                    {blocks.map((block, index) => (
                        <SortableBlockItem
                            key={block.id}
                            block={block}
                            index={index}
                            renderBlock={renderBlock}
                            device="desktop"
                        />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay>
                {activeId ? (
                    <div className="opacity-80 scale-105 origin-center">
                        {(() => {
                            const b = blocks.find(x => x.id === activeId);
                            return b ? renderBlock(b, -1, true) : null;
                        })()}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// Internal Sub-Component (Duplicated here to stay isolated, or could be shared)
interface SortableBlockItemProps {
    block: Block;
    index: number;
    renderBlock: (block: Block, index: number) => React.ReactNode;
    device: 'desktop' | 'mobile';
}

const SortableBlockItem: React.FC<SortableBlockItemProps> = ({ block, index, renderBlock, device }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        // Hide logic
        display: (block as any).showOnDesktop === false ? 'none' : undefined
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
            {renderBlock(block, index)}
        </div>
    );
};
