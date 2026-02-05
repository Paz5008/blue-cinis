import React, { useCallback } from 'react';
import { Block, BlockType, ThemeConfig } from '@/types/cms';
import { EditorMeta } from '../types';
import { createBlockInstance } from '../EditorUtils';
import { Dispatch, SetStateAction } from 'react';
import { getTemplateByKey } from '@/lib/cms/templates';

// Define the interface for the props required by the hook
interface UseBlockOperationsProps {
    blocks: Block[];
    setBlocks: Dispatch<SetStateAction<Block[]>>; // Legacy setBlocks from useEditorBlocks
    addBlock: (type: BlockType, index?: number) => void;
    removeBlock: (index: number) => void;
    duplicateBlock: (index: number) => void;
    updateBlock: (updatedBlock: Block) => void;
    setSelectedIndex: (index: number | null) => void;
    setNextFocusBlockId: (id: string | null) => void;
    setLiveStatus: (status: string) => void;
    setMeta: Dispatch<SetStateAction<EditorMeta>>;
    artistData: any;
    isBanner: boolean;
    // Extra dependencies for specific operations
    rememberBlock: (type: BlockType) => void;
    setPostInsertChecklist: (value: any) => void;
    theme: ThemeConfig;
    oeuvreOptions: any[];
    getHeroBg: any;
    pickUpload: (seed: number) => string | undefined;
    getLoremImages: (count?: number, seed?: number) => any[];
}

export function useBlockOperations({
    blocks,
    setBlocks,
    addBlock: baseAddBlock, // The robust one from useEditorBlocks
    removeBlock: baseRemoveBlock,
    duplicateBlock: baseDuplicateBlock,
    updateBlock: baseUpdateBlock,
    setSelectedIndex,
    setNextFocusBlockId,
    setLiveStatus,
    setMeta,
    artistData,
    isBanner,
    rememberBlock,
    setPostInsertChecklist,
    theme,
    oeuvreOptions,
    getHeroBg,
    pickUpload,
    getLoremImages,
}: UseBlockOperationsProps) {

    // 1. ADD BLOCK
    const handleAddBlock = useCallback((type: BlockType) => {
        rememberBlock(type);
        // Use the robust base addBlock which handles device specificity
        baseAddBlock(type);

        // Sidebar logic for Banner titles
        if (isBanner) {
            setMeta(prevMeta => {
                const trimmedTitle = (prevMeta?.title || '').trim();
                // If title is empty/default, auto-set it based on artist name
                if (!trimmedTitle && artistData?.name) {
                    return {
                        ...prevMeta,
                        title: `${artistData.name} — Bandeau Blue Cinis`,
                    };
                }
                return prevMeta;
            });
        }
    }, [rememberBlock, baseAddBlock, isBanner, setMeta, artistData]);

    // 2. ADD BLOCK AT INDEX
    const addBlockAt = useCallback((type: BlockType, index: number) => {
        rememberBlock(type);
        baseAddBlock(type, index);

        if (isBanner) {
            setMeta(prevMeta => {
                const trimmedTitle = (prevMeta?.title || '').trim();
                if (!trimmedTitle && artistData?.name) {
                    return {
                        ...prevMeta,
                        title: `${artistData.name} — Bandeau Blue Cinis`,
                    };
                }
                return prevMeta;
            });
        }
    }, [rememberBlock, baseAddBlock, isBanner, setMeta, artistData]);

    // 3. ADD STRUCTURAL BLOCK (Container/Columns)
    const handleAddStructuralBlock = useCallback((key: string) => {
        const ctx = {
            createBlock: createBlockInstance,
            artistData,
            theme,
            oeuvreOptions,
            getHeroBg,
            pickUpload,
            getLoremImages,
        };

        try {
            const newBlocks: Block[] = getTemplateByKey(key, ctx);
            if (newBlocks && newBlocks.length > 0) {
                // We add multiple blocks at once
                setBlocks(prev => [...prev, ...newBlocks]);

                // Select the first new block
                setSelectedIndex(blocks.length);
                setNextFocusBlockId(newBlocks[0].id);
                setLiveStatus(`Structure ajoutée`);

                // If it is a container/column, we might want to auto-open post insert checklist?
                // Editor.tsx used setPostInsertChecklist only for 'container' or 'columns' sometimes?
                // In the manual impl (not template), it did.
                // In handleAddStructuralBlock (line 914), it DOES NOT seem to setPostInsertChecklist.
                // So we follow Editor.tsx behavior: no checklist for templates unless specified.
            }
        } catch (e) {
            console.error("Error generating template:", e);
        }
    }, [artistData, theme, oeuvreOptions, getHeroBg, pickUpload, getLoremImages, setBlocks, blocks.length, setSelectedIndex, setNextFocusBlockId, setLiveStatus]);


    // 4. UPDATE BLOCK AT INDEX
    const updateBlockAtIndex = useCallback((index: number, updated: Block) => {
        // baseUpdateBlock uses ID, so it is safer than index if we have the block
        baseUpdateBlock(updated);
    }, [baseUpdateBlock]);

    // 5. CONVERT BLOCK
    const convertBlock = useCallback((blockId: string, targetType: BlockType) => {
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === blockId);
            if (index === -1) return prev;
            const sourceBlock = prev[index];

            // 1. Common Properties to preserve
            const commonProps = {
                style: sourceBlock.style,
                x: sourceBlock.x,
                y: sourceBlock.y,
                width: sourceBlock.width,
                height: sourceBlock.height,
                rotation: sourceBlock.rotation,
                zIndex: sourceBlock.zIndex,
                showOnDesktop: sourceBlock.showOnDesktop,
                showOnMobile: sourceBlock.showOnMobile,
            };

            // 2. Create new block instance
            const newBlock = createBlockInstance(targetType);

            // 3. Apply common props
            Object.assign(newBlock, commonProps);

            // 4. Data Mapping (Empty State Preservation)
            if (sourceBlock.type === 'image' && targetType === 'oeuvre') {
                // Image -> Oeuvre: Reset to empty selection
                Object.assign(newBlock, {
                    artworks: [],
                    columns: 1,
                    showTitle: true,
                    layout: 'grid',
                });
            }
            else if (sourceBlock.type === 'oeuvre' && targetType === 'image') {
                // Oeuvre -> Image: Reset to placeholder
                Object.assign(newBlock, {
                    src: '',
                    altText: '',
                    alignment: 'center',
                });
            }

            // Replace in array
            const next = [...prev];
            next[index] = newBlock;
            return next;
        });

        // Update selection to new block (ID changed)
        // Actually, createBlockInstance generates a new ID.
        // We might want to KEEP the ID? 
        // If we keep the ID, React might not unmount/remount correctly if component type changes?
        // Usually safer to change ID when changing Type to force fresh render.
        // But we need to update selection.
        // The `setBlocks` above is async/batched. We can't know the new ID easily unless we generate it outside.
        // Wait, we generated `newBlock` above. We know its ID.
        // However `setSelectedIndex` uses index. Index is preserved.
        // `setNextFocusBlockId` might be needed?

    }, [setBlocks, oeuvreOptions]);

    return React.useMemo(() => ({
        handleAddBlock,
        addBlockAt,
        handleAddStructuralBlock,
        updateBlockAtIndex,
        convertBlock,
        // Expose bases if needed, or wrap them
        removeBlock: baseRemoveBlock,
        duplicateBlock: baseDuplicateBlock,
        updateBlock: baseUpdateBlock
    }), [
        handleAddBlock,
        addBlockAt,
        handleAddStructuralBlock,
        updateBlockAtIndex,
        baseRemoveBlock,
        baseDuplicateBlock,
        baseUpdateBlock
    ]);
}
