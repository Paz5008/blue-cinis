import { useState, useCallback, useEffect } from 'react';
import type { BlockType } from '@/types/cms';
import type { PaletteView, QuickSectionFilter } from '../types';

/**
 * UI State for the Editor - consolidated from multiple useState calls
 */
export interface EditorUIState {
    // View/Mode
    device: 'desktop' | 'mobile';
    viewMode: 'edit' | 'theme' | 'preview';

    // Panel visibility
    showPalette: boolean;
    showInspector: boolean;
    paletteView: PaletteView;

    // Selection
    selectedIndex: number | null;
    selectedChild: { parentId: string; childId: string } | null;
    nextFocusBlockId: string | null;

    // ARIA
    liveStatus: string;
    liveAssertive: string;

    // UI Details
    debugOutlines: boolean;
    isFocusMode: boolean;
    quickSectionFilter: QuickSectionFilter;
    expandedQuickFamily: string | null;
    altHelpOpenId: string | null;

    // Temporary UI state
    postInsertChecklist: { sectionKey: string; label: string; steps: string[]; accentColor?: string } | null;

    // Recent blocks persistence
    recentBlocks: BlockType[];
}

export interface EditorUIActions {
    setDevice: (device: 'desktop' | 'mobile') => void;
    setViewMode: (mode: 'edit' | 'theme' | 'preview') => void;
    setShowPalette: (show: boolean) => void;
    setShowInspector: (show: boolean) => void;
    setPaletteView: (view: PaletteView) => void;
    setSelectedIndex: (index: number | null) => void;
    setSelectedChild: (child: { parentId: string; childId: string } | null) => void;
    setNextFocusBlockId: (id: string | null) => void;
    setLiveStatus: (status: string) => void;
    setLiveAssertive: (status: string) => void;
    setDebugOutlines: (show: boolean) => void;
    setIsFocusMode: (focus: boolean) => void;
    setQuickSectionFilter: (filter: QuickSectionFilter) => void;
    setExpandedQuickFamily: (family: string | null) => void;
    setAltHelpOpenId: (id: string | null) => void;
    setPostInsertChecklist: (checklist: EditorUIState['postInsertChecklist']) => void;
    rememberBlock: (type: BlockType) => void;
    toggleFocusMode: () => void;
}

interface UseEditorUIStateOptions {
    isBanner: boolean;
    allowedBlockTypes: BlockType[];
}

/**
 * Hook to manage all UI-related state for the Editor component.
 * Consolidates ~20 useState calls into a single hook for cleaner Editor.tsx.
 */
export function useEditorUIState({
    isBanner,
    allowedBlockTypes,
}: UseEditorUIStateOptions): EditorUIState & EditorUIActions {
    // View/Mode
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [viewMode, setViewMode] = useState<'edit' | 'theme' | 'preview'>('edit');

    // Panel visibility
    const [showPalette, setShowPalette] = useState(true);
    const [showInspector, setShowInspector] = useState(true);
    const [paletteView, setPaletteView] = useState<PaletteView>(() => (isBanner ? 'sections' : 'blocks'));

    // Selection
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedChild, setSelectedChild] = useState<{ parentId: string; childId: string } | null>(null);
    const [nextFocusBlockId, setNextFocusBlockId] = useState<string | null>(null);

    // ARIA
    const [liveStatus, setLiveStatus] = useState<string>('');
    const [liveAssertive, setLiveAssertive] = useState<string>('');

    // UI Details
    const [debugOutlines, setDebugOutlines] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [quickSectionFilter, setQuickSectionFilter] = useState<QuickSectionFilter>('all');
    const [expandedQuickFamily, setExpandedQuickFamily] = useState<string | null>(null);
    const [altHelpOpenId, setAltHelpOpenId] = useState<string | null>(null);

    // Temporary UI
    const [postInsertChecklist, setPostInsertChecklist] = useState<EditorUIState['postInsertChecklist']>(null);

    // Recent blocks with localStorage persistence
    const [recentBlocks, setRecentBlocks] = useState<BlockType[]>([]);

    // Load recent blocks from localStorage
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem('cmsRecentBlocks');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;
            const filtered = (parsed as BlockType[]).filter(type => allowedBlockTypes.includes(type));
            setRecentBlocks(filtered);
        } catch { /* ignore */ }
    }, [allowedBlockTypes]);

    // Persist recent blocks to localStorage
    useEffect(() => {
        try {
            window.localStorage.setItem('cmsRecentBlocks', JSON.stringify(recentBlocks));
        } catch { /* ignore */ }
    }, [recentBlocks]);

    // Filter recentBlocks when allowedBlockTypes changes
    useEffect(() => {
        setRecentBlocks(prev => {
            const filtered = prev.filter(type => allowedBlockTypes.includes(type));
            if (filtered.length === prev.length) return prev;
            return filtered;
        });
    }, [allowedBlockTypes]);

    const rememberBlock = useCallback((type: BlockType) => {
        if (!allowedBlockTypes.includes(type)) return;
        setRecentBlocks(prev => {
            const next = [type, ...prev.filter(t => t !== type)];
            return next.slice(0, 6);
        });
    }, [allowedBlockTypes]);

    const toggleFocusMode = useCallback(() => {
        setIsFocusMode(prev => !prev);
        if (!isFocusMode) {
            setShowPalette(false);
            setShowInspector(false);
        } else {
            setShowPalette(true);
            setShowInspector(true);
        }
    }, [isFocusMode]);

    return {
        // State
        device,
        viewMode,
        showPalette,
        showInspector,
        paletteView,
        selectedIndex,
        selectedChild,
        nextFocusBlockId,
        liveStatus,
        liveAssertive,
        debugOutlines,
        isFocusMode,
        quickSectionFilter,
        expandedQuickFamily,
        altHelpOpenId,
        postInsertChecklist,
        recentBlocks,

        // Actions
        setDevice,
        setViewMode,
        setShowPalette,
        setShowInspector,
        setPaletteView,
        setSelectedIndex,
        setSelectedChild,
        setNextFocusBlockId,
        setLiveStatus,
        setLiveAssertive,
        setDebugOutlines,
        setIsFocusMode,
        setQuickSectionFilter,
        setExpandedQuickFamily,
        setAltHelpOpenId,
        setPostInsertChecklist,
        rememberBlock,
        toggleFocusMode,
    };
}
