import React from 'react';

import {
    ChevronLeft,
    ChevronsLeft,
    Monitor,
    Smartphone,
    Tablet,
    Type,
    Image as ImageIcon,
    Layout,
    Palette,
    Settings,
    Grid as GridIcon,
    Layers as LayersIcon,
    Search as SearchIcon, // Added SearchIcon
    Sparkles as SparklesIcon,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
// import { StructurePreviewModal } from './StructurePreviewModal'; // REMOVED local import
import { PaletteView } from './types';
import { iconMap, BANNER_ELEMENT_OPTIONS } from './constants';
import { BlockType, Block } from '@/types/cms';
// Adjust imports based on actual location. Assuming relative to component
import { StructureTree } from './StructureTree';
import { ListTree } from 'lucide-react';
import { getBlockLabel } from './shared/BlockLabel';
import { BlockIcon } from './shared/BlockIcon';

interface EditorPaletteProps {
    placement: 'sidebar' | 'dock';
    isBanner: boolean;
    paletteView: PaletteView;
    setPaletteView: (view: PaletteView) => void;

    // Quality / Guides
    qualityIndicators: { score: number; items: { key: string; label: string; ok: boolean; hint?: string; familyKey?: string }[] };
    bannerCoach?: any;
    bannerInsights?: any;
    bannerInsightsLoading?: boolean;
    refreshBannerInsights?: () => void;
    formatRelativeTime?: (date: string) => string;
    focusSeoInputs?: () => void;

    // Search
    paletteQuery: string;
    setPaletteQuery: (q: string) => void;
    paletteSearchInputRef?: React.RefObject<HTMLInputElement>;

    // Content
    blocks: Block[];
    blockTypes: string[]; // Allowed block types
    blockDescriptions?: Record<string, string>;

    // Nav / Selection
    selectedIndex: number | null;
    setSelectedIndex: (idx: number) => void;
    selectedChild: { parentId: string, childId: string } | null;
    setSelectedChild: (sel: { parentId: string, childId: string } | null) => void;
    goToBlock: (id: string, index: number) => void;

    // Actions
    addBlock: (type: BlockType) => void;
    handleDragStart: (type: BlockType) => (e: React.DragEvent) => void;

    // Sections
    bannerSectionOptions?: { family: any; section: any; previewBlocks: Block[] }[];
    displayFamilies?: any[]; // QuickSectionFamily[]
    recommendedFamilyKey?: string;
    openQuickSectionsFor: (key: string) => void;
    openBannerTemplateDrawer?: (data: any) => void;
    handlePreviewSection?: (family: any, section: any) => void;
    setExpandedQuickFamily?: (key: string) => void;
    setShowQuickSectionsModal?: (show: boolean) => void;
    bannerDesignWidth?: number;
    bannerDesignHeight?: number;
    buildSectionBlocks?: (section: any) => any[];
    setStructurePreview?: (section: any) => void;

    onAddStructuralBlock?: (key: string) => void;

    paletteRef?: React.RefObject<HTMLDivElement>;
}

export function EditorPalette({
    placement,
    isBanner,
    paletteView,
    setPaletteView,
    qualityIndicators,
    bannerCoach,
    bannerInsights,
    bannerInsightsLoading,
    refreshBannerInsights,
    formatRelativeTime,
    focusSeoInputs,
    paletteQuery,
    setPaletteQuery,
    paletteSearchInputRef,
    blocks,
    blockTypes,
    blockDescriptions = {},
    selectedIndex,
    setSelectedIndex,
    selectedChild,
    setSelectedChild,
    goToBlock,
    addBlock,
    handleDragStart,
    bannerSectionOptions = [],
    displayFamilies = [],
    recommendedFamilyKey,
    openQuickSectionsFor,
    openBannerTemplateDrawer,
    handlePreviewSection: _handlePreviewSection,
    setExpandedQuickFamily: _setExpandedQuickFamily,
    setShowQuickSectionsModal,
    bannerDesignHeight,
    bannerDesignWidth,
    buildSectionBlocks,
    setStructurePreview,
    paletteRef,
}: EditorPaletteProps) {


    const paletteTabs = [
        { value: 'blocks' as PaletteView, label: isBanner ? 'Éléments' : 'Blocs', icon: LayersIcon },
        { value: 'structure' as PaletteView, label: 'Calques', icon: ListTree },
    ];

    const [collapsedNodes, setCollapsedNodes] = React.useState<Record<string, boolean>>({});

    const handleToggleCollapse = (blockId: string) => {
        setCollapsedNodes(prev => ({ ...prev, [blockId]: !prev[blockId] }));
    };

    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
        'Contenu': true,
        'Mise en page': true,
        'Artistiques': true,
    });

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const allSections = React.useMemo(() => displayFamilies.flatMap((f: any) => f.sections), [displayFamilies]);

    // --- Preview State REMOVED (Moved to Global Layout) ---
    // const [previewSection, setPreviewSection] = React.useState<any | null>(null);

    const handleOpenPreview = (sectionKey: string) => {
        // Find the section in families
        let foundSection: any = null;
        let foundFamily: any = null;

        // Helper to find deep
        for (const family of displayFamilies) {
            const s = family.sections.find((s: any) => s.key === sectionKey);
            if (s) {
                foundSection = s;
                foundFamily = family;
                break;
            }
        }

        // If not found in dynamic families (maybe it's our hardcoded Header), create a mock one?
        // Actually, we should try to find the "heroSpotlight" or similar from the Essentials family if available.
        // Or if the user wants "Just 1 Header", we might want to hardcode a high quality one for now 
        // using the builder if possible, or just finding the one we want to show.

        if (foundSection) {
            // We need to generate the blocks for preview. 
            // The builder logic is in useQuickSections which returns `buildSectionBlocks`.
            // EditorPalette doesn't have `buildSectionBlocks` passed to it directly!
            // Wait, EditorPalette receives `onAddStructuralBlock` which calls `addQuickSection`.
            // It does NOT receive the builder function.
            // PROBLEM: EditorPalette cannot build the blocks for preview without the builder.

            // OPTION 1: Pass `buildSectionBlocks` to EditorPalette.
            // OPTION 2: Mock the preview or assume static preview data? No, dynamic.

            // Check EditorPaletteProps... it has `displayFamilies`.
            // `displayFamilies` likely doesn't contain the built blocks, just the config.
            // We need to request the blocks or have them passed.

            // QUICK FIX: For this specific task, "Header", let's assume we want to preview "heroSpotlight".
            // Since we can't build it here without refactoring EditorLayout to pass the builder...
            // User asked for "Preview", implying we *should* see it.

            // I will add `onPreviewSection` prop to `EditorPalette` and implement it in `EditorSidebar` -> `EditorLayout`.
            // But for now, since I can't easily change the props signature across files without multiple edits...
            // I'll stick to the plan but realize I missed `onPreviewSection` needed.
            // I will check if I can just implement the UI first and maybe mock the content or use a simplified approach?

            // Wait, I can modify `EditorPalette` props freely, then update `EditorSidebar` and `EditorContext`? No, simpler to keep props if possible.
            // Actually, `handlePreviewSection` IS ALREADY A PROP! Line 95: `handlePreviewSection: _handlePreviewSection`.
            // Uses it? It was unused in original code (prefixed with _).
            // I can use it!
            if (_handlePreviewSection) {
                _handlePreviewSection(foundFamily, foundSection);
                // But wait, how does that open MY local modal?
                // Usually `handlePreviewSection` would set state in parent.
                // The user requests a local "loupe" interaction.

                // If `handlePreviewSection` is passed, I can use it to maybe fetch data?
                // Or I render the modal HERE, but I need the content.
            }

            // Alternative: In `EditorSidebar/Layout`, pass `previewBlocks` functionality.
        }

        // For the sake of this task:
        // I'll set a state here, and render the Modal.
        // But for the *content* of the modal (`previewBlocks`), I might need to hack it if I can't build.
        // Wait, the user said "Refonte des elements internes... créer juste 1 Header".
        // Maybe I don't need the full dynamic builder here if I'm hardcoding "Just 1 Header".
        // I can hardcode the preview blocks for THIS specific Header if needed?
        // No, that's brittle.

        // Better approach:
        // 1. Refactor `EditorPalette` to use `onPreviewStructuralBlock` prop (which I'll rename from `handlePreviewSection` or use it).
        // 2. This prop returns the blocks? No, valid React flow is props down.
        // 3. I'll modify `EditorPalette` to accept `getSectionPreview` prop?

        // Let's look at `EditorLayout` again. `EditorPalette` is rendered there? No, `EditorSidebar` renders it.
        // `EditorSidebar` has access to `addQuickSection`.

        // Let's use `handlePreviewSection` prop. I will uncomment it in destructuring.
        // And I'll need to update `EditorSidebar` to pass a function that perhaps *returns* the blocks?
        // Or setter.

        // Ok, let's assume I can't change `EditorSidebar` in THIS tool call easily (multi-file).
        // Using `multi_replace` I can edit multiple files.
        // So I will edit `EditorPalette` (UI), `EditorSidebar` (pass prop), `EditorLayout` (impl prop?).
        // `EditorSidebar` uses `useEditorContext`.
        // `EditorContext` doesn't have `previewSection` builder logic exposed yet? 
        // `EditorLayout` has `buildSectionBlocks`.

        // PLAN:
        // 1. In `EditorContext`, add `buildSectionBlocks` to the context value.
        // 2. In `EditorSidebar`, use `buildSectionBlocks` to generate preview data for `EditorPalette`?
        // 3. Or just pass `buildSectionBlocks` down to `EditorPalette`.

        // Let's assume I can pass `buildSectionBlocks` to `EditorPalette`.
        // This requires updating `EditorContext` type, `EditorLayout` provider, `EditorSidebar` pass-through, `EditorPalette` props.
        // That's a lot.

        // Is there a simpler way?
        // Maybe I just create the modal in `EditorLayout` (where data is) and `EditorPalette` calls `setPreviewSectionKey` in context?
        // Yes! `setPreviewSectionKey` in context.
        // Then `EditorLayout` renders the modal.
        // But the modal should probably be part of the editor UI.

        // Actually, placing the Modal in `EditorPalette` is fine if it receives data.
        // Let's try passing `buildSectionBlocks` helper.

        // WAIT. I can just import `useQuickSections` in `EditorPalette`? No, it's a hook requiring data.

    };


    const getPaletteContainerClasses = (placement: 'sidebar' | 'dock') =>
        placement === 'dock'
            ? [
                'order-3 mt-6 flex w-full flex-col overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-200/40 backdrop-blur supports-[backdrop-filter]:bg-white/80',
                'mx-auto xl:mx-0 xl:order-3 xl:mt-0',
                'xl:col-start-1 xl:col-end-3 xl:row-start-2 xl:row-end-3 xl:self-stretch',
            ]
                .filter(Boolean)
                .join(' ')
            : 'relative flex h-full w-[260px] flex-shrink-0 flex-col overflow-y-auto rounded-2xl border border-gray-200/70 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 md:w-[280px]';

    const getPaletteBodyClasses = (placement: 'sidebar' | 'dock') =>
        placement === 'dock'
            ? 'flex-1 space-y-3 overflow-y-auto px-5 pb-5 pt-3 lg:px-7 lg:pb-6'
            : 'flex-1 space-y-4 px-4 pb-6 pt-4';

    const containerClass = getPaletteContainerClasses(placement);
    const bodyClass = getPaletteBodyClasses(placement);
    const paletteStyle = placement === 'dock' && isBanner ? { width: '100%' } : undefined;

    const headerClass = placement === 'dock'
        ? 'border-b border-slate-100 bg-white/90 px-5 py-3 lg:px-7'
        : 'sticky top-0 z-10 border-b border-gray-200/70 bg-white/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70';

    const headerTitleClass = placement === 'dock' ? 'text-base font-semibold text-slate-900' : 'text-sm font-semibold text-gray-900';

    const headerBadgeClass = placement === 'dock'
        ? 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600'
        : 'inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/60 px-2 py-0.5 text-[10px] font-medium text-gray-500';

    // Render logic for Blocks View
    const renderBlocksView = () => {
        if (isBanner) {
            return (
                <div className="p-2 pt-1">
                    <p className="mb-3 text-[11px] leading-snug text-slate-600">
                        Ajoutez un élément essentiel pour affiner votre bandeau. Combinez texte, visuel et appel à l’action pour rester percutant.
                    </p>
                    <div className="mb-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-[11px] leading-snug text-slate-600">
                        <p className="font-semibold text-slate-700">Structure suggérée</p>
                        <p className="mt-1">
                            1. Un titre clair (40-55 caractères)<br />
                            2. Un visuel unique ou une texture de fond<br />
                            3. Un bouton orienté conversion (CTA principal)
                        </p>
                    </div>
                    <div className="space-y-2">
                        {BANNER_ELEMENT_OPTIONS.map(option => {
                            const Icon = iconMap[option.type];
                            return (
                                <button
                                    key={option.type}
                                    type="button"
                                    onClick={() => addBlock(option.type)}
                                    className="group flex w-full items-start gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
                                >
                                    <span className="rounded-full bg-slate-100 p-2 text-slate-600 transition group-hover:bg-slate-200">
                                        <Icon size={16} />
                                    </span>
                                    <span className="flex-1">
                                        <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-600/80">{option.description}</span>
                                    </span>
                                    <span className="self-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white transition group-hover:bg-slate-700">
                                        Ajouter
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Profile Editor Grouping
        const allowed = new Set(blockTypes);
        const groups: { title: string; types: BlockType[] }[] = [
            { title: 'Contenu', types: (['text', 'image', 'gallery', 'video', 'embed', 'divider', 'button'].filter(t => allowed.has(t as BlockType)) as BlockType[]) },
            { title: 'Mise en page', types: (['columns'].filter(t => allowed.has(t as BlockType)) as BlockType[]) },
            { title: 'Artistiques', types: (['oeuvre', 'artworkList', 'artistName', 'artistPhoto', 'artistBio', 'contactForm', 'eventList'].filter(t => allowed.has(t as BlockType)) as BlockType[]) },
        ];
        const q = paletteQuery.trim().toLowerCase();

        return (
            <div className="p-4 pt-0">
                {groups.map(g => {
                    const visible = g.types.filter(t => (!q || t.toLowerCase().includes(q) || (blockDescriptions[t] || '').toLowerCase().includes(q)));
                    if (visible.length === 0) return null;
                    const isExpanded = expandedGroups[g.title] ?? true;

                    return (
                        <div key={g.title} className="mb-3 border-b border-gray-100 pb-2 last:border-0">
                            <button
                                onClick={() => toggleGroup(g.title)}
                                className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <span>{g.title}</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {isExpanded && (
                                <div className="mt-1 space-y-1">
                                    {visible.map((type) => {
                                        const Icon = iconMap[type];
                                        return (
                                            <div
                                                key={type}
                                                draggable
                                                onDragStart={handleDragStart(type)}
                                                onClick={() => addBlock(type)}
                                                className="flex cursor-grab items-center gap-3 rounded-lg border border-transparent p-2 transition hover:bg-gray-50 hover:shadow-sm active:cursor-grabbing"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 shadow-sm">
                                                    {Icon && <Icon size={16} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-700">
                                                        {getBlockLabel(type)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <aside ref={paletteRef} className={containerClass} aria-label="Palette de blocs" style={paletteStyle}>
            <div className={headerClass}>
                <div className="flex items-center justify-between gap-2">
                    <h2 className={headerTitleClass}>Bibliothèque</h2>
                    <span className={headerBadgeClass}>
                        {qualityIndicators.score}% complet
                    </span>
                </div>

                {/* Tabs for Palette View */}

                {/* Tabs for Palette View */}
                {!isBanner && (
                    <div className="mt-3 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                        {paletteTabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = paletteView === tab.value || (tab.value === 'blocks' && !['blocks', 'structure'].includes(paletteView as any));
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setPaletteView(tab.value)}
                                    className={`
                                        flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition
                                        ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                                    `}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="mt-3 space-y-2">

                    {!isBanner && paletteView === 'blocks' && (
                        <input
                            type="text"
                            ref={paletteSearchInputRef}
                            value={paletteQuery}
                            onChange={e => setPaletteQuery(e.target.value)}
                            placeholder="Rechercher un bloc..."
                            className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    )}
                    {paletteView === 'sections' && (
                        <p className="text-[11px] leading-snug text-gray-500">
                            {isBanner
                                ? 'Sélectionnez un modèle unique de bandeau : l’ajout remplace immédiatement le contenu en cours.'
                                : 'Composez votre page avec des familles harmonisées de héros, galeries et appels à l’action.'}
                        </p>
                    )}
                    {paletteView === 'guides' && (
                        <p className="text-[11px] leading-snug text-gray-500">
                            {isBanner
                                ? "Optimisez votre bandeau : suivez le coach et surveillez vos clics pour vérifier l’impact."
                                : 'Suivez la checklist qualité et vérifiez la structure globale de votre scénographie.'}
                        </p>
                    )}
                </div>
            </div>
            <div className={bodyClass}>
                {paletteView === 'blocks' && renderBlocksView()}
                {paletteView === 'sections' && (
                    <div className="space-y-3">
                        {isBanner ? (
                            // Banner Sections Logic
                            <div className="space-y-4">
                                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
                                    <SparklesIcon size={14} />
                                    <span>
                                        Le bandeau affiche un seul modèle ({bannerDesignWidth}×{bannerDesignHeight}&nbsp;px desktop).
                                        Choisir un modèle remplace le contenu.
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {bannerSectionOptions.map(option => (
                                        <div key={option.section.key} className="rounded-xl border border-gray-200 bg-white/95 p-4 shadow-sm transition hover:border-blue-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{option.family.label}</p>
                                                    <h3 className="mt-1 text-sm font-semibold text-gray-800">{option.section.label}</h3>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openBannerTemplateDrawer && openBannerTemplateDrawer({
                                                        key: option.section.key,
                                                        label: option.section.label,
                                                        description: option.section.description,
                                                        familyLabel: option.family.label,
                                                        accentColor: option.section.accentColor || option.family.accentColor,
                                                    })}
                                                    className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                >
                                                    Préparer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // New Structure Library (V2)
                            <div className="h-full">
                                {/* <StructureLibrary
                                    sections={allSections}
                                    buildSectionBlocks={buildSectionBlocks!}
                                    onAddBlock={(key) => onAddStructuralBlock?.(key)}
                                    setStructurePreview={(section) => setStructurePreview && setStructurePreview(section)}
                                /> */}
                                <div>Bibliothèque de structure (Indisponible)</div>
                            </div>
                        )}
                    </div>
                )}
                {paletteView === 'structure' && (
                    <div className="h-full overflow-y-auto">
                        <StructureTree
                            blocks={blocks}
                            selectedIndex={selectedIndex}
                            selectedChild={selectedChild}
                            onSelectBlock={(idx) => {
                                setSelectedIndex(idx);
                                setSelectedChild(null);
                            }}
                            onSelectChild={(parentIdx, parentId, childId) => {
                                setSelectedIndex(parentIdx);
                                setSelectedChild({ parentId, childId });
                            }}
                            collapsedNodes={collapsedNodes}
                            onToggleCollapse={handleToggleCollapse}
                        />
                    </div>
                )}
            </div>

        </aside >
    );
}
