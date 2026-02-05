import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { EditorActionsContext, EditorStateContext, EditorContextType } from '../EditorContext';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { EditorInspector } from './EditorInspector';
// MobileCanvas removed
import { FreeFormCanvas } from '../../FreeFormCanvas';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useEditorBlocks } from '../useEditorBlocks';
import { useEditorDragDrop } from '../hooks/useEditorDragDrop';
import { useQuickSections } from '../useQuickSections';
import { EditorProps } from '../types';
import { sanitizeTextHtml } from '@/lib/sanitize';
import { UniversalBlockRenderer } from '@/components/cms/UniversalBlockRenderer'; // For DragOverlay
import { StructurePreviewModal } from '../StructurePreviewModal'; // Import Modal
import { BlockType, Block } from '@/types/cms'; // Import Block
import { resolveThemeTokens } from '@/lib/cms/themeTokens'; // Import this
import { useToast } from '@/context/ToastContext'; // Import Toast
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { saveArtistPageLayout } from '@/src/actions/save-layout';
import { KeyboardShortcutsModal } from '../modals/KeyboardShortcutsModal';

export default function EditorLayout(props: EditorProps) {
    const {
        initialContent,
        pageKey,
        artistData,
        previewUrl,
        oeuvreOptions = []
    } = props;

    // --- State Initialization ---
    const [viewMode, setViewMode] = useState<'edit' | 'theme' | 'preview'>('edit');
    // Device is now statically Desktop per user request (Mobile Editor Removed)
    const device = 'desktop';
    const [showPalette, setShowPalette] = useState(true);
    const [showInspector, setShowInspector] = useState(true);
    const [paletteView, setPaletteView] = useState<any>('blocks');
    const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
    const [saving, setSaving] = useState(false); // Saving state
    const [nextFocusBlockId, setNextFocusBlockId] = useState<string | null>(null);
    const { addToast } = useToast(); // Use Toast
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);

    // --- Helpers (Assets) ---
    const uploadsRef = useRef<string[]>([]);
    const manifestRef = useRef<any>(null);

    useEffect(() => {
        fetch('/api/uploads').then(r => r.ok ? r.json() : Promise.reject()).then(d => {
            const arr = Array.isArray(d?.media) ? d.media.map((m: any) => m.url) : [];
            uploadsRef.current = arr;
        }).catch(() => { });

        fetch('/uploads/manifest.json').then(r => r.ok ? r.json() : Promise.resolve({})).then(data => {
            manifestRef.current = data || {};
        }).catch(() => { });
    }, []);

    const pickUpload = useCallback((seed: number): string | undefined => {
        const arr = uploadsRef.current;
        if (!arr || arr.length === 0) return undefined;
        const index = Math.abs(seed) % arr.length;
        return arr[index];
    }, []);

    const getHeroBg = useCallback((presetKey: string): string | undefined => {
        const m = manifestRef.current;
        const fromManifest = m && m.hero && typeof m.hero[presetKey] === 'string' && m.hero[presetKey] ? m.hero[presetKey] : undefined;
        if (fromManifest) return fromManifest;
        const curated: Record<string, string> = {
            signature: '/hero-background3.avif',
            editorialPro: '/hero-background.avif',
            minimalClean: '/hero-background.avif',
            showcaseDeluxe: '/hero-background2.avif',
            portfolioMasonry: '/hero-background2.avif',
            boutique: '/hero-background.avif',
            default: '/hero-background.avif',
        };
        return curated[presetKey] || curated.default || pickUpload(0);
    }, [pickUpload]);

    const getLoremImages = useCallback((count: number = 8, seed: number = 0) => {
        const arr = uploadsRef.current || [];
        if (!arr || arr.length === 0) return [];
        const total = Math.min(count, Math.max(4, arr.length));
        return Array.from({ length: total }, (_, i) => ({
            id: self.crypto.randomUUID(),
            src: arr[(seed + i) % arr.length],
            alt: '',
        }));
    }, []);


    // --- Core Hooks ---
    // Lift state here
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedChild, setSelectedChild] = useState<{ parentId: string; childId: string } | null>(null);

    // Re-declare editor blocks with state
    const blocksHook = useEditorBlocks({
        initialContent: initialContent || {},
        initialTheme: props.initialContent?.theme, // Pass theme if needed
        initialMeta: props.initialContent?.meta,
        // device removed
        isBanner: pageKey === 'banner',
        addToast, // Use real toast
        setSelectedIndex,
        setSelectedChild,
        setNextFocusBlockId,
        setLiveStatus: () => { },
    });

    const themeTokens = useMemo(() => resolveThemeTokens(blocksHook.theme), [blocksHook.theme]);

    // --- Interaction Hook ---
    // Compute active block ID for interaction
    const activeBlockId = useMemo(() => {
        if (selectedChild) return selectedChild.childId;
        if (selectedIndex !== null && blocksHook.blocks[selectedIndex]) return blocksHook.blocks[selectedIndex].id;
        return null;
    }, [selectedChild, selectedIndex, blocksHook.blocks]);

    const interaction = useCanvasInteraction({
        viewMode,
        activeBlockId,
        blocksData: blocksHook.blocksData,
        updateBlock: blocksHook.updateBlock,
        blockRefs,
        nextFocusBlockId,
        setNextFocusBlockId,
        setShowPalette,
        setShowInspector,
        showPalette,
        showInspector,
    });

    // --- Actions ---
    const handleSave = useCallback(async () => {
        if (!artistData?.id) return;
        setSaving(true);
        try {
            await saveArtistPageLayout('desktop', {
                blocksData: blocksHook.blocksData, // Save using explicit key blocksData
                layout: {
                    desktop: blocksHook.desktopLayout,
                    // mobile removed
                },
                theme: blocksHook.theme,
                meta: blocksHook.meta,
            }, undefined, pageKey);
            blocksHook.setDirty(false);
            addToast('Sauvegarde effectuée', 'success');
        } catch (e) {
            const { editorLogger } = await import('@/lib/logger');
            editorLogger.error({ err: e }, 'Failed to save layout');
            addToast('Erreur lors de la sauvegarde', 'error');
        } finally {
            setSaving(false);
        }
    }, [artistData?.id, pageKey, /* device removed */ blocksHook.blocksData, blocksHook.desktopLayout, /* mobileLayout removed */ blocksHook.theme, blocksHook.meta, blocksHook.setDirty, addToast]);

    // --- Shortcuts ---
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const meta = isMac ? e.metaKey : e.ctrlKey;

            const target = e.target as HTMLElement | null;
            const tag = (target?.tagName || '').toLowerCase();
            const isEditable = tag === 'input' || tag === 'textarea' || (target?.isContentEditable ?? false);
            if (isEditable && !meta) return; // Allow meta shortcuts even in inputs usually, but safer to block?
            // Save works everywhere
            if (e.key.toLowerCase() === 's' && meta) {
                e.preventDefault();
                handleSave();
                return;
            }
            if (isEditable) return; // Block others in editable

            // Undo/Redo
            if (meta && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) blocksHook.redo();
                else blocksHook.undo();
            } else if (meta && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                blocksHook.redo();
            }

            // Keyboard shortcuts help (?) - only when not in editable
            if (e.key === '?' && !e.shiftKey && !meta) {
                e.preventDefault();
                setShowShortcutsModal(true);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave, blocksHook.undo, blocksHook.redo]);


    // --- Quick Sections Hook ---
    const { buildSectionBlocks, quickSectionLookup, families } = useQuickSections({
        artistData,
        themeTokens,
        theme: blocksHook.theme,
        oeuvreOptions,
        getLoremImages,
        pickUpload,
        getHeroBg,
        currentPage: (pageKey || 'profile') as any,
    });



    const addQuickSection = useCallback((key: string) => {
        const section = quickSectionLookup.get(key);
        if (!section) return;
        const newBlocks = buildSectionBlocks(section);
        // Add blocks flattened
        // Here we assume addBlock flattens. Wait, addBlock accepts ONE block.
        // buildSectionBlocks returns ARRAY of blocks.
        // We probably want to add them sequentially or as one group?
        // Usually quick section returns ONE container block? No, it returns Block[].
        // If it returns multiple, we iterate.
        newBlocks.forEach(b => {
            blocksHook.addBlock(b.type as BlockType, undefined, b);
        });
    }, [quickSectionLookup, buildSectionBlocks, blocksHook]);


    // --- DnD Hook ---
    const dnd = useEditorDragDrop({
        blocks: blocksHook.blocks,
        setBlocks: blocksHook.setBlocks, // Note: useEditorBlocks might not expose setBlocks directly but 'updateBlock' etc.
        // If setBlocks is exposed, good. If not, we might need to rely on 'moveBlock' etc.
        // useEditorBlocks usually exposes setBlocks for DnD reordering.
        // Checking useEditorBlocks.ts earlier view... yes it exposes setBlocks.
        addBlockAt: (type: BlockType, index: number) => blocksHook.addBlock(type, index),
        setDirty: blocksHook.setDirty,
        setSelectedIndex,
        setSelectedChild,
        setLiveStatus: () => { },
        blockRefs,
        setIsCanvasDragOver,
        viewMode
    });

    // --- Allowed Blocks Logic ---
    const allBlocks = React.useMemo<BlockType[]>(() => [
        'text', 'image', 'gallery', 'video', 'embed', 'divider', 'columns', 'button', 'oeuvre', 'artworkList', 'artistName', 'artistPhoto', 'artistBio', 'contactForm', 'eventList',
    ], []);
    const getAllowedBlocks = React.useCallback((k?: string): BlockType[] => {
        switch ((k || 'profile').toLowerCase()) {
            case 'banner': return ['text', 'image', 'button', 'columns'];
            case 'poster': return ['text', 'image', 'gallery', 'embed', 'divider', 'columns', 'artistName', 'artistPhoto', 'artistBio', 'oeuvre', 'artworkList', 'eventList'];
            default: return allBlocks;
        }
    }, [allBlocks]);
    const blockTypes = React.useMemo(() => getAllowedBlocks(pageKey), [getAllowedBlocks, pageKey]);

    // --- Structure Preview State ---
    const [structurePreview, setStructurePreview] = useState<any | null>(null);

    // --- Context Value ---
    const contextValue: EditorContextType = {
        ...blocksHook,
        viewMode,
        setViewMode,
        showPalette,
        setShowPalette,
        showInspector,
        setShowInspector,
        device: 'desktop',
        setDevice: () => { },
        debugOutlines: false,
        setDebugOutlines: () => { },
        focusModeActive: false,
        publicationStatus: 'draft',
        previewSyncEnabled: true,
        publishing: saving,
        autoSaving: false,
        liveStatus: '',
        pageKey: pageKey || 'profile',
        isBanner: pageKey === 'banner',
        isPoster: pageKey === 'poster',
        canvasWidth: undefined,
        setCanvasWidth: () => { },
        paletteView,
        setPaletteView,
        artistData: artistData,
        previewUrl,
        oeuvreOptions,
        sanitizeRichText: (html) => sanitizeTextHtml(html || '', (pageKey || 'profile') as any),
        blockTypes,

        // Actions
        save: handleSave,
        onPublish: () => { },
        saving,
        addQuickSection,
        goToBlock: interaction.goToBlock,
        toggleFocusMode: interaction.toggleFocusMode,

        // DnD
        blockRefs, // Add blockRefs
        handlePaletteDragStart: dnd.handleDragStart,

        // Data
        families,
        structurePreview,
        setStructurePreview,

        // State
        selectedIndex,
        setSelectedIndex,
        selectedChild,
        setSelectedChild,
        buildSectionBlocks, // Added for preview
    };

    // --- Real Mobile Guard ---
    const [isRealMobile, setIsRealMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmall = window.innerWidth < 1024; // iPad Pro limits
            setIsRealMobile(isTouch && isSmall);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isRealMobile) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Éditeur indisponible sur mobile</h1>
                <p className="text-gray-400">Pour garantir une expérience de création optimale, l'éditeur Blue Cinis Studio est uniquement accessible sur ordinateur.</p>
            </div>
        );
    }

    return (
        <EditorActionsContext.Provider value={contextValue}>
            <EditorStateContext.Provider value={contextValue}>
                <div className="flex flex-col h-screen bg-neutral-50 font-sans text-neutral-900 overflow-hidden">
                    <EditorToolbar />

                    <div
                        className="flex flex-1 overflow-hidden relative"
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsCanvasDragOver(true);
                        }}
                        onDrop={dnd.handleDrop}
                        onDragLeave={() => setIsCanvasDragOver(false)}
                    >
                        <EditorSidebar />

                        {/* Preview Mode Visual Indicator */}
                        {viewMode === 'preview' && (
                            <div className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-medium text-blue-600 flex items-center gap-2 shadow-sm backdrop-blur-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Mode Aperçu
                            </div>
                        )}

                        <div className="flex-1 overflow-auto bg-slate-50/50 relative flex flex-col items-center py-8">
                            <div
                                className="relative w-full h-full"
                                style={{ maxWidth: '100%', minHeight: '80vh' }}
                            >
                                <FreeFormCanvas
                                    width={1200} // Dynamic width - can be adjusted via context's setCanvasWidth
                                    renderBlock={(b: Block, i: number) => (
                                        <UniversalBlockRenderer
                                            block={b}
                                            index={i}
                                            context={{
                                                artist: artistData as any,
                                                sanitize: sanitizeTextHtml,
                                                searchString: '',
                                                isPreview: viewMode === 'preview',
                                                useNextLink: false,
                                                LinkComponent: 'a',
                                                pageKey: pageKey as any,
                                                isMobile: false,
                                                disablePositioning: false,
                                                debug: false
                                            }}
                                        />
                                    )}
                                    backgroundColor={blocksHook.theme.backgroundColor}
                                />
                            </div>
                        </div>

                        <EditorInspector />
                    </div>
                </div>
                {/* Portal-like Modals */}
                {structurePreview && (
                    <StructurePreviewModal
                        isOpen={!!structurePreview}
                        onClose={() => setStructurePreview(null)}
                        onConfirm={() => {
                            addQuickSection(structurePreview.key);
                            setStructurePreview(null);
                        }}
                        section={structurePreview}
                        artistData={artistData}
                    />
                )}
                <KeyboardShortcutsModal
                    open={showShortcutsModal}
                    onClose={() => setShowShortcutsModal(false)}
                />
            </EditorStateContext.Provider>
        </EditorActionsContext.Provider>
    );
};
