import React, { useState } from 'react';
import { PAGE_TEMPLATES, hydrateTemplate, PageTemplate } from '@/lib/presets/page-templates';
import { Block } from '@/types/cms';
import { X as XIcon, LayoutTemplate as LayoutIcon, AlertTriangle as AlertIcon } from 'lucide-react';

import { ThemeConfig } from '@/types/cms';

interface PageTemplateSelectorProps {
    onSelect: (blocks: Block[], theme?: Partial<ThemeConfig>) => void;
    onClose: () => void;
}

export function PageTemplateSelector({ onSelect, onClose }: PageTemplateSelectorProps) {
    const [confirmingTemplate, setConfirmingTemplate] = useState<PageTemplate | null>(null);

    const handleTemplateClick = (template: PageTemplate) => {
        setConfirmingTemplate(template);
    };

    const handleConfirm = () => {
        if (confirmingTemplate) {
            const newBlocks = hydrateTemplate(confirmingTemplate);
            onSelect(newBlocks, confirmingTemplate.theme);
            onClose();
        }
    };

    const handleCancelConfirm = () => {
        setConfirmingTemplate(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Sélectionner un modèle de page"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <LayoutIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Modèles de page</h2>
                            <p className="text-sm text-slate-500">Choisissez une structure de départ pour votre page</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                        aria-label="Fermer"
                    >
                        <XIcon size={24} />
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PAGE_TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateClick(template)}
                                className="group relative flex flex-col text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 overflow-hidden h-full"
                            >
                                {/* Thumbnail Placeholder */}
                                <div className="h-40 bg-slate-100 w-full flex items-center justify-center border-b border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                                    {template.thumbnail ? (
                                        <img src={template.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <LayoutIcon className="text-slate-300 group-hover:text-blue-400 transition-colors" size={48} />
                                    )}
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                    Sélectionner →
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal Overlay */}
            {
                confirmingTemplate && (
                    <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-full flex-shrink-0">
                                    <AlertIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Attention</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        L'application du modèle <strong>{confirmingTemplate.name}</strong> va remplacer <strong>l'intégralité</strong> du contenu actuel de cette page. Cette action est irréversible (sauf via l'historique d'annulation).
                                    </p>
                                </div>
                            </div>

                            {['essential', 'editorial'].includes(confirmingTemplate.id) && (
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <AlertIcon size={16} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <strong>Structure Avancée</strong>
                                        <p className="mt-1 text-xs leading-relaxed text-blue-600/90">
                                            Ce modèle utilise des superpositions et des imbrications complexes.
                                            Si la sélection directe est difficile, utilisez l'onglet <strong>Calques</strong> (Palette de gauche) pour accéder précisément à chaque élément.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    onClick={handleCancelConfirm}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition"
                                >
                                    Remplacer le contenu
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
