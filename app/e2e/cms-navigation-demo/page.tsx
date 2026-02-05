'use client';

import React from 'react';
import {
  Type as TextIcon,
  Image as ImageIcon,
  Images as GalleryIcon,
  Video as VideoIcon,
  Code as EmbedIcon,
  Quote as QuoteIcon,
  Palette as PaletteIcon,
  PanelRight as PanelRightIcon,
  Focus as FocusIcon,
  PenSquare as EditIcon,
  Eye as EyeIcon,
  UploadCloud as PublishIcon,
  Sparkles as SparklesIcon,
} from 'lucide-react';

import CmsNavigation, {
  type CmsNavigationProps,
  type EditorViewMode,
  type DeviceMode,
  type SidebarGroup,
  type SidebarBlockItem,
  type ToastConfig,
} from '@/components/cms/navigation';

const initialGroups: SidebarGroup[] = [
  {
    id: 'content',
    label: 'Contenu',
    items: [
      { id: 'text', label: 'Text', icon: TextIcon, popular: true },
      { id: 'image', label: 'Image', icon: ImageIcon },
      { id: 'gallery', label: 'Gallery', icon: GalleryIcon, popular: true, badgeLabel: 'Populaire' },
      { id: 'video', label: 'Vidéo', icon: VideoIcon },
      { id: 'embed', label: 'Embed', icon: EmbedIcon },
      { id: 'quote', label: 'Quote', icon: QuoteIcon, disabled: true },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    items: [
      { id: 'hero', label: 'Hero minimal', icon: SparklesIcon },
      { id: 'story', label: 'Storytelling', icon: TextIcon },
      { id: 'cta', label: 'Bandeau CTA', icon: EmbedIcon },
    ],
    collapsed: true,
  },
];

const topbarActions: CmsNavigationProps['topbarActions'] = [
  { id: 'save', label: 'Enregistrer', variant: 'primary', icon: EditIcon },
  { id: 'publish', label: 'Publier', variant: 'positive', icon: PublishIcon },
  { id: 'preview', label: 'Prévisualiser', variant: 'ghost', icon: EyeIcon },
  { id: 'new', label: 'Nouvelle œuvre', variant: 'accent', icon: SparklesIcon },
];

const baseIconActions: NonNullable<CmsNavigationProps['iconActions']> = [
  { id: 'palette', label: 'Palette', icon: PaletteIcon },
  { id: 'inspector', label: 'Inspecteur', icon: PanelRightIcon, active: true },
  { id: 'focus', label: 'Focus', icon: FocusIcon },
];

export default function CmsNavigationDemoPage() {
  const [mode, setMode] = React.useState<EditorViewMode>('edit');
  const [device, setDevice] = React.useState<DeviceMode>('desktop');
  const [activeTab, setActiveTab] = React.useState('blocks');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeShortcut, setActiveShortcut] = React.useState('name');
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [toast, setToast] = React.useState<ToastConfig | undefined>();

  const shortcuts = React.useMemo(
    () => [
      { id: 'name', label: "Nom d’artiste", active: activeShortcut === 'name', onClick: () => setActiveShortcut('name') },
      { id: 'photo', label: 'Photo', active: activeShortcut === 'photo', onClick: () => setActiveShortcut('photo') },
      { id: 'bio', label: 'Biographie', active: activeShortcut === 'bio', onClick: () => setActiveShortcut('bio') },
      { id: 'works', label: 'Œuvres', active: activeShortcut === 'works', onClick: () => setActiveShortcut('works') },
    ],
    [activeShortcut],
  );

  const filteredGroups = React.useMemo(() => {
    if (!searchTerm.trim()) return initialGroups;
    const lower = searchTerm.toLowerCase();
    const filtered: SidebarGroup[] = initialGroups
      .map((group) => {
        const items = group.items.filter((item) => item.label.toLowerCase().includes(lower));
        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
    return filtered.length > 0 ? filtered : [{ id: 'empty', label: 'Aucun bloc', items: [] }];
  }, [searchTerm]);

  const handleActionClick = React.useCallback((actionId: string) => {
    if (actionId === 'save') {
      setToast({ message: 'Enregistrement réussi', description: 'Vos modifications ont été sauvegardées.', tone: 'success' });
    }
    if (actionId === 'publish') {
      setToast({ message: 'Publication en cours', description: 'Le profil est en cours de mise en ligne.', tone: 'info' });
    }
    if (actionId === 'preview') {
      setToast({ message: 'Prévisualisation ouverte', description: 'Nouvel onglet disponible.', tone: 'info' });
    }
    if (actionId === 'new') {
      setToast({ message: 'Nouvelle œuvre', description: 'Ouvrir le formulaire de création.', tone: 'success' });
    }
  }, []);

  const wiredActions = React.useMemo(
    () =>
      topbarActions.map((action) => ({
        ...action,
        onClick: () => handleActionClick(action.id),
      })),
    [handleActionClick],
  );

  const wiredIconActions = React.useMemo(
    () =>
      baseIconActions.map((action) => ({
        ...action,
        onClick: () => setToast({ message: action.label, description: `Action ${action.label} activée`, tone: 'info' }),
      })),
    [],
  );

  const handleCreateArtwork = React.useCallback(() => {
    setToast({ message: 'Nouvelle œuvre', description: 'Initialisation du canevas.', tone: 'success' });
  }, []);

  const inspectorHint = (
    <div className="rounded-lg border border-dashed border-[var(--cms-border)] bg-[color-mix(in_srgb,var(--cms-surface) 80%,transparent)] p-3 text-sm">
      Prévoir un panneau accordéon pour typographie, actions et métadonnées. Les contrôles suivent les tokens `--cms-*`.
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--cms-bg)] text-[var(--cms-text-primary)]">
      <CmsNavigation
        theme={theme}
        accentColor="#6a5ae0"
        mode={mode}
        onModeChange={setMode}
        device={device}
        onDeviceChange={setDevice}
        breadcrumb={[
          { id: 'cms', label: 'Éditeur CMS', href: '#' },
          { id: 'profil', label: 'Profil' },
        ]}
        onBack={() => setToast({ message: 'Retour', description: 'Navigation vers le tableau de bord.', tone: 'info' })}
        verificationCount={1}
        topbarActions={wiredActions}
        iconActions={wiredIconActions}
        sidebarTabs={[
          { id: 'blocks', label: 'Blocs' },
          { id: 'sections', label: 'Sections' },
          { id: 'guides', label: 'Guides' },
        ]}
        activeSidebarTab={activeTab}
        onSelectSidebarTab={setActiveTab}
        sidebarGroups={filteredGroups}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
        progressPercent={0}
        shortcuts={shortcuts}
        toast={toast}
        onDismissToast={() => setToast(undefined)}
        onCreateArtwork={handleCreateArtwork}
        inspectorHint={inspectorHint}
        onBlockDragStart={(item: SidebarBlockItem, group: SidebarGroup) =>
          setToast({ message: `${item.label}`, description: `Déplacement depuis ${group.label}.`, tone: 'info' })
        }
        onBlockDragEnd={(item: SidebarBlockItem, group: SidebarGroup) =>
          setToast({ message: `${item.label}`, description: `Déposé depuis ${group.label}.`, tone: 'info' })
        }
      >
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[var(--cms-radius-card)] border border-[var(--cms-border)] bg-[var(--cms-surface)] p-8 shadow-sm">
          <header>
            <h1 className="text-2xl font-semibold text-[var(--cms-text-primary)]">Profil artiste — Aperçu</h1>
            <p className="mt-2 text-sm text-[var(--cms-text-secondary)]">
              Modifiez les blocs puis utilisez le toggle Aperçu pour valider la mise en page. Les actions critiques restent accessibles en
              haut à droite.
            </p>
          </header>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-[var(--cms-radius-card)] border border-[var(--cms-border)] bg-[var(--cms-bg)] p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cms-text-secondary)]">Aperçu Desktop</span>
              <div className="h-40 rounded-lg border border-dashed border-[var(--cms-border-strong)] bg-[color-mix(in_srgb,var(--cms-bg) 92%,transparent)]" />
            </div>
            <div className="flex flex-col gap-2 rounded-[var(--cms-radius-card)] border border-[var(--cms-border)] bg-[var(--cms-bg)] p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cms-text-secondary)]">Aperçu Mobile</span>
              <div className="h-40 rounded-lg border border-dashed border-[var(--cms-border-strong)] bg-[color-mix(in_srgb,var(--cms-bg) 92%,transparent)]" />
            </div>
          </div>
          <div className="rounded-[var(--cms-radius-card)] border border-dashed border-[var(--cms-border-strong)] bg-[var(--cms-bg)] p-6 text-sm leading-relaxed text-[var(--cms-text-secondary)]">
            Connectez-vous à la palette pour insérer les blocs « Text », « Gallery » ou « Vidéo ». Chaque bloc inclut des paramètres
            typographiques, un contraste AA/AAA et des options d’ARIA pour garantir une accessibilité optimale.
          </div>
        </section>
      </CmsNavigation>
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--cms-border)] bg-[var(--cms-surface)] px-4 py-2 shadow-sm">
        <span className="text-sm text-[var(--cms-text-secondary)]">Mode</span>
        <button
          type="button"
          className="rounded-full border border-[var(--cms-border)] px-3 py-1 text-sm font-semibold text-[var(--cms-text-primary)] transition hover:border-[var(--cms-accent)] hover:text-[var(--cms-accent)]"
          onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        >
          {theme === 'light' ? 'Passer en sombre' : 'Passer en clair'}
        </button>
      </div>
    </div>
  );
}
