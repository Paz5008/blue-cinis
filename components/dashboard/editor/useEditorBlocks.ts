import { useState, Dispatch, SetStateAction, useCallback, useMemo, useRef, useEffect } from 'react';
import { Block, BlockType, ThemeConfig, ArtistPageContent } from '@/types/cms';
import { useEditorHistory, type EditorState } from '@/hooks/useEditorHistory';
// Import legacy types for compatibility if needed, though we replaced the hook
import { type Snapshot, type LegacySnapshot } from './useEditorHistory';
import { EditorMeta } from './types';
import { createBlockInstance } from './EditorUtils';
import { arrayMove } from '@dnd-kit/sortable';

// Utility to flatten a tree of blocks into a map
const flattenBlocks = (nodes: Block[]): Record<string, Block> => {
    let acc: Record<string, Block> = {};
    nodes.forEach(node => {
        acc[node.id] = node;
        if (node.type === 'columns' && (node as any).columns) {
            (node as any).columns.forEach((col: Block[]) => {
                Object.assign(acc, flattenBlocks(col));
            });
        }
    });
    return acc;
};

interface UseEditorBlocksProps {
    initialContent: ArtistPageContent | { blocks: Block[] }; // Support migration from old format
    initialTheme: ThemeConfig;
    initialMeta: EditorMeta;
    isBanner?: boolean;
    setSelectedIndex: Dispatch<SetStateAction<number | null>>;
    setSelectedChild: Dispatch<SetStateAction<{ parentId: string; childId: string } | null>>;
    setNextFocusBlockId: Dispatch<SetStateAction<string | null>>;
    setLiveStatus: Dispatch<SetStateAction<string>>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useEditorBlocks({
    initialContent,
    initialTheme,
    initialMeta,
    isBanner = false,
    setSelectedIndex,
    setSelectedChild,
    setNextFocusBlockId,
    setLiveStatus,
    addToast,
}: UseEditorBlocksProps) {

    // --- State Initialization with Migration Logic ---
    const initialBlocksData = useMemo(() => {
        if ('blocksData' in initialContent) return initialContent.blocksData;
        const map: Record<string, Block> = {};
        if (Array.isArray((initialContent as any).blocks)) {
            (initialContent as any).blocks.forEach((b: Block) => { map[b.id] = b; });
        }
        return map;
    }, [initialContent]);

    const initialDesktopLayout = useMemo(() => {
        if ('layout' in initialContent && Array.isArray(initialContent.layout.desktop)) return initialContent.layout.desktop;
        if (Array.isArray((initialContent as any).blocks)) {
            return (initialContent as any).blocks.map((b: Block) => b.id);
        }
        return [];
    }, [initialContent]);

    // Use the new History Hook
    const { state, update, undo, redo, canUndo, canRedo } = useEditorHistory({
        blocksData: initialBlocksData,
        desktopLayout: initialDesktopLayout,
        theme: initialTheme,
        meta: initialMeta
    });

    const { blocksData, desktopLayout, theme, meta } = state;
    const [isDirty, setDirty] = useState(false);

    // Derived blocks array
    const blocks = useMemo(() => {
        const layoutIds = desktopLayout;
        return layoutIds.map(id => blocksData[id]).filter(Boolean);
    }, [blocksData, desktopLayout]);

    // --- Interaction Stability (Refs) ---
    // We use refs to access latest state in callbacks without breaking their stability (referential equality).
    // This allows Actions to be stable even if Data changes.
    const stateRef = useRef({ blocksData, desktopLayout, blocks });
    useEffect(() => {
        stateRef.current = { blocksData, desktopLayout, blocks };
    }, [blocksData, desktopLayout, blocks]);


    // Helper Wrappers to mimic setState for compatibility with existing logic
    const setBlocksData = useCallback((action: SetStateAction<Record<string, Block>>) => {
        update(draft => {
            if (typeof action === 'function') {
                draft.blocksData = (action as any)(draft.blocksData);
            } else {
                draft.blocksData = action;
            }
        });
    }, [update]);

    const setDesktopLayout = useCallback((action: SetStateAction<string[]>) => {
        update(draft => {
            if (typeof action === 'function') {
                draft.desktopLayout = (action as any)(draft.desktopLayout);
            } else {
                draft.desktopLayout = action;
            }
        });
    }, [update]);

    const setTheme = useCallback((action: SetStateAction<ThemeConfig>) => {
        update(draft => {
            if (typeof action === 'function') {
                draft.theme = (action as any)(draft.theme);
            } else {
                draft.theme = action;
            }
        });
        setDirty(true);
    }, [update]);

    const setMeta = useCallback((action: SetStateAction<EditorMeta>) => {
        update(draft => {
            if (typeof action === 'function') {
                draft.meta = (action as any)(draft.meta);
            } else {
                draft.meta = action;
            }
        });
        setDirty(true);
    }, [update]);


    const addBlock = useCallback((type: BlockType, index?: number, customBlock?: Block) => {
        const newBlock = customBlock || createBlockInstance(type, isBanner);
        const id = newBlock.id;
        const newPartials = flattenBlocks([newBlock]);

        update(draft => {
            // Update Data
            Object.assign(draft.blocksData, newPartials);

            // Update Layout
            const arr = [...draft.desktopLayout];
            const insertAt = index !== undefined ? index : arr.length;
            arr.splice(insertAt, 0, id);
            draft.desktopLayout = arr;
        });

        const { desktopLayout } = stateRef.current;
        setDirty(true);
        setSelectedIndex(index !== undefined ? index : desktopLayout.length); // Note: using ref here might be slightly off if update is async? 
        // update is synchronous in useEditorHistory (usually). 
        // Better: use the 'index' we calculated? 
        // If index undefined, we append. So it is prev length. 
        // Correct.
        setNextFocusBlockId(id);
        setLiveStatus(`Bloc ${type} ajouté`);
    }, [isBanner, setSelectedIndex, setNextFocusBlockId, setLiveStatus, update]);

    const removeBlock = useCallback((idOrIndex: string | number) => {
        const { desktopLayout, blocksData } = stateRef.current;
        const layoutIds = desktopLayout;
        let idToRemove: string | undefined;

        if (typeof idOrIndex === 'number') {
            idToRemove = layoutIds[idOrIndex];
        } else {
            idToRemove = idOrIndex;
        }

        if (!idToRemove) return;

        const block = blocksData[idToRemove];
        if (block) {
            const hasChildren = block.type === 'columns' && (block as any).columns?.some((col: any[]) => col.length > 0);
            if (hasChildren && !window.confirm('Ce bloc contient des enfants. Supprimer ?')) return;
        }

        update(draft => {
            draft.desktopLayout = draft.desktopLayout.filter(id => id !== idToRemove);
        });

        addToast(`Bloc retiré`, 'info');
        setSelectedIndex(null);
        setSelectedChild(null);
        setDirty(true);
    }, [addToast, setSelectedIndex, setSelectedChild, update]); // blocksData, desktopLayout removed deps

    const duplicateBlock = useCallback((index: number) => {
        const { desktopLayout, blocksData } = stateRef.current;
        const layoutIds = desktopLayout;
        const originalId = layoutIds[index];
        const originalBlock = blocksData[originalId];
        if (!originalBlock) return;

        const clone: Block = JSON.parse(JSON.stringify(originalBlock));
        clone.id = crypto.randomUUID();

        update(draft => {
            draft.blocksData[clone.id] = clone;
            const arr = [...draft.desktopLayout];
            arr.splice(index + 1, 0, clone.id);
            draft.desktopLayout = arr;
        });

        setDirty(true);
        setSelectedIndex(index + 1);
        setNextFocusBlockId(clone.id);
        setLiveStatus('Bloc dupliqué');
    }, [setSelectedIndex, setNextFocusBlockId, setLiveStatus, update]); // blocksData, desktopLayout removed deps

    const updateBlock = useCallback((idOrBlock: string | Block, updateFn?: (b: Block) => Block) => {
        update(draft => {
            if (typeof idOrBlock === 'string') {
                if (!updateFn) return;
                const existing = draft.blocksData[idOrBlock];
                if (!existing) return;
                draft.blocksData[idOrBlock] = updateFn(existing);
            } else {
                draft.blocksData[idOrBlock.id] = idOrBlock;
            }
        });
        setDirty(true);
    }, [update]);

    const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
        update(draft => {
            draft.desktopLayout = arrayMove(draft.desktopLayout, fromIndex, toIndex);
        });
        setDirty(true);
    }, [update]);

    const reorderBlocks = useCallback((activeId: string, overId: string) => {
        const { desktopLayout } = stateRef.current;
        // We use pure ref access for indices calculation before update
        const layoutIds = desktopLayout;
        const oldIndex = layoutIds.indexOf(activeId);
        const newIndex = layoutIds.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            update(draft => {
                draft.desktopLayout = arrayMove(draft.desktopLayout, oldIndex, newIndex);
            });
            setDirty(true);
        }
    }, [update]); // desktopLayout removed dep

    const resetHistory = useCallback((snapshot: LegacySnapshot | Snapshot) => {
        // Convert legacy format to new format if needed
        let newSnapshot: { blocksData: Record<string, Block>; desktopLayout: string[]; theme: ThemeConfig; meta: EditorMeta };

        if ('blocks' in snapshot) {
            // Legacy format
            const flatData: Record<string, Block> = {};
            (snapshot.blocks || []).forEach(b => { flatData[b.id] = b; });
            newSnapshot = {
                blocksData: flatData,
                desktopLayout: (snapshot.blocks || []).map(b => b.id),
                theme: snapshot.theme,
                meta: snapshot.meta,
            };
        } else {
            // New format
            newSnapshot = snapshot;
        }

        // Apply the snapshot state
        update(draft => {
            draft.blocksData = newSnapshot.blocksData;
            draft.desktopLayout = newSnapshot.desktopLayout;
            draft.theme = newSnapshot.theme;
            draft.meta = newSnapshot.meta;
        });

        setDirty(false); // Mark as clean since we just loaded
        setSelectedIndex(null);
        setSelectedChild(null);
    }, [update, setSelectedIndex, setSelectedChild]);

    const suspendHistoryRef = { current: false };

    const replaceContent = useCallback((payload: { blocks: Block[], theme: ThemeConfig, meta: EditorMeta }) => {
        const { blocks: newBlocks, theme: newTheme, meta: newMeta } = payload;
        const newLayoutIds = newBlocks.map(b => b.id);
        const flatData = flattenBlocks(newBlocks);

        update(draft => {
            draft.blocksData = flatData;
            draft.desktopLayout = newLayoutIds;
            draft.theme = newTheme;
            draft.meta = newMeta;
        });

        setDirty(true);
        setSelectedIndex(null);
        setSelectedChild(null);
    }, [update, setSelectedIndex, setSelectedChild]);

    const setBlocks = useCallback((newBlocksAction: SetStateAction<Block[]>) => {
        const { blocks } = stateRef.current;
        update(draft => {
            let newBlocks: Block[];
            if (typeof newBlocksAction === 'function') {
                newBlocks = newBlocksAction(blocks);
            } else {
                newBlocks = newBlocksAction;
            }

            const newLayoutIds = newBlocks.map(b => b.id);
            draft.desktopLayout = newLayoutIds;
            const flatUpdates = flattenBlocks(newBlocks);
            Object.assign(draft.blocksData, flatUpdates);
        });
        setDirty(true);
    }, [update]); // blocks removed dep

    return {
        blocks,
        blocksData,
        desktopLayout,
        setBlocksData,
        setDesktopLayout,
        setBlocks,
        theme, setTheme, meta, setMeta, isDirty, setDirty,
        undo, redo, canUndo, canRedo, resetHistory, suspendHistoryRef,
        addBlock,
        removeBlock,
        duplicateBlock,
        updateBlock,
        moveBlock,
        reorderBlocks,
        replaceContent,
    };
}
