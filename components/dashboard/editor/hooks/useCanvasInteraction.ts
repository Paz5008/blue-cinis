import { useEffect } from 'react';
import { Block } from '@/types/cms';
import { EditorMode } from '../types';

interface UseCanvasInteractionProps {
    viewMode: EditorMode;
    activeBlockId: string | null;
    blocksData: Record<string, Block>;
    updateBlock: (id: string, updateFn: (b: Block) => Block) => void;
    blockRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
    nextFocusBlockId: string | null;
    setNextFocusBlockId: (id: string | null) => void;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    setShowInspector: React.Dispatch<React.SetStateAction<boolean>>;
    showPalette: boolean;
    showInspector: boolean;
}

export function useCanvasInteraction({
    viewMode,
    activeBlockId,
    blocksData,
    updateBlock,
    blockRefs,
    nextFocusBlockId,
    setNextFocusBlockId,
    setShowPalette,
    setShowInspector,
    showPalette,
    showInspector,
}: UseCanvasInteractionProps) {

    // Keyboard nudge for absolute-positioned block
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (viewMode !== 'edit') return;
            const key = e.key;
            if (!(key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight')) return;

            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || '').toLowerCase();
            const isEditable = tag === 'input' || tag === 'textarea' || (target?.isContentEditable ?? false);
            if (isEditable) return;

            if (!activeBlockId) return;
            const blk = blocksData[activeBlockId];
            if (!blk) return;

            // Check if absolute positioned
            const st = blk.style || {};
            if (st.position !== 'absolute') return;

            const step = e.shiftKey ? 10 : 1;
            let dx = 0, dy = 0;
            if (key === 'ArrowLeft') dx = -step;
            if (key === 'ArrowRight') dx = step;
            if (key === 'ArrowUp') dy = -step;
            if (key === 'ArrowDown') dy = step;

            e.preventDefault();

            // Logic to calculate new position
            const toNum = (v: any) => { const m = String(v || '').match(/^(\d+)/); return m ? parseInt(m[1], 10) : 0; };

            // Measure for clamping (simplified, assuming we rely on current style values mainly)
            // If we need container dimensions, we use blockRefs.
            const el = blockRefs.current[activeBlockId];
            const container = (el?.offsetParent as HTMLElement | null) || el?.parentElement || null;
            const rect = el ? el.getBoundingClientRect() : null;
            const elW = rect ? rect.width : 0;
            const elH = rect ? rect.height : 0;
            const cw = container ? (container as HTMLElement).clientWidth || 0 : 0;
            const ch = container ? (container as HTMLElement).clientHeight || 0 : 0;

            updateBlock(activeBlockId, (b) => {
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
            });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewMode, activeBlockId, blocksData, updateBlock, blockRefs]);

    // After structural changes, move focus
    useEffect(() => {
        if (!nextFocusBlockId) return;
        const el = blockRefs.current[nextFocusBlockId];
        if (el) {
            setTimeout(() => { el.focus(); }, 0);
        }
        setNextFocusBlockId(null);
    }, [nextFocusBlockId, blockRefs, setNextFocusBlockId]);

    const goToBlock = (id: string) => {
        const el = blockRefs.current[id];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { try { el.focus(); } catch { } }, 350);
        }
    };

    const toggleFocusMode = () => {
        const active = !showPalette && !showInspector;
        if (active) {
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
