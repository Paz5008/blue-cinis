import React, { useState } from 'react';
import type { StyleParamDescriptor } from '@/lib/inspector/registry';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface StyleAccordionGroupProps {
    groups: Record<string, StyleParamDescriptor[]>;
    renderControl: (descriptor: StyleParamDescriptor) => React.ReactNode;
    defaultOpenGroup?: string;
}

const humanizeGroup = (key: string): string => {
    const map: Record<string, string> = {
        layout: 'Mise en page',
        appearance: 'Apparence',
        typography: 'Typographie',
        behavior: 'Comportement',
        background: 'Arrière-plan',
        media: 'Média',
        misc: 'Divers',
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

export const StyleAccordionGroup: React.FC<StyleAccordionGroupProps> = ({
    groups,
    renderControl,
    defaultOpenGroup,
}) => {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        Object.keys(groups).forEach(key => {
            initialState[key] = key === defaultOpenGroup;
        });
        return initialState;
    });

    const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const toggleAdvanced = (group: string) => {
        setShowAdvanced(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const groupKeys = Object.keys(groups);

    if (groupKeys.length === 0) return null;

    return (
        <div className="space-y-2">
            {groupKeys.map(groupKey => {
                const descriptors = groups[groupKey];
                if (descriptors.length === 0) return null;

                // Split descriptors into basic and advanced
                const basic = descriptors.filter(d => !d.isAdvanced);
                const advanced = descriptors.filter(d => d.isAdvanced);

                const isOpen = openGroups[groupKey];
                const isAdvancedOpen = showAdvanced[groupKey];

                return (
                    <div key={groupKey} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleGroup(groupKey)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-gray-50 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                                {humanizeGroup(groupKey)}
                            </span>
                            <span className="text-[10px] text-slate-500 opacity-60 bg-gray-100 px-1.5 py-0.5 rounded">
                                {descriptors.length}
                            </span>
                        </button>

                        {isOpen && (
                            <div className="border-t border-gray-200 p-3 space-y-3 bg-gray-50/50">
                                {/* Basic Controls */}
                                {basic.map(descriptor => renderControl(descriptor))}

                                {/* Advanced Controls Section */}
                                {advanced.length > 0 && (
                                    <>
                                        {isAdvancedOpen && (
                                            <div className="pt-2 space-y-3 border-t border-gray-200 border-dashed mt-2">
                                                {advanced.map(descriptor => renderControl(descriptor))}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleAdvanced(groupKey)}
                                            className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 hover:underline mt-2 pt-2"
                                        >
                                            {isAdvancedOpen ? 'Masquer les options avancées' : 'Afficher les options avancées'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
