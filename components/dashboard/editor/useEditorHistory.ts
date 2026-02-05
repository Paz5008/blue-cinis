import { useState, useRef, useEffect, useCallback } from 'react';
import type { Block, ThemeConfig } from '../../../types/cms';
import type { EditorMeta } from './types';

export interface Snapshot {
    blocksData: Record<string, Block>;
    desktopLayout: string[];
    theme: ThemeConfig;
    meta: EditorMeta;
}

export interface LegacySnapshot {
    blocks: Block[];
    theme: ThemeConfig;
    meta: EditorMeta;
}

interface UseEditorHistoryProps {
    blocksData: Record<string, Block>;
    setBlocksData: React.Dispatch<React.SetStateAction<Record<string, Block>>>;
    desktopLayout: string[];
    setDesktopLayout: React.Dispatch<React.SetStateAction<string[]>>;
    theme: ThemeConfig;
    setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
    meta: EditorMeta;
    setMeta: React.Dispatch<React.SetStateAction<EditorMeta>>;
    setDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useEditorHistory({
    blocksData,
    setBlocksData,
    desktopLayout,
    setDesktopLayout,
    theme,
    setTheme,
    meta,
    setMeta,
    setDirty,
}: UseEditorHistoryProps) {
    const [history, setHistory] = useState<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] });
    const HISTORY_LIMIT = 100;

    // Keep track of the last committed snapshot
    const lastSnapshotRef = useRef<Snapshot>({ blocksData, desktopLayout, theme, meta });

    // During programmatic state changes (undo/redo/import/preset), suspend snapshot recording
    const suspendHistoryRef = useRef(false);

    // Initialize the last snapshot on first mount
    useEffect(() => {
        lastSnapshotRef.current = { blocksData, desktopLayout, theme, meta };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Record snapshot on change
    useEffect(() => {
        if (suspendHistoryRef.current) return;

        setHistory(h => {
            const nextPast = [...h.past, lastSnapshotRef.current];
            const trimmedPast = nextPast.length > HISTORY_LIMIT ? nextPast.slice(nextPast.length - HISTORY_LIMIT) : nextPast;
            return { past: trimmedPast, future: [] };
        });

        lastSnapshotRef.current = { blocksData, desktopLayout, theme, meta };
        setDirty(true);
    }, [blocksData, desktopLayout, theme, meta, setDirty]);

    // Undo/Redo handlers
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    const undo = useCallback(() => {
        if (!canUndo) return;
        const current: Snapshot = { blocksData, desktopLayout, theme, meta };
        const prev = history.past[history.past.length - 1];

        suspendHistoryRef.current = true;
        setHistory(h => ({ past: h.past.slice(0, -1), future: [current, ...h.future] }));

        lastSnapshotRef.current = prev;
        setBlocksData(prev.blocksData);
        setDesktopLayout(prev.desktopLayout);
        setTheme(prev.theme);
        setMeta(prev.meta);

        // Allow normal recording on next user change
        setTimeout(() => { suspendHistoryRef.current = false; }, 0);
        setDirty(true);
    }, [canUndo, blocksData, desktopLayout, theme, meta, history.past, setBlocksData, setDesktopLayout, setTheme, setMeta, setDirty]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        const current: Snapshot = { blocksData, desktopLayout, theme, meta };
        const next = history.future[0];

        suspendHistoryRef.current = true;
        setHistory(h => ({ past: [...h.past, current], future: h.future.slice(1) }));

        lastSnapshotRef.current = next;
        setBlocksData(next.blocksData);
        setDesktopLayout(next.desktopLayout);
        setTheme(next.theme);
        setMeta(next.meta);

        setTimeout(() => { suspendHistoryRef.current = false; }, 0);
        setDirty(true);
    }, [canRedo, blocksData, desktopLayout, theme, meta, history.future, setBlocksData, setDesktopLayout, setTheme, setMeta, setDirty]);

    const resetHistoryInternal = useCallback((newSnapshot: Snapshot) => {
        setHistory({ past: [], future: [] });
        lastSnapshotRef.current = newSnapshot;
    }, []);

    return {
        undo,
        redo,
        canUndo,
        canRedo,
        suspendHistoryRef,
        resetHistoryInternal,
    };
}
