import { useEffect } from 'react';
import { Block } from '@/types/cms';
import { EditorMode } from '../editor/types';


interface UseCanvasInteractionProps {
    viewMode: EditorMode;
    blocks: Block[];
    setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;
    selectedChild: { parentId: string; childId: string } | null;
    setSelectedChild: (child: { parentId: string; childId: string } | null) => void;
    inspectorContainerRef: React.RefObject<HTMLElement>;
    themeContainerRef: React.RefObject<HTMLElement>;
    blockRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
    handleSave: () => void;
    undo: () => void;
    redo: () => void;
    nextFocusBlockId: string | null;
    setNextFocusBlockId: (id: string | null) => void;
    showTutorial: boolean;
    endTour: () => void;
    showQuickSectionsModal: boolean;
    closeQuickSectionsModal: () => void;
    quickPreviewSection: any | null;
    setQuickPreviewSection: (section: any | null) => void;
    findBlockById: (items: Block[], id: string) => Block | null;
    setShowThemeModal: (show: boolean) => void;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    setShowInspector: React.Dispatch<React.SetStateAction<boolean>>;
    focusModeActive: boolean;
}

export function useCanvasInteraction({
    viewMode,
    blocks,
    setBlocks,
    selectedIndex,
    setSelectedIndex,
    selectedChild,
    // setSelectedChild, // Unused
    inspectorContainerRef,
    themeContainerRef,
    blockRefs,
    handleSave,
    undo,
    redo,
    nextFocusBlockId,
    setNextFocusBlockId,
    showTutorial,
    endTour,
    showQuickSectionsModal,
    closeQuickSectionsModal,
    quickPreviewSection,
    setQuickPreviewSection,
    findBlockById,
    setShowThemeModal,
    setShowPalette,
    setShowInspector,
    focusModeActive,
}: UseCanvasInteractionProps) {

    // Keyboard shortcut: Save (Cmd/Ctrl + S)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const meta = isMac ? e.metaKey : e.ctrlKey;
            if (!meta) return;
            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || '').toLowerCase();
            const isEditable = tag === 'input' || tag === 'textarea' || (target?.isContentEditable ?? false);
            if (isEditable) return;
            if (e.key.toLowerCase() === 's' && meta) {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave]);

    // Keyboard shortcuts: Undo/Redo
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const meta = isMac ? e.metaKey : e.ctrlKey;
            if (!meta) return;
            // avoid intercepting when typing in input/textarea/contenteditable
            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || '').toLowerCase();
            const isEditable = tag === 'input' || tag === 'textarea' || (target?.isContentEditable ?? false);
            if (isEditable) return;
            if (e.key.toLowerCase() === 'z' && meta && e.shiftKey) {
                e.preventDefault();
                redo();
            } else if (e.key.toLowerCase() === 'z' && meta) {
                e.preventDefault();
                undo();
            } else if (e.key.toLowerCase() === 'y' && meta) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [undo, redo]);

    // Focus the inspector when a block (or child) is selected
    useEffect(() => {
        if (viewMode !== 'edit') return;
        if (selectedIndex !== null || selectedChild !== null) {
            setTimeout(() => inspectorContainerRef.current?.focus({ preventScroll: true }), 0);
        }
    }, [selectedIndex, selectedChild, viewMode, inspectorContainerRef]);

    // Focus/open the theme panel when switching to theme mode
    useEffect(() => {
        if (viewMode === 'theme') {
            setShowThemeModal(true);
            setTimeout(() => themeContainerRef.current?.focus({ preventScroll: true }), 0);
        } else {
            setShowThemeModal(false);
        }
    }, [viewMode, setShowThemeModal, themeContainerRef]);

    // Keyboard nudge for absolute-positioned block: arrows = 1px, Shift+arrows = 10px
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (viewMode !== 'edit') return;
            const key = e.key;
            if (!(key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight')) return;
            // avoid interfering when typing
            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || '').toLowerCase();
            const isEditable = tag === 'input' || tag === 'textarea' || (target?.isContentEditable ?? false);
            if (isEditable) return;
            // Identify selected block
            let blk: any = null;
            if (selectedChild) {
                const { parentId, childId } = selectedChild;
                const parent = findBlockById(blocks, parentId) as any;
                if (parent?.type === 'container') blk = parent.children?.find((c: any) => c.id === childId);
                else if (parent?.type === 'columns') {
                    for (const col of (parent.columns || [])) {
                        const found = col?.find((c: any) => c.id === childId);
                        if (found) { blk = found; break; }
                    }
                }
            } else if (selectedIndex !== null) {
                blk = blocks[selectedIndex] as any;
            }
            if (!blk) return;
            const st = blk.style || {};
            if (st.position !== 'absolute') return;
            const step = e.shiftKey ? 10 : 1;
            let dx = 0, dy = 0;
            if (key === 'ArrowLeft') dx = -step;
            if (key === 'ArrowRight') dx = step;
            if (key === 'ArrowUp') dy = -step;
            if (key === 'ArrowDown') dy = step;
            e.preventDefault();
            const toNum = (v: any) => { const m = String(v || '').match(/^(\d+)/); return m ? parseInt(m[1], 10) : 0; };
            const id = blk.id;
            // Measure for preserveRB and/or clamp
            const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
            const container = (el?.offsetParent as HTMLElement | null) || el?.parentElement || null;
            const rect = el ? el.getBoundingClientRect() : null;
            const elW = rect ? rect.width : 0; const elH = rect ? rect.height : 0;
            const cw = container ? (container as HTMLElement).clientWidth || 0 : 0;
            const ch = container ? (container as HTMLElement).clientHeight || 0 : 0;
            setBlocks(prev => {
                const deep = (arr: any[]): any[] => arr.map(b => {
                    if (b.id === id) {
                        let top = toNum((b as any).style?.top);
                        let left = toNum((b as any).style?.left);
                        top = Math.max(0, top + dy);
                        left = Math.max(0, left + dx);
                        if ((b as any).style?.absoluteClamp && container) {
                            const maxLeft = cw > 0 ? Math.max(0, cw - elW) : undefined;
                            const maxTop = ch > 0 ? Math.max(0, ch - elH) : undefined;
                            if (maxLeft !== undefined) left = Math.max(0, Math.min(left, maxLeft));
                            if (maxTop !== undefined) top = Math.max(0, Math.min(top, maxTop));
                        }
                        let ns: any;
                        if ((b as any).style?.absolutePreserveRB && container) {
                            const right = cw > 0 ? Math.max(0, cw - left - elW) : 0;
                            const bottom = ch > 0 ? Math.max(0, ch - top - elH) : 0;
                            ns = { ...((b as any).style || {}), right: `${right}px`, bottom: `${bottom}px`, top: undefined, left: undefined };
                        } else {
                            ns = { ...((b as any).style || {}), top: `${top}px`, left: `${left}px`, right: undefined, bottom: undefined };
                        }
                        return { ...b, style: ns };
                    }
                    if ((b as any).children) return { ...b, children: deep((b as any).children) };
                    if ((b as any).columns) return { ...b, columns: ((b as any).columns || []).map((col: any[]) => deep(col)) };
                    return b;
                });
                return deep(prev as any);
            });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewMode, blocks, selectedIndex, selectedChild, findBlockById, setBlocks]);


    // After structural changes, move focus to requested block if any
    useEffect(() => {
        if (!nextFocusBlockId) return;
        const el = blockRefs.current[nextFocusBlockId];
        if (el) {
            setTimeout(() => { el.focus({ preventScroll: true }); }, 0);
        }
        setNextFocusBlockId(null);
    }, [blocks, nextFocusBlockId, blockRefs, setNextFocusBlockId]);

    // Escape to close tour
    useEffect(() => {
        if (!showTutorial) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); endTour(); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showTutorial, endTour]);

    // Escape to close Quick Sections
    useEffect(() => {
        if (!showQuickSectionsModal) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (quickPreviewSection) {
                    setQuickPreviewSection(null);
                    return;
                }
                closeQuickSectionsModal();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showQuickSectionsModal, quickPreviewSection, closeQuickSectionsModal, setQuickPreviewSection]);

    const goToBlock = (id: string, index: number) => {
        try {
            setSelectedIndex(index);
            // We assume setShowAltPanel is handled outside or passed. 
            // But the original code called setShowAltPanel(false). 
            // We might need an extra prop for that if we want to be exact, or we just rely on parent to handle UI state reset?
            // For now, we will add the prop if needed, or better, return this function to the parent.
            // Ah, the logic is mixed. 
            // Let's assume the parent handles `setShowAltPanel(false)` if we expose a `goToBlock` wrapper.
            // But here we are just defining re-usable logic.

            const el = blockRefs.current[id];
            if (el) {
                // el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => { try { el.focus({ preventScroll: true }); } catch { } }, 350);
            }
        } catch { }
    };

    const toggleFocusMode = () => {
        if (focusModeActive) {
            setShowPalette(true);
            setShowInspector(true);
        } else {
            setShowPalette(false);
            setShowInspector(false);
        }
    };

    return {
        goToBlock,
        toggleFocusMode,
    };
}
