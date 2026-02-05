import React from 'react';
import dynamic from 'next/dynamic';
import { useEditorContext } from '../EditorContext';

const EditorUnifiedMenu = dynamic(() => import('../../EditorUnifiedMenu'), {
    loading: () => <div className="h-14 w-full bg-neutral-100 animate-pulse" />
});

export const EditorToolbar = () => {
    const context = useEditorContext();
    // Destructure all needed props from context
    // EditorUnifiedMenu takes A LOT of props.
    // Ideally we update EditorUnifiedMenu to use context too, but that's a deeper refactor.
    // for now we pass props.

    const modeRef = React.useRef<HTMLButtonElement>(null);
    const saveRef = React.useRef<HTMLButtonElement>(null);
    const publishRef = React.useRef<HTMLButtonElement>(null);
    const previewMenuRef = React.useRef<HTMLDivElement>(null);
    const presetRef = React.useRef<HTMLSelectElement>(null);
    // const deviceRef = React.useRef<HTMLButtonElement>(null); // Removed

    const [showPreviewMenu, setShowPreviewMenu] = React.useState(false);
    const [showMoreMenu, setShowMoreMenu] = React.useState(false);

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur shadow-sm">
            <div className="mx-auto w-full max-w-[1440px] px-3 py-1.5 md:px-6 lg:px-8">
                {/* 
                    EditorUnifiedMenu requires mostly the same props we put in context
                    We can spread context or map partially.
                 */}
                <EditorUnifiedMenu
                    // Refs
                    modeRef={modeRef}
                    saveRef={saveRef}
                    publishRef={publishRef}
                    previewMenuRef={previewMenuRef}

                    // UI / Navigation
                    onTogglePreviewMenu={() => setShowPreviewMenu(!showPreviewMenu)}
                    onClosePreviewMenu={() => setShowPreviewMenu(false)}
                    openingPreview={false}
                    showPreviewMenu={showPreviewMenu}
                    previewLinks={null}
                    openPreviewWindow={() => { }}
                    copyPreviewLink={() => { }}
                    showMoreMenu={showMoreMenu}
                    onToggleMoreMenu={() => setShowMoreMenu(!showMoreMenu)}
                    onCloseMoreMenu={() => setShowMoreMenu(false)}
                    onSelectThemeMode={() => context.setViewMode('theme')}
                    onOpenAltPanel={() => { }}
                    altSummaryCount={0}

                    onExport={() => { }}
                    onImport={() => { }}
                    onSaveLocalDraft={() => { }}
                    onResetGenericAlt={() => { }}
                    canAddOeuvre={false}
                    onAddOeuvre={() => { }}
                />
            </div>
        </header>
    );
};
