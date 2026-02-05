import React, { useRef } from 'react';
import Link from 'next/link';
import { useEditorActions, useEditorState } from './editor/EditorContext';
import {
  ArrowLeft as ArrowLeftIcon,
  Pencil as PencilIcon,
  Eye as EyeIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  PanelLeft as PanelLeftIcon,
  PanelRight as PanelRightIcon,
  Focus as FocusIcon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  ChevronDown as ChevronDownIcon,
  Cog as CogIcon,
  Brush as BrushIcon,
  ShieldAlert as ShieldAlertIcon,
  X as XIcon,
  Sparkles as SparklesIcon,
  LayoutTemplate as LayoutTemplateIcon,
} from 'lucide-react';

type ViewMode = 'edit' | 'preview' | 'theme';
type DeviceMode = 'desktop' | 'mobile';

type EditorPublishWarning = {
  id: string;
  message: string;
  description?: string;
  actionLabel?: string;
  action?: () => void;
};

interface EditorUnifiedMenuProps {
  // Refs kept as props for external control if needed, or could be moved to context if global
  modeRef?: React.RefObject<HTMLButtonElement>;
  saveRef?: React.RefObject<HTMLButtonElement>;
  publishRef?: React.RefObject<HTMLButtonElement>;
  previewMenuRef?: React.RefObject<HTMLDivElement>;

  // Specific UI props not yet in context or specific to this instance
  onTogglePreviewMenu: () => void;
  onClosePreviewMenu: () => void;
  openingPreview: boolean;
  showPreviewMenu: boolean;
  previewLinks: { desktop?: string; mobile?: string } | null;
  openPreviewWindow: (url: string, device: DeviceMode) => void;
  copyPreviewLink: (url: string) => void;

  // More Menu local state is external?
  showMoreMenu: boolean;
  onToggleMoreMenu: () => void;
  onCloseMoreMenu: () => void;

  onSelectThemeMode: () => void;
  onOpenAltPanel: () => void;
  altSummaryCount: number;

  onExport: () => void;
  onImport: () => void;
  onSaveLocalDraft: () => void;
  onResetGenericAlt: () => void;

  canAddOeuvre: boolean;
  onAddOeuvre: () => void;
  canCreateArtwork?: boolean;
  onOpenArtworkModal?: () => void;

  backHref?: string;
  notify?: (message: string, tone?: 'success' | 'error' | 'info' | 'warning') => void;
  pageNavigation?: Array<{ key: string; label: string; href: string }>;
  lastPublishedAt?: string | null;

  canEditTitle?: boolean;
  metaTitle?: string;
  metaTitlePlaceholder?: string;
  onChangeMetaTitle?: (value: string) => void;
  titleInputRef?: React.RefObject<HTMLInputElement>;
  publishWarnings?: EditorPublishWarning[];
  onOpenTemplateSelector?: () => void;
}

const statusBadgeClasses: Record<
  'default' | 'dirty' | 'success' | 'auto',
  string
> = {
  default: 'bg-gray-100 text-gray-600 ring-gray-200',
  dirty: 'bg-orange-50 text-orange-700 ring-orange-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  auto: 'bg-sky-50 text-sky-700 ring-sky-200',
};

const formatStatusLabel = (
  liveStatus: string | undefined,
  autoSaving: boolean,
  saving: boolean,
  publishing: boolean,
  dirty: boolean
): { label: string | null; tone: keyof typeof statusBadgeClasses } => {
  if (publishing) return { label: 'Publication…', tone: 'auto' };
  if (saving) return { label: 'Sauvegarde…', tone: 'auto' };
  if (autoSaving) return { label: 'Auto-enregistrement…', tone: 'auto' };
  if (liveStatus) {
    const normalized = liveStatus.toLowerCase();
    if (normalized.includes('auto')) return { label: liveStatus, tone: 'auto' };
    if (normalized.includes('réussi') || normalized.includes('succès')) {
      return { label: liveStatus, tone: 'success' };
    }
    return { label: liveStatus, tone: 'default' };
  }
  if (dirty) return { label: 'Modifications en cours', tone: 'dirty' };
  return { label: null, tone: 'default' };
};

const resolvePageLabel = (pageKey?: string) => {
  if (pageKey === 'poster') return 'Affiche';
  if (pageKey === 'banner') return 'Bandeau';
  if (pageKey === 'artworks') return 'Œuvres';
  return 'Profil';
};

export const EditorUnifiedMenu = React.memo(EditorUnifiedMenuComponent);
function EditorUnifiedMenuComponent({
  modeRef,
  saveRef,
  publishRef,
  onTogglePreviewMenu,
  onClosePreviewMenu,
  openingPreview,
  showPreviewMenu,
  previewMenuRef,
  previewLinks,
  openPreviewWindow,
  copyPreviewLink,
  showMoreMenu,
  onToggleMoreMenu,
  onCloseMoreMenu,
  onSelectThemeMode,
  onOpenAltPanel,
  altSummaryCount,
  onExport,
  onImport,
  onSaveLocalDraft,
  onResetGenericAlt,
  canAddOeuvre,
  onAddOeuvre,
  canCreateArtwork = false,
  onOpenArtworkModal,
  backHref = '/dashboard-artist',
  notify,
  pageNavigation,
  lastPublishedAt,
  canEditTitle = false,
  metaTitle = '',
  metaTitlePlaceholder = '',
  onChangeMetaTitle,
  titleInputRef,
  publishWarnings,
  onOpenTemplateSelector,
}: EditorUnifiedMenuProps) {

  const {
    isDirty: dirty,
    pageKey,
    publicationStatus,
    liveStatus,
    autoSaving,
    viewMode,
    showPalette,
    showInspector,
    focusModeActive,
    debugOutlines,
    canUndo,
    canRedo,
    publishing,
    saving,
    previewUrl,
    device,
  } = useEditorState();

  const {
    setViewMode: onChangeViewMode,
    setShowPalette,
    setShowInspector,
    toggleFocusMode: onToggleFocus,
    setDebugOutlines,
    setDevice: onChangeDevice,
    undo,
    redo,
    onPublish,
    save: onSave,
  } = useEditorActions();

  const onToggleDebug = React.useCallback(() => setDebugOutlines(!debugOutlines), [debugOutlines, setDebugOutlines]);
  const onTogglePalette = React.useCallback(() => setShowPalette(!showPalette), [showPalette, setShowPalette]);
  const onToggleInspector = React.useCallback(() => setShowInspector(!showInspector), [showInspector, setShowInspector]);
  const pageLabel = resolvePageLabel(pageKey);
  const statusInfo = formatStatusLabel(liveStatus, autoSaving, saving, publishing, dirty);
  const hasNavigation = Array.isArray(pageNavigation) && pageNavigation.length > 0;
  const hasMetaInfo = Boolean(lastPublishedAt || previewUrl);
  const idBase = `editor-menu-${pageKey || 'profile'}`;
  const publishWarningsList = publishWarnings ?? [];
  const warningCount = publishWarningsList.length;
  const navigationNode = hasNavigation ? (
    <nav
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 text-xs font-medium"
      aria-label="Changer de page"
    >
      {pageNavigation?.map(item => (
        <Link
          key={item.key}
          href={item.href}
          className={`rounded-full px-2.5 py-1 transition ${pageKey === item.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          aria-current={pageKey === item.key ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  ) : null;

  const renderMetaInfo = () => {
    if (!hasMetaInfo) return null;
    return (
      <>
        {lastPublishedAt ? (
          <span className="text-xs text-gray-500 whitespace-nowrap">Dernière publication : {lastPublishedAt}</span>
        ) : null}
        {previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
          >
            Ouvrir la page publique
            <span aria-hidden>↗</span>
          </a>
        ) : null}
      </>
    );
  };
  const metaInfoContent = hasMetaInfo ? renderMetaInfo() : null;
  const showQuickTitleInput = canEditTitle && typeof onChangeMetaTitle === 'function';
  const titleInputLabel =
    pageKey === 'banner' ? 'Titre du bandeau' : pageKey === 'poster' ? "Titre de l'affiche" : 'Titre de la page';
  const [showWarningsPopover, setShowWarningsPopover] = React.useState(false);
  const warningsPopoverRef = React.useRef<HTMLDivElement>(null);
  const warningsPopoverId = `${idBase}-warnings-popover`;
  const warningsPopoverHeadingId = `${warningsPopoverId}-title`;

  React.useEffect(() => {
    if (!showWarningsPopover) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (warningsPopoverRef.current && !warningsPopoverRef.current.contains(target)) {
        setShowWarningsPopover(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowWarningsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showWarningsPopover]);

  React.useEffect(() => {
    if (warningCount === 0 && showWarningsPopover) {
      setShowWarningsPopover(false);
    }
  }, [warningCount, showWarningsPopover]);

  React.useEffect(() => {
    if (!showWarningsPopover) return;
    if (showPreviewMenu || showMoreMenu) {
      setShowWarningsPopover(false);
    }
  }, [showMoreMenu, showPreviewMenu, showWarningsPopover]);

  const handleToggleWarnings = React.useCallback(() => {
    if (!showWarningsPopover) {
      onClosePreviewMenu();
      onCloseMoreMenu();
    }
    setShowWarningsPopover(prev => !prev);
  }, [onCloseMoreMenu, onClosePreviewMenu, showWarningsPopover]);

  const warningsButton = warningCount > 0 ? (
    <div className="relative flex-shrink-0" ref={warningsPopoverRef}>
      <button
        type="button"
        onClick={handleToggleWarnings}
        aria-haspopup="dialog"
        aria-expanded={showWarningsPopover}
        aria-controls={showWarningsPopover ? warningsPopoverId : undefined}
        title="Vérifications avant publication"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${showWarningsPopover
          ? 'border-amber-500 bg-amber-100 text-amber-800 shadow-sm'
          : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
      >
        <ShieldAlertIcon size={14} />
        <span className="hidden sm:inline">Vérifications</span>
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[11px] font-semibold text-white">
          {warningCount}
        </span>
      </button>
      {showWarningsPopover ? (
        <div
          id={warningsPopoverId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={warningsPopoverHeadingId}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-amber-200 bg-white/95 p-3 text-sm text-amber-900 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p id={warningsPopoverHeadingId} className="text-sm font-semibold text-amber-900">
                Vérifications avant publication
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Accessibilité & sécurité</p>
            </div>
            <button
              type="button"
              aria-label="Fermer les vérifications"
              className="rounded-full border border-transparent p-1 text-amber-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setShowWarningsPopover(false)}
            >
              <XIcon size={14} />
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {publishWarningsList.map(warning => (
              <li
                key={warning.id}
                className="flex flex-col gap-1 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm shadow-inner"
              >
                <span className="font-semibold">{warning.message}</span>
                {warning.description ? (
                  <span className="text-xs text-amber-700">{warning.description}</span>
                ) : null}
                {warning.action ? (
                  <button
                    type="button"
                    className="self-start rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    onClick={() => {
                      setShowWarningsPopover(false);
                      warning.action?.();
                    }}
                  >
                    {warning.actionLabel || 'Corriger'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  ) : null;

  return (

    <nav
      className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between rounded-2xl border p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out bg-white/90 border-gray-200/50"
      aria-label="Menu principal de l’éditeur"
    >
      {/* LEFT: Context & Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="group inline-flex h-10 w-10 items-center justify-center rounded-full transition bg-gray-100/50 text-slate-700 hover:bg-gray-200"
          title="Revenir au tableau de bord"
        >
          <ArrowLeftIcon size={18} className="transition group-hover:-translate-x-0.5" />
        </Link>

        <div className="mx-1 h-6 w-px bg-gray-200/50" />


        {onToggleDebug && (
          <button
            onClick={onToggleDebug}
            className={`group inline-flex h-10 w-10 items-center justify-center rounded-full transition ${debugOutlines ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100/50 text-slate-700 hover:bg-gray-200'}`}
            title="Mode Rayons X (Debug)"
          >
            <EyeIcon size={18} />
          </button>
        )}

        <button
          onClick={onToggleFocus}
          className={`group inline-flex h-10 w-10 items-center justify-center rounded-full transition ${!focusModeActive ? 'bg-slate-900 text-white shadow-md' : 'bg-gray-100/50 text-slate-700 hover:bg-gray-200'}`}
          title={focusModeActive ? "Afficher les panneaux" : "Mode concentration"}
        >
          {focusModeActive ? (
            <PanelLeftIcon size={18} />
          ) : (
            <PanelLeftIcon size={18} />
          )}
        </button>

        <div className="flex flex-col">
          {showQuickTitleInput ? (
            <div className="group relative flex items-center">
              <input
                ref={titleInputRef}
                type="text"
                value={metaTitle}
                onChange={(e) => onChangeMetaTitle?.(e.target.value)}
                placeholder={metaTitlePlaceholder || titleInputLabel}
                className="bg-transparent text-sm font-bold tracking-tight placeholder:opacity-50 focus:outline-none text-slate-900"
                aria-label={titleInputLabel}
              />
              <PencilIcon size={12} className="ml-2 opacity-0 transition group-hover:opacity-100 text-slate-400" />
            </div>
          ) : (
            <span className="text-sm font-bold tracking-tight text-slate-900">
              {pageLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasNavigation ? (
            <div className="flex items-center gap-1">
              {pageNavigation?.map(item => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`text-[10px] font-medium uppercase tracking-wider transition ${pageKey === item.key ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>


      </div>

      {/* CENTER: Workspace Controls */}
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 lg:flex">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-full p-1 ring-1 ring-gray-200 bg-gray-50/50">
          <button
            onClick={() => onChangeViewMode('edit')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition`}
            style={viewMode === 'edit'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
              : { color: '#64748b' }
            }
          >
            <PencilIcon size={14} /> <span>Éditer</span>
          </button>
          <button
            onClick={() => onChangeViewMode('preview')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition`}
            style={viewMode === 'preview'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
              : { color: '#64748b' }
            }
          >
            <EyeIcon size={14} /> <span>Aperçu</span>
          </button>
        </div>

        {/* Device Mode Toggle */}
        <div className="flex items-center gap-1 rounded-full p-1 ring-1 ring-gray-200 bg-gray-50/50">
          <button
            onClick={() => onChangeDevice?.('desktop')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition`}
            style={device === 'desktop'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
              : { color: '#64748b' }
            }
            aria-label="Aperçu desktop"
            aria-pressed={device === 'desktop'}
          >
            <MonitorIcon size={14} />
            <span className="hidden xl:inline">Desktop</span>
          </button>
          <button
            onClick={() => onChangeDevice?.('mobile')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition`}
            style={device === 'mobile'
              ? { backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
              : { color: '#64748b' }
            }
            aria-label="Aperçu mobile"
            aria-pressed={device === 'mobile'}
          >
            <SmartphoneIcon size={14} />
            <span className="hidden xl:inline">Mobile</span>
          </button>
        </div>
      </div>




      {/* RIGHT: Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1 sm:flex">

          {onOpenTemplateSelector && (
            <button
              onClick={onOpenTemplateSelector}
              className="rounded-full p-2 transition hover:bg-gray-100 text-slate-700"
              title="Modèles de page"
            >
              <LayoutTemplateIcon size={18} />
            </button>
          )}

          <div className="mx-2 h-4 w-px bg-slate-300" />

          {/* History */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded-full p-2 transition disabled:opacity-30 hover:bg-gray-100 text-slate-700"
            >
              <RotateCcwIcon size={18} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="rounded-full p-2 transition disabled:opacity-30 hover:bg-gray-100 text-slate-700"
            >
              <RotateCwIcon size={18} />
            </button>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <button
              ref={saveRef}
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90 disabled:opacity-50 bg-white border border-gray-200 text-slate-900 hover:bg-gray-50"
            >
              {saving ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <SaveIcon size={14} />
              )}
              <span>Enregistrer</span>
            </button>

            <button
              ref={publishRef}
              onClick={onPublish}
              disabled={publishing}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg transition hover:opacity-90 disabled:opacity-50 bg-slate-900 text-white shadow-slate-900/20"
            >
              <UploadIcon size={14} />
              <span>Publier</span>
            </button>
          </div>

          <div className="border-l border-gray-200 pl-2">
            <button
              onClick={onToggleMoreMenu}
              className={`rounded-full p-2 transition hover:bg-gray-100 text-slate-700 ${showMoreMenu ? 'bg-gray-100' : ''}`}
            >
              <CogIcon size={20} />
            </button>
            {showMoreMenu && (
              <div
                className="absolute right-2 top-full mt-2 w-64 rounded-xl border p-2 text-sm shadow-2xl"
                style={{
                  backgroundColor: 'var(--cms-bg)',
                  borderColor: 'var(--cms-border)',
                  color: 'var(--text-body)'
                }}
              >

                <button
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => {
                    onOpenAltPanel();
                    onCloseMoreMenu();
                  }}
                >
                  Accessibilité
                  <span className={`ml-2 inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${altSummaryCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {altSummaryCount}
                  </span>
                </button>
                <div className="my-1 h-px bg-gray-100" />
                <button
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => {
                    onExport();
                    onCloseMoreMenu();
                  }}
                >
                  Exporter JSON
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => {
                    onImport();
                    onCloseMoreMenu();
                  }}
                >
                  Importer JSON
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-black/5"
                  onClick={() => {
                    onSaveLocalDraft();
                    notify?.('Brouillon sauvegardé localement', 'success');
                    onCloseMoreMenu();
                  }}
                >
                  Sauver Local (Browser)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav >
  );

}

export default EditorUnifiedMenu;
