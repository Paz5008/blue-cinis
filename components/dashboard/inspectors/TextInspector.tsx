import React, { useEffect, useRef, useState, useCallback } from 'react';
import { type TextBlock } from '@/types/cms';
import InspectorSection from '../InspectorSection';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';
import TypographyControls from '../controls/TypographyControls';
import type { InspectorProps } from './types';
import { sanitizeTextHtml } from '@/lib/sanitize';

export function TextInspector({ block, onUpdate, tab, setMediaPicker, textCommandApi, pageKey }: InspectorProps<TextBlock>) {
    const [textEditorMode, setTextEditorMode] = useState<'visual' | 'html'>('visual');
    const [typoClipboard, setTypoClipboard] = useState<any>(null);
    const textVisualRef = useRef<HTMLDivElement | null>(null);
    const b = block;

    const sanitizeContent = useCallback(
        (value: string) => sanitizeTextHtml(value || '', pageKey as any),
        [pageKey]
    );

    const syncVisualContent = useCallback(() => {
        const current = textVisualRef.current;
        if (!current) return;
        const html = current.innerHTML;
        const sanitized = sanitizeContent(html);
        if (sanitized !== html) {
            current.innerHTML = sanitized;
        }
        const prev = typeof b.content === 'string' ? b.content : '';
        if (prev === sanitized) return;
        onUpdate({ ...block, content: sanitized });
    }, [block, onUpdate, b.content, sanitizeContent]);

    useEffect(() => {
        if (textEditorMode !== 'visual') return;
        const current = textVisualRef.current;
        if (!current) return;
        const raw = typeof b.content === 'string' ? b.content : '';
        const sanitized = sanitizeContent(raw);
        if (current.innerHTML !== sanitized) {
            current.innerHTML = sanitized;
        }
    }, [b.content, sanitizeContent, textEditorMode]);

    if (tab === 'content') {
        return (
            <>
                <InspectorSection
                    title="Mise en forme"
                    defaultOpen
                    help="Sélectionnez du texte dans le canevas puis appliquez une mise en forme rapide."
                >
                    {textCommandApi ? (
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Outils texte">
                                {['bold', 'italic'].map(cmd => (
                                    <button
                                        key={cmd}
                                        type="button"
                                        className="rounded border border-gray-200 bg-white text-slate-500 hover:bg-gray-50 hover:text-slate-900 transition-colors"
                                        onClick={() => textCommandApi.apply(cmd)}
                                    >
                                        {cmd === 'bold' ? 'Gras' : 'Italique'}
                                    </button>
                                ))}
                                {['H1', 'H2', 'P'].map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        className="rounded border border-gray-200 bg-white text-slate-500 hover:bg-gray-50 hover:text-slate-900 transition-colors"
                                        onClick={() => textCommandApi.apply('formatBlock', tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                <div className="ml-4 flex items-center gap-2">
                                    {(['left', 'center', 'right'] as const).map((dir) => (
                                        <button
                                            key={dir}
                                            type="button"
                                            className={`rounded border px-3 py-1 text-xs transition-colors ${((b.alignment || 'left') === dir)
                                                ? 'border-indigo-600 text-indigo-600 bg-white'
                                                : 'border-gray-200 bg-white text-slate-500 hover:bg-gray-50 hover:text-slate-900'
                                                }`}
                                            onClick={() => textCommandApi.setAlign(dir)}
                                        >
                                            {dir === 'left' ? 'G' : dir === 'center' ? 'C' : 'D'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="rounded border border-gray-200 bg-white text-slate-500 hover:bg-gray-50 hover:text-slate-900 transition-colors"
                                    onClick={() => textCommandApi.apply('removeFormat')}
                                >
                                    Effacer le formatage
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 opacity-80">Les outils de mise en forme sont disponibles en mode édition.</p>
                    )}
                </InspectorSection>
                <InspectorSection title="Texte" defaultOpen>
                    <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-gray-100 p-1">
                        <button
                            type="button"
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${textEditorMode === 'visual'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                            onClick={() => setTextEditorMode('visual')}
                        >
                            Éditeur visuel
                        </button>
                        <button
                            type="button"
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${textEditorMode === 'html'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                            onClick={() => setTextEditorMode('html')}
                        >
                            Code HTML
                        </button>
                    </div>
                    {textEditorMode === 'visual' ? (
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div
                                ref={el => { textVisualRef.current = el; }}
                                contentEditable
                                suppressContentEditableWarning
                                className="min-h-[160px] w-full px-3 py-3 text-sm leading-relaxed focus:outline-none focus:bg-gray-50 text-slate-800"
                                onInput={syncVisualContent}
                                onBlur={syncVisualContent}
                            />
                            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate-500">
                                Les scripts, iframes et attributs risqués sont supprimés automatiquement.
                            </div>
                        </div>
                    ) : (
                        <>
                            <label className="block text-sm font-medium mb-1 text-slate-900">HTML nettoyé</label>
                            <textarea
                                value={typeof b.content === 'string' ? b.content : ''}
                                onChange={e => {
                                    const next = sanitizeContent(e.currentTarget.value);
                                    onUpdate({ ...block, content: next });
                                }}
                                rows={8}
                                className="w-full rounded-lg border bg-white border-gray-200 text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                        </>
                    )}
                </InspectorSection>
            </>
        );
    }

    if (tab === 'settings') {
        return <CommonSettings block={block} onUpdate={onUpdate} />;
    }

    if (tab === 'styles') {
        return (
            <>
                <InspectorSection title="Typographie" defaultOpen help="Taille et couleurs des textes (simplifié).">
                    <TypographyControls
                        b={block}
                        onUpdate={(patch) => onUpdate({ ...block, ...patch })}
                        clipboard={typoClipboard}
                        setClipboard={setTypoClipboard}
                    />
                </InspectorSection>
                <CommonStyles block={block} onUpdate={onUpdate} setMediaPicker={setMediaPicker} pageKey={pageKey} />
            </>
        );
    }

    return null;
}
