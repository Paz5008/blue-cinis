import React, { useState, useRef, useCallback } from 'react';
import {
    useSensors,
    useSensor,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import type { Block, BlockType } from '@/types/cms';
import type { DragMeta } from '../types';
import { DropActionContext } from '@/lib/dnd-strategies/types';
import { moveRootBlock } from '@/lib/dnd-strategies/root';
import { moveContainerChild, moveContainerChildToRoot, insertRootIntoContainer } from '@/lib/dnd-strategies/container';
import { moveBlockIntoColumns } from '@/lib/dnd-strategies/columns';

const CONTAINER_COLUMN_DROPPABLE_PREFIX = 'container-column:';

interface UseEditorDragDropProps {
    blocks: Block[];
    setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
    addBlockAt: (type: BlockType, index: number) => void;
    setDirty: (dirty: boolean) => void;
    setSelectedIndex: (index: number | null) => void;
    setSelectedChild: (child: { parentId: string; childId: string } | null) => void;
    setLiveStatus: (status: string) => void;
    blockRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    setIsCanvasDragOver: (isOver: boolean) => void;
    viewMode: 'edit' | 'theme' | 'preview';
}

export function useEditorDragDrop({
    blocks,
    setBlocks,
    addBlockAt,
    setDirty,
    setSelectedIndex,
    setSelectedChild,
    setLiveStatus,
    blockRefs,
    setIsCanvasDragOver,
    viewMode,
}: UseEditorDragDropProps) {

    // --- 1. DND KIT SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // --- 2. STATE ---
    const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);

    // Internal ref to access latest blocks in callbacks without breaking stability
    const latestBlocksRef = useRef(blocks);
    latestBlocksRef.current = blocks;

    // Helper to find block type by ID (recursive)
    const findBlockTypeById = useCallback((id: string): BlockType | null => {
        const currentBlocks = latestBlocksRef.current;
        for (const b of currentBlocks) {
            if (b.id === id) return b.type as BlockType;
            // Containers
            if ((b as any).type === 'container' && Array.isArray((b as any).children)) {
                for (const c of (b as any).children) {
                    if (c?.id === id) return c.type as BlockType;
                }
            }
            // Columns (recursive search not fully implemented in original but safe for shallow depth)
            if ((b as any).type === 'columns' && Array.isArray((b as any).columns)) {
                for (const col of (b as any).columns) {
                    if (Array.isArray(col)) {
                        for (const c of col) {
                            if (c?.id === id) return c.type as BlockType;
                        }
                    }
                }
            }
        }
        return null;
    }, []); // Empty dependency array! Stable reference.

    // --- 3. DND KIT HANDLERS ---
    const handleDndKitDragStart = useCallback((event: DragStartEvent) => {
        const id = String(event.active.id);
        const t = findBlockTypeById(id);
        setActiveDragType(t);
    }, [findBlockTypeById]);

    const handleDndKitDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragType(null);
        const { active, over } = event;
        if (!over) return;

        const activeMeta = (active.data?.current || null) as DragMeta | null;
        const overMeta = (over.data?.current || null) as DragMeta | null;
        const overId = String(over.id);
        const activeId = String(active.id);

        const context: DropActionContext = {
            setBlocks,
            setDirty,
            setSelectedChild,
            setSelectedIndex,
            setLiveStatus
        };

        // Case 1: Drop into a Container Column (Columns Block)
        if (overId.startsWith(CONTAINER_COLUMN_DROPPABLE_PREFIX)) {
            const [, columnsChildId, colIdxRaw] = overId.split(':');
            const colIdx = parseInt(colIdxRaw || '', 10);
            if (Number.isFinite(colIdx)) {
                moveBlockIntoColumns(activeId, columnsChildId, colIdx, activeMeta, context);
            }
            return;
        }

        // Case 2: Reorder Container Child -> Container Child
        if (activeMeta?.type === 'container-child' && overMeta?.type === 'container-child') {
            moveContainerChild(activeMeta, overMeta, context);
            return;
        }

        // Case 3: Move Container Child -> Root (extract)
        if (activeMeta?.type === 'container-child' && overMeta?.type === 'root') {
            moveContainerChildToRoot(activeMeta, overMeta, context);
            return;
        }

        // Case 4: Move Root -> Container (become child)
        // We insert relative to a container child
        if (activeMeta?.type === 'root' && overMeta?.type === 'container-child') {
            insertRootIntoContainer(activeMeta, overMeta, context);
            return;
        }

        // Case 5: Root Reordering
        if (activeMeta?.type === 'root' && overMeta?.type === 'root') {
            if (activeId !== overId && activeMeta.index !== overMeta.index) {
                moveRootBlock(activeMeta.index, overMeta.index, context);
            }
            return;
        }
    }, [setBlocks, setDirty, setSelectedChild, setSelectedIndex, setLiveStatus]);


    // --- 4. NATIVE HTML5 DRAG (Palette -> Canvas) ---
    const handleDragStart = useCallback((type: BlockType) => (e: React.DragEvent) => {
        e.dataTransfer.setData('block-type', type);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('block-type') as BlockType;
        const movingChildRaw = e.dataTransfer.getData('move-container-child');
        const y = e.clientY;

        // Use ref for current blocks to avoid re-creating handler
        const currentBlocks = latestBlocksRef.current;
        let insertAt = currentBlocks.length;

        for (let i = 0; i < currentBlocks.length; i++) {
            const id = currentBlocks[i].id;
            const el = blockRefs.current[id];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (y < mid) { insertAt = i; break; }
        }

        if (movingChildRaw) {
            // Déplacement d'un enfant d'un conteneur vers le canvas principal
            try {
                const payload = JSON.parse(movingChildRaw);
                const { parentIndex, childId } = payload as { parentIndex: number; childId: string };
                // Safe read from current
                const parent = currentBlocks[parentIndex] as any;
                if (parent && parent.type === 'container') {
                    const child = (parent.children || []).find((c: any) => c.id === childId);
                    if (child) {
                        setBlocks(prev => {
                            const arr = [...prev];
                            const cont = arr[parentIndex] as any;
                            cont.children = (cont.children || []).filter((c: any) => c.id !== childId);
                            const clamped = Math.max(0, Math.min(insertAt, arr.length));
                            arr.splice(clamped, 0, child);
                            return arr;
                        });
                    }
                }
            } catch { }
        } else if (type) {
            addBlockAt(type, insertAt);
        }
        setIsCanvasDragOver(false);
    }, [blockRefs, setBlocks, addBlockAt, setIsCanvasDragOver]);


    // --- 5. MANUAL ABSOLUTE DRAG ---
    const absDragRef = useRef<{
        id: string | null;
        startX: number;
        startY: number;
        startTop: number;
        startLeft: number;
        // snap removed
        clamp: boolean;
        preserveRB: boolean;
        el: HTMLElement | null;
        container: HTMLElement | null;
        elW: number;
        elH: number;
    } | null>(null);

    const startAbsDrag = useCallback((e: React.MouseEvent, blk: any) => {
        if (viewMode !== 'edit') return;
        if (!(blk?.style?.position === 'absolute')) return;
        try {
            e.stopPropagation();
            const sx = e.clientX;
            const sy = e.clientY;
            const st = blk.style || {};
            const toNum = (v: any) => { const m = String(v || '').match(/^(\d+)/); return m ? parseInt(m[1], 10) : 0; };
            let startTop = toNum(st.top);
            let startLeft = toNum(st.left);
            // snapStep parsing removed

            const handleEl = e.currentTarget as HTMLElement;
            const el = handleEl.closest('[data-block-id]') as HTMLElement | null;
            const container = (el?.offsetParent as HTMLElement | null) || el?.parentElement || null;
            const rect = el ? el.getBoundingClientRect() : null;
            const elW = rect ? rect.width : 0;
            const elH = rect ? rect.height : 0;
            const clamp = !!st.absoluteClamp;
            const preserveRB = !!st.absolutePreserveRB;

            try {
                if ((!('top' in st) || startTop === 0) && st.bottom != null && container) {
                    const ch = (container as HTMLElement).clientHeight || 0;
                    const bottom = toNum(st.bottom);
                    if (ch > 0 && elH > 0) startTop = Math.max(0, ch - bottom - elH);
                }
                if ((!('left' in st) || startLeft === 0) && st.right != null && container) {
                    const cw = (container as HTMLElement).clientWidth || 0;
                    const right = toNum(st.right);
                    if (cw > 0 && elW > 0) startLeft = Math.max(0, cw - right - elW);
                }
            } catch { }

            absDragRef.current = { id: blk.id, startX: sx, startY: sy, startTop, startLeft, clamp, preserveRB, el: el || null, container: container || null, elW, elH };

            const onMove = (ev: MouseEvent) => {
                const ref = absDragRef.current; if (!ref) return;
                const dx = ev.clientX - ref.startX; const dy = ev.clientY - ref.startY;
                let top = ref.startTop + dy; let left = ref.startLeft + dx;

                // Snapping logic removed

                if (ref.clamp && ref.container) {
                    const cw = ref.container.clientWidth || 0;
                    const ch = ref.container.clientHeight || 0;
                    const maxLeft = cw > 0 ? Math.max(0, cw - (ref.elW || 0)) : undefined;
                    const maxTop = ch > 0 ? Math.max(0, ch - (ref.elH || 0)) : undefined;
                    if (maxLeft !== undefined) left = Math.max(0, Math.min(left, maxLeft)); else left = Math.max(0, left);
                    if (maxTop !== undefined) top = Math.max(0, Math.min(top, maxTop)); else top = Math.max(0, top);
                } else {
                    top = Math.max(0, top); left = Math.max(0, left);
                }

                // Prepare updates
                // Convert left (px) to x (%)
                let xPercent = 0;
                if (ref.container && ref.container.clientWidth > 0) {
                    xPercent = (left / ref.container.clientWidth) * 100;
                    // Round to 2 decimals
                    xPercent = Math.round(xPercent * 100) / 100;
                }

                setBlocks(prev => {
                    const deep = (arr: any[]): any[] => arr.map(b => {
                        if (b.id === ref.id) {
                            // Update root geometry props + specific styles if needed (e.g. preserveRB)
                            // For simplicity in flattening, we prioritize x/y.
                            // However, strictly adhering to 'flattening', we should avoid style.top/left.
                            // We ignore preserveRB for now as it relies on style.right/bottom which we are moving away from or replacing.
                            return { ...b, x: xPercent, y: top };
                        }
                        if ((b as any).children) return { ...b, children: deep((b as any).children) };
                        if ((b as any).columns) return { ...b, columns: ((b as any).columns || []).map((col: any[]) => deep(col)) };
                        return b;
                    });
                    return deep(prev as any);
                });
            };
            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                absDragRef.current = null;
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        } catch { }
    }, [viewMode, setBlocks]);


    return React.useMemo(() => ({
        sensors,
        activeDragType,
        handleDndKitDragStart,
        handleDndKitDragEnd,
        handleDragStart,
        handleDrop,
        startAbsDrag
    }), [
        sensors,
        activeDragType,
        handleDndKitDragStart,
        handleDndKitDragEnd,
        handleDragStart,
        handleDrop,
        startAbsDrag
    ]);
}
