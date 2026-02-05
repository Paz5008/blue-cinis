import { useState, useCallback, useMemo } from 'react';
import type { Block, ThemeConfig } from '@/types/cms';
import type { EditorMeta } from '@/components/dashboard/editor/types';

export interface EditorState {
    blocksData: Record<string, Block>;
    desktopLayout: string[];
    theme: ThemeConfig;
    meta: EditorMeta;
}

export function useEditorHistory(initialState: EditorState) {
    const [history, setHistory] = useState<EditorState[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = history[currentIndex];

    // Helper to calculate canUndo/canRedo
    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    const update = useCallback((recipe: (draft: EditorState) => void) => {
        setHistory(prev => {
            const current = prev[currentIndex];
            // Deep clone simple strategy for now, or use immer if available. 
            // Since we don't have immer installed/confirmed, we'll suggest using spread carefully 
            // OR assumes 'recipe' is just returning new state if we change signature.
            // But the signature `recipe: (draft: EditorState) => void` implies mutability (Immer pattern).
            // Travels used Immer internally likely.
            // To replace quickly without Immer: we change signature or implement basic mutation cloning.
            // For safety, let's assume we need to clone.

            const newState = JSON.parse(JSON.stringify(current)); // Deep clone (expensive but safe for now)
            recipe(newState);

            const newHistory = prev.slice(0, currentIndex + 1);
            return [...newHistory, newState];
        });
        setCurrentIndex(prev => prev + 1);
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (canUndo) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [canUndo]);

    const redo = useCallback(() => {
        if (canRedo) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [canRedo]);

    // Alias for compatibility
    const updateBlocks = update;

    return {
        blocks: state, // Keeping prop name 'blocks' for compatibility
        state,
        update,
        updateBlocks,
        undo,
        redo,
        canUndo,
        canRedo,
    };
}
