import React from 'react';
import { Block } from '@/types/cms';
import {
    ChevronRight,
    ChevronDown,
    Layout,
} from 'lucide-react';
import { iconMap } from './constants';

interface StructureTreeProps {
    blocks: Block[];
    selectedIndex: number | null;
    selectedChild: { parentId: string; childId: string } | null;
    onSelectBlock: (index: number) => void;
    onSelectChild: (parentIndex: number, parentId: string, childId: string) => void;
    collapsedNodes?: Record<string, boolean>;
    onToggleCollapse?: (blockId: string) => void;
}

export const StructureTree: React.FC<StructureTreeProps> = ({
    blocks,
    selectedIndex,
    selectedChild,
    onSelectBlock,
    onSelectChild,
    collapsedNodes = {},
    onToggleCollapse
}) => {

    const renderIcon = (type: string) => {
        const Icon = iconMap[type] || Layout;
        return <Icon size={14} className="text-gray-500" />;
    };

    const getLabel = (block: Block) => {
        if (block.type === 'text') {
            const text = (block as any).content?.substring(0, 20) || 'Texte';
            return text.replace(/<[^>]*>/g, '') || 'Texte vide';
        }
        return block.type.charAt(0).toUpperCase() + block.type.slice(1);
    };

    const renderBlockNode = (block: Block, index: number, depth: number = 0) => {
        const isSelected = selectedIndex === index && !selectedChild;
        const isParentOfSelected = selectedChild && blocks[index]?.id === selectedChild.parentId;

        // Only columns has nested children now
        const hasChildren = block.type === 'columns';
        const isCollapsed = collapsedNodes[block.id];

        return (
            <div key={block.id} className="select-none">
                <div
                    className={`
            flex items-center gap-2 py-1.5 px-2 text-sm rounded cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'hover:bg-gray-50 text-gray-700'}
            ${isParentOfSelected ? 'bg-gray-50' : ''}
          `}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(index);
                    }}
                >
                    {hasChildren && (
                        <button
                            className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleCollapse) onToggleCollapse(block.id);
                            }}
                        >
                            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                    {!hasChildren && <span className="w-4" />}

                    {renderIcon(block.type)}
                    <span className="truncate flex-1 font-medium">{getLabel(block)}</span>
                </div>

                {/* Render Children if Expanded - only columns now */}
                {!isCollapsed && hasChildren && (
                    <div className="border-l border-gray-100 ml-4">
                        {block.type === 'columns' && (block as any).columns?.map((col: Block[], colIdx: number) => (
                            <div key={`col-${block.id}-${colIdx}`}>
                                <div
                                    className="flex items-center gap-2 py-1 px-2 text-xs text-gray-400 uppercase font-semibold"
                                    style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                                >
                                    Colonne {colIdx + 1}
                                </div>
                                {col.map(child => renderChildNode(child, index, block.id, depth + 1))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderChildNode = (child: Block, parentIndex: number, parentId: string, depth: number) => {
        const isSelected = selectedChild?.childId === child.id;

        return (
            <div
                key={child.id}
                className={`
            flex items-center gap-2 py-1.5 px-2 text-sm rounded cursor-pointer transition-colors mb-0.5
            ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600'}
        `}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectChild(parentIndex, parentId, child.id);
                }}
            >
                {renderIcon(child.type)}
                <span className="truncate flex-1">{getLabel(child)}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-0.5 pb-10">
            {blocks.length === 0 && (
                <div className="p-4 text-center text-gray-400 italic text-sm">
                    Aucun bloc sur la page.
                </div>
            )}
            {blocks.map((block, idx) => renderBlockNode(block, idx))}
        </div>
    );
};
