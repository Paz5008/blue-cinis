import { createContext, useContext, MutableRefObject } from 'react';
import { useEditorBlocks } from '../editor/useEditorBlocks';
import { EditorPageKey, PaletteView, ArtistData, QuickSectionFamily } from '../editor/types';
import { ThemeConfig, BlockType, Block } from '@/types/cms';

// Import block registrations to populate the registry
import '@/lib/cms/blockRegistrations';

// --- Type Definitions ---

// Raw return from the hook is mixed. We'll split it logically.
type EditorBlocksHook = ReturnType<typeof useEditorBlocks>;

// 1. Actions Interface (Stable Functions)
export interface EditorActions {
    // UI Setters
    setViewMode: (mode: 'edit' | 'theme' | 'preview') => void;
    setShowPalette: (show: boolean) => void;
    setShowInspector: (show: boolean) => void;
    setDevice: (d: 'desktop' | 'mobile') => void;
    setCanvasWidth: (w: number | undefined) => void;
    setDebugOutlines: (v: boolean) => void;
    setPaletteView: (v: PaletteView) => void;
    setStructurePreview: (section: any | null) => void;

    // Editor Hook Actions (Stable)
    addBlock: EditorBlocksHook['addBlock'];
    removeBlock: EditorBlocksHook['removeBlock'];
    duplicateBlock: EditorBlocksHook['duplicateBlock'];
    updateBlock: EditorBlocksHook['updateBlock'];
    moveBlock: EditorBlocksHook['moveBlock'];
    reorderBlocks: EditorBlocksHook['reorderBlocks'];
    replaceContent: EditorBlocksHook['replaceContent'];
    setBlocksData: EditorBlocksHook['setBlocksData'];
    setDesktopLayout: EditorBlocksHook['setDesktopLayout'];
    setBlocks: EditorBlocksHook['setBlocks'];
    setTheme: EditorBlocksHook['setTheme'];
    setMeta: EditorBlocksHook['setMeta'];
    setDirty: EditorBlocksHook['setDirty'];

    // History Actions
    undo: EditorBlocksHook['undo'];
    redo: EditorBlocksHook['redo'];
    resetHistory: EditorBlocksHook['resetHistory'];

    // Selection Actions
    setSelectedIndex: (i: number | null) => void;
    setSelectedChild: (v: { parentId: string; childId: string } | null) => void;

    // Custom Actions
    onPublish: () => void;
    save: () => Promise<void>;
    goToBlock: (id: string, index: number) => void;
    toggleFocusMode: () => void;
    addQuickSection: (key: string) => void;

    // DnD Refs/Callbacks (Stable)
    blockRefs: MutableRefObject<Record<string, HTMLElement | null>>;
    handlePaletteDragStart: (type: any) => (e: React.DragEvent) => void;

    // Render Helpers (Stable functions)
    sanitizeRichText: (html: string) => string;
    buildSectionBlocks?: (section: any) => any[];
}

// 2. State Interface (Changing Data)
export interface EditorState {
    // UI State
    viewMode: 'edit' | 'theme' | 'preview';
    showPalette: boolean;
    showInspector: boolean;
    device: 'desktop' | 'mobile';
    pageKey: string;
    isBanner: boolean;
    isPoster: boolean;
    canvasWidth?: number;
    debugOutlines: boolean;
    focusModeActive: boolean;
    /** Active la synchronisation automatique en mode preview */
    previewSyncEnabled: boolean;

    // Publication Status
    publicationStatus: 'draft' | 'published';
    publishing: boolean;
    autoSaving: boolean;
    liveStatus: string;

    // Palette State
    paletteView: PaletteView;

    // External Data
    artistData: ArtistData;
    previewUrl?: string;
    oeuvreOptions: any[];
    families?: QuickSectionFamily[];
    blockTypes: BlockType[];

    // Structure Preview
    structurePreview: any | null;

    // Editor Data (from Hook)
    blocks: EditorBlocksHook['blocks'];
    blocksData: EditorBlocksHook['blocksData'];
    desktopLayout: EditorBlocksHook['desktopLayout'];
    theme: EditorBlocksHook['theme'];
    meta: EditorBlocksHook['meta'];
    isDirty: EditorBlocksHook['isDirty'];
    canUndo: EditorBlocksHook['canUndo'];
    canRedo: EditorBlocksHook['canRedo'];

    // Selection State
    selectedIndex: number | null; // Currently passed manually in Editor.tsx? Yes.
    selectedChild: { parentId: string; childId: string } | null;

    // Legacy/Misc
    saving: boolean;
    suspendHistoryRef: any; // It's a ref, technically stable, can be in Actions or State. Put in State if we access .current during render (bad practice) or Actions.
}

// Combined Type (Legacy Support)
export type EditorContextType = EditorState & EditorActions;


// --- Contexts ---

export const EditorActionsContext = createContext<EditorActions | null>(null);
export const EditorStateContext = createContext<EditorState | null>(null);

// --- Hooks ---

export const useEditorActions = () => {
    const context = useContext(EditorActionsContext);
    if (!context) {
        throw new Error('useEditorActions must be used within an EditorProvider');
    }
    return context;
};

export const useEditorState = () => {
    const context = useContext(EditorStateContext);
    if (!context) {
        throw new Error('useEditorState must be used within an EditorProvider');
    }
    return context;
};

// Legacy Hook: Returns UNION of both
export const useEditorContext = (): EditorContextType => {
    // We try to grab the split contexts first. 
    // If they exist, we merge them.
    // However, we are moving towards "Editor.tsx provides both".
    // But existing Editor.tsx provides one <EditorContext.Provider>.
    // To support progressive migration:
    // We can keep `EditorContext` (legacy) variable? 
    // NO. We want to FORCE the split in the Provider.

    const actions = useContext(EditorActionsContext);
    const state = useContext(EditorStateContext);

    // If we haven't updated Editor.tsx yet, this will fail.
    // So we must update Editor.tsx immediately after this file.
    if (!actions || !state) {
        throw new Error('useEditorContext must be used within an EditorProvider (Split Contexts)');
    }

    return { ...state, ...actions };
};
