import React from 'react';
import { isColumnBlock, isImageBlock, isArtistPhotoBlock, type Block, BlockType } from '@/types/cms';
import { Plus, Trash2, Edit2, Layout, Type as TypeIcon, Image as ImageIcon, Box } from 'lucide-react';
import { createBlockInstance } from '@/lib/cms/blockFactory';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import type { InspectorProps } from './types';

export function ColumnsInspector({ block, onUpdate, tab, setMediaPicker, pageKey, setSelectedChild }: InspectorProps) {
    if (!isColumnBlock(block)) return null;
    const b = block;
    // columns is Block[][]
    const columns = b.columns || [];

    const countImagesMissingAlt = () => {
        let count = 0;
        const traverse = (node: Block) => {
            if (isImageBlock(node)) {
                if (!node.decorative && (!node.altText || node.altText === '' || /^image\d+$/i.test(node.altText))) {
                    count++;
                }
            }
            if (isColumnBlock(node)) {
                node.columns.forEach(col => col.forEach(traverse));
            }
        };
        traverse(block);
        return count;
    };

    const missingAltCount = countImagesMissingAlt();

    const handleAddBlock = (colIndex: number, type: BlockType) => {
        const newBlock = createBlockInstance(type);
        const newColumns = [...columns];
        if (!newColumns[colIndex]) newColumns[colIndex] = [];
        newColumns[colIndex] = [...newColumns[colIndex], newBlock];
        onUpdate({ ...block, columns: newColumns });
    };

    const handleDeleteBlock = (colIndex: number, childIndex: number) => {
        const newColumns = [...columns];
        newColumns[colIndex] = newColumns[colIndex].filter((_, idx) => idx !== childIndex);
        onUpdate({ ...block, columns: newColumns });
    };

    if (tab === 'content') {
        return (
            <InspectorSection title="Colonnes" defaultOpen>
                <div className="space-y-4">
                    {columns.map((col, colIdx) => (
                        <div key={colIdx} className="bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden">
                            <div className="px-3 py-2 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colonne {colIdx + 1}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleAddBlock(colIdx, 'text')}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                        title="Ajouter texte"
                                    >
                                        <TypeIcon size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleAddBlock(colIdx, 'image')}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                        title="Ajouter image"
                                    >
                                        <ImageIcon size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-2 space-y-2">
                                {col.length === 0 && (
                                    <div className="text-center py-2 text-xs text-slate-400 italic">Vide</div>
                                )}
                                {col.map((child, childIdx) => {
                                    let Icon = Box;
                                    if (child.type === 'text') Icon = TypeIcon;
                                    if (child.type === 'image') Icon = ImageIcon;

                                    return (
                                        <div key={child.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-100 shadow-sm group">
                                            <Icon size={14} className="text-slate-400" />
                                            <span className="text-xs font-medium text-slate-700 flex-1 truncate">
                                                {child.type === 'text' ? 'Texte' : child.type.charAt(0).toUpperCase() + child.type.slice(1)}
                                            </span>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedChild && setSelectedChild({ parentId: block.id, childId: child.id })}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Editer"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Supprimer cet élément ?')) handleDeleteBlock(colIdx, childIdx);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {missingAltCount > 0 && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-800 p-2 rounded text-xs">
                        Attention : {missingAltCount} image(s) dans ces colonnes n'ont pas de texte alternatif.
                    </div>
                )}
            </InspectorSection>
        );
    }

    if (tab === 'settings') {
        return (
            <>
                <CommonSettings block={block} onUpdate={onUpdate} />
                <InspectorSection title="Structure" defaultOpen>
                    <p className="text-xs text-slate-500">Pour ajouter ou supprimer des colonnes, utilisez les actions directes sur le canevas ou choisissez un preset de structure.</p>
                </InspectorSection>
            </>
        );
    }

    if (tab === 'styles') {
        return <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />;
    }

    return null;
}
