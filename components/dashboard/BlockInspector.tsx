import React, { FC, useMemo, useState } from 'react';
import type { Block } from '@/types/cms';
import { InspectorProps, InspectorTab, TextCommandApi } from './inspectors/types';
export type { TextCommandApi };

import { ArrowLeft as ArrowLeftIcon, Trash2 as TrashIcon, Monitor, Smartphone, RefreshCw as ConvertIcon } from 'lucide-react';
import { getBlockLabel } from './editor/shared/BlockLabel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NoBlockSelected } from './shared/EmptyState';

// Inspectors
import dynamic from 'next/dynamic';

const LoadingInspector = () => <div className="p-4 text-xs text-gray-400 animate-pulse">Chargement de l'inspecteur...</div>;
const TextInspector = dynamic(() => import('./inspectors/TextInspector').then(m => m.TextInspector), { loading: LoadingInspector, ssr: false });
const ImageInspector = dynamic(() => import('./inspectors/ImageInspector').then(m => m.ImageInspector), { loading: LoadingInspector, ssr: false });
const GalleryInspector = dynamic(() => import('./inspectors/GalleryInspector').then(m => m.GalleryInspector), { loading: LoadingInspector, ssr: false });
const VideoInspector = dynamic(() => import('./inspectors/VideoInspector').then(m => m.VideoInspector), { loading: LoadingInspector, ssr: false });
const EmbedInspector = dynamic(() => import('./inspectors/EmbedInspector').then(m => m.EmbedInspector), { loading: LoadingInspector, ssr: false });
const ButtonInspector = dynamic(() => import('./inspectors/ButtonInspector').then(m => m.ButtonInspector), { loading: LoadingInspector, ssr: false });
const OeuvreInspector = dynamic(() => import('./inspectors/OeuvreInspector').then(m => m.OeuvreInspector), { loading: LoadingInspector, ssr: false });
const ArtworkListInspector = dynamic(() => import('./inspectors/ArtworkListInspector').then(m => m.ArtworkListInspector), { loading: LoadingInspector, ssr: false });
const EventListInspector = dynamic(() => import('./inspectors/EventListInspector').then(m => m.EventListInspector), { loading: LoadingInspector, ssr: false });
const ColumnsInspector = dynamic(() => import('./inspectors/ColumnsInspector').then(m => m.ColumnsInspector), { loading: LoadingInspector, ssr: false });
const ArtistNameInspector = dynamic(() => import('./inspectors/ArtistNameInspector').then(m => m.ArtistNameInspector), { loading: LoadingInspector, ssr: false });
const ArtistBioInspector = dynamic(() => import('./inspectors/ArtistBioInspector').then(m => m.ArtistBioInspector), { loading: LoadingInspector, ssr: false });
const ArtistPhotoInspector = dynamic(() => import('./inspectors/ArtistPhotoInspector').then(m => m.ArtistPhotoInspector), { loading: LoadingInspector, ssr: false });
const DividerInspector = dynamic(() => import('./inspectors/DividerInspector').then(m => m.DividerInspector), { loading: LoadingInspector, ssr: false });
const ContactFormInspector = dynamic(() => import('./inspectors/ContactFormInspector').then(m => m.ContactFormInspector), { loading: LoadingInspector, ssr: false });

import MediaLibrary from '@/components/shared/MediaLibrary';

// Mapping
const INSPECTORS: Record<string, React.ComponentType<any>> = {
  text: TextInspector,
  image: ImageInspector,
  gallery: GalleryInspector,
  video: VideoInspector,
  embed: EmbedInspector,
  button: ButtonInspector,
  oeuvre: OeuvreInspector,
  artworkList: ArtworkListInspector,
  eventList: EventListInspector,
  columns: ColumnsInspector,
  artistName: ArtistNameInspector,
  artistBio: ArtistBioInspector,
  artistPhoto: ArtistPhotoInspector,
  divider: DividerInspector,
  contactForm: ContactFormInspector,
};

interface BlockInspectorProps {
  block: Block;
  onUpdate: (block: Block) => void;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  pageKey?: string;
  // Context props passed down
  oeuvreOptions?: { id: string; title: string; imageUrl?: string }[];
  textCommandApi?: TextCommandApi;
  setSelectedChild?: (sel: { parentId: string; childId: string } | null) => void;
  onConvert?: (id: string, targetType: any) => void;
}

const BlockInspectorComponent: React.FC<BlockInspectorProps> = ({
  block,
  onUpdate,
  onClose,
  onDelete,
  pageKey,
  oeuvreOptions,
  textCommandApi,
  setSelectedChild,
  onConvert,
}) => {
  const [activeTab, setActiveTab] = React.useState<InspectorTab>('content');
  const [mediaLibOpen, setMediaLibOpen] = React.useState(false);
  const [mediaLibCallback, setMediaLibCallback] = React.useState<(url: string) => void>(() => { });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  const setMediaPicker = React.useCallback(
    (options: { onSelect: (url: string) => void }) => {
      setMediaLibCallback(() => options.onSelect);
      setMediaLibOpen(true);
    },
    []
  );

  const InspectorComponent = INSPECTORS[block.type];

  // Title Logic - Using registry
  const blockTitle = useMemo(() => getBlockLabel(block.type, 'Bloc inconnu'), [block.type]);
  const convertTarget = block.type === 'image' ? 'oeuvre' : 'image';
  const convertTargetLabel = convertTarget === 'oeuvre' ? 'Œuvre' : 'Image simple';

  if (!InspectorComponent) {
    return (
      <div className="p-4 text-center text-gray-500">
        Pas d&apos;inspecteur pour le type &quot;{block.type}&quot;
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col border-b border-gray-200 px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="mr-1 rounded-full p-1 text-slate-500 hover:bg-gray-100 hover:text-slate-900"
              aria-label="Retour"
            >
              <ArrowLeftIcon size={18} />
            </button>
          )}
          <h2 className="font-semibold text-slate-900">{blockTitle}</h2>
          <div className="ml-auto flex items-center gap-2">
            {onConvert && (block.type === 'image' || block.type === 'oeuvre') && (
              <button
                onClick={() => setShowConvertDialog(true)}
                className="rounded p-1 text-slate-500 hover:bg-gray-100 hover:text-slate-900 transition-colors"
                title={`Convertir en ${convertTargetLabel}`}
              >
                <ConvertIcon size={16} />
              </button>
            )}
            <span className="text-xs text-slate-500 font-mono opacity-50">{block.type}</span>
            {onDelete && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <TrashIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-gray-200">
        {[
          { id: 'content', label: 'Contenu' },
          { id: 'settings', label: 'Paramètres' },
          { id: 'styles', label: 'Styles' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as InspectorTab)}
            className={`border-b-2 py-2 text-xs font-medium transition ${activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <InspectorComponent
          block={block}
          onUpdate={onUpdate}
          tab={activeTab}
          setMediaPicker={setMediaPicker}
          textCommandApi={textCommandApi}
          oeuvreOptions={oeuvreOptions}
          pageKey={pageKey}
          setSelectedChild={setSelectedChild}
        />

        {/* Generics footer info or debug could go here */}
        <div className="h-12" />
      </div>

      <MediaLibrary
        visible={mediaLibOpen}
        onClose={() => setMediaLibOpen(false)}
        onSelect={(url) => {
          if (mediaLibCallback) mediaLibCallback(url);
          setMediaLibOpen(false);
        }}
        title="Médiathèque"
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer ce bloc ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={() => onDelete?.(block.id)}
      />

      <ConfirmDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        title={`Convertir en ${convertTargetLabel} ?`}
        description="Le bloc sera transformé tout en conservant son contenu principal."
        confirmLabel="Convertir"
        variant="default"
        onConfirm={() => onConvert?.(block.id, convertTarget)}
      />
    </div>
  );
};

export default React.memo(BlockInspectorComponent);

