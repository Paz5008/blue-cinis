import React from 'react';
import dynamic from 'next/dynamic';
import { useEditorContext } from '../EditorContext';
import { Block } from '@/types/cms';

// Dynamic Imports
const BlockInspector = dynamic(() => import('../../BlockInspector'), {
    loading: () => <div className="p-4 text-xs text-neutral-500">Chargement de l'inspecteur...</div>
});
const ThemeInspector = dynamic(() => import('../../ThemeInspector'), {
    loading: () => <div className="p-4 text-xs text-neutral-500">Chargement du thème...</div>
});

export const EditorInspector = () => {
    const context = useEditorContext();
    const {
        showInspector,
        viewMode,
        selectedChild,
        selectedIndex,
        blocks,
        blocksData, // Ensure this is available
        updateBlock,
        removeBlock,
        theme,
        setTheme,
        meta,
        setMeta,
        oeuvreOptions,
        pageKey,
        artistData,
        setSelectedIndex,
        setSelectedChild
    } = context;

    if (viewMode !== 'edit' && viewMode !== 'theme') return null;
    if (viewMode === 'edit' && !showInspector) return null;

    // Resolve active block
    let activeBlock: Block | null = null;
    if (viewMode === 'edit') {
        if (selectedChild?.childId) {
            activeBlock = blocksData[selectedChild.childId] || null;
        } else if (selectedIndex !== null && blocks[selectedIndex]) {
            activeBlock = blocks[selectedIndex];
        }
    }

    const handleClose = () => {
        setSelectedIndex(null);
        setSelectedChild(null);
    };

    const renderContent = () => {
        if (viewMode === 'theme') {
            return (
                <ThemeInspector
                    theme={theme}
                    meta={meta}
                    artistName={artistData?.name}
                    artist={artistData}
                    blocks={blocks}
                    pageKey={pageKey}
                    onChangeTheme={setTheme}
                    onChangeMeta={setMeta}
                    // settings={bannerSettings} // TODO: Banner settings context
                    // onChangeSettings={...}
                    setMediaPicker={() => { console.warn('setMediaPicker not implemented'); }}
                    onClose={() => {/* setViewMode('edit')? */ }}
                />
            );
        }

        if (viewMode === 'edit' && activeBlock) {
            return (
                <BlockInspector
                    key={activeBlock.id}
                    block={activeBlock}
                    oeuvreOptions={oeuvreOptions || []}
                    onUpdate={(updated: Block) => updateBlock(updated.id, () => updated)}
                    onClose={handleClose}
                    onDelete={(id: string) => {
                        if (confirm('Voulez-vous vraiment supprimer ce bloc ?')) {
                            removeBlock(id);
                            handleClose();
                        }
                    }}
                    pageKey={pageKey}
                />
            );
        }

        return (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center justify-center h-full">
                <p>Sélectionnez un bloc pour l'éditer</p>
            </div>
        );
    };

    return (
        <div className="w-[320px] shrink-0 h-full overflow-y-auto bg-white border-l border-gray-200 shadow-sm z-20 scrollbar-thin">
            {renderContent()}
        </div>
    );
};
