import React, { useRef, useState } from 'react';
import { useEditorContext } from '../EditorContext';
import { EditorPalette } from '../EditorPalette';
import { BLOCK_DESCRIPTIONS } from '../constants';

export const EditorSidebar = () => {
    const context = useEditorContext();
    const {
        showPalette,
        isBanner,
        paletteView,
        setPaletteView,
        addBlock,
        addQuickSection,
        artistData,
        blocks,
        blockTypes,
        handlePaletteDragStart,
        families,
        selectedIndex,
        setSelectedIndex,
        buildSectionBlocks,
        selectedChild,
        setSelectedChild
    } = context;

    const [paletteQuery, setPaletteQuery] = useState('');
    const paletteSearchInputRef = useRef<HTMLInputElement>(null);

    // Placeholder for non-critical features for now
    const goToBlock = () => { };
    const qualityIndicators = { score: 75, items: [] };

    if (!showPalette) return null;

    return (
        <div className="hidden lg:flex flex-col w-[340px] shrink-0 border-r border-gray-200 bg-white h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
            <EditorPalette
                placement="sidebar"
                isBanner={isBanner}
                paletteView={paletteView}
                setPaletteView={setPaletteView}

                // Search
                paletteQuery={paletteQuery}
                setPaletteQuery={setPaletteQuery}
                paletteSearchInputRef={paletteSearchInputRef}

                // Data
                blocks={blocks}
                blockTypes={blockTypes}
                blockDescriptions={BLOCK_DESCRIPTIONS}

                // Actions
                addBlock={addBlock}
                handleDragStart={handlePaletteDragStart}
                onAddStructuralBlock={addQuickSection}
                openQuickSectionsFor={addQuickSection} // Reusing same handler for now

                // Selection
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                selectedChild={selectedChild}
                setSelectedChild={setSelectedChild}
                goToBlock={goToBlock}

                // Banner / Extra
                qualityIndicators={qualityIndicators}
                displayFamilies={families || []}
                buildSectionBlocks={buildSectionBlocks}
                setStructurePreview={context.setStructurePreview} // Pass global setter
            />
        </div>
    );
};
