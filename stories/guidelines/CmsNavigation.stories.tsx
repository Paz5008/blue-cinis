import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Code as EmbedIcon,
  Focus as FocusIcon,
  Images as GalleryIcon,
  Image as ImageIcon,
  Layers as LayersIcon,
  Palette as PaletteIcon,
  PanelRight as PanelRightIcon,
  PenSquare as EditIcon,
  Search as SearchIcon,
  Sparkles as SparklesIcon,
  Type as TextIcon,
  UploadCloud as PublishIcon,
  Video as VideoIcon,
  Quote as QuoteIcon,
} from 'lucide-react';

import CmsNavigation, {
  type CmsNavigationProps,
  type DeviceMode,
  type EditorViewMode,
  type SidebarBlockItem,
  type SidebarGroup,
  type ToastConfig,
} from '../../components/cms/navigation';

const meta = {
  title: 'CMS/CmsNavigation',
  component: CmsNavigation,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    theme: {
      control: { type: 'inline-radio' },
      options: ['light', 'dark'],
    },
    accentColor: {
      control: { type: 'color' },
    },
  },
  args: {
    theme: 'light',
    accentColor: '#6a5ae0',
  },
} satisfies Meta<typeof CmsNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseBlockGroups: SidebarGroup[] = [
  {
    id: 'content',
    label: 'Contenu',
    icon: LayersIcon,
    items: [
      { id: 'text', label: 'Text', icon: TextIcon, popular: true },
      { id: 'image', label: 'Image', icon: ImageIcon },
      { id: 'gallery', label: 'Gallery', icon: GalleryIcon, popular: true },
      { id: 'video', label: 'Vidéo', icon: VideoIcon },
      { id: 'embed', label: 'Embed', icon: EmbedIcon },
      { id: 'quote', label: 'Quote', icon: QuoteIcon, disabled: true },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    icon: SparklesIcon,
    items: [
      { id: 'cta', label: 'Appel à l’action', icon: SparklesIcon, badgeLabel: 'Populaire' },
      { id: 'pricing', label: 'Pricing', icon: SparklesIcon },
    ],
  },
];

const baseSectionGroups: SidebarGroup[] = [
  {
    id: 'hero',
    label: 'Sections héro',
    items: [
      { id: 'hero_minimal', label: 'Hero minimal', icon: TextIcon },
      { id: 'hero_gallery', label: 'Hero & Galerie', icon: GalleryIcon },
    ],
  },
  {
    id: 'story',
    label: 'Storytelling',
    items: [
      { id: 'story_timeline', label: 'Timeline', icon: LayersIcon },
      { id: 'story_interview', label: 'Interview', icon: TextIcon },
    ],
  },
];

const baseGuideGroups: SidebarGroup[] = [
  {
    id: 'guides',
    label: 'Guides',
    items: [
      { id: 'contrast', label: 'Contraste AA', icon: SearchIcon },
      { id: 'seo', label: 'Checklist SEO', icon: SparklesIcon },
    ],
  },
];

const baseShortcuts = [
  { id: 'name', label: "Nom d’artiste" },
  { id: 'photo', label: 'Photo' },
  { id: 'bio', label: 'Biographie' },
  { id: 'works', label: 'Œuvres' },
];

const paletteTabs: CmsNavigationProps['sidebarTabs'] = [
  { id: 'blocks', label: 'Blocs' },
  { id: 'sections', label: 'Sections' },
  { id: 'guides', label: 'Guides' },
];

interface StoryContainerProps {
  theme?: 'light' | 'dark';
  accentColor?: string;
}

const StoryContainer: React.FC<StoryContainerProps> = ({ theme = 'light', accentColor = '#6a5ae0' }) => {
  const [mode, setMode] = React.useState<EditorViewMode>('edit');
  const [device, setDevice] = React.useState<DeviceMode>('desktop');
  const [activeTab, setActiveTab] = React.useState<string>('blocks');
  const [searchValue, setSearchValue] = React.useState('');
  const [activeShortcut, setActiveShortcut] = React.useState<string>('name');
  const [toast, setToast] = React.useState<ToastConfig | undefined>(undefined);
  const [iconStates, setIconStates] = React.useState<Record<string, boolean>>({
    palette: true,
    inspector: true,
    focus: false,
  });

  React.useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(undefined), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filterItems = React.useCallback(
    (groups: SidebarGroup[]): SidebarGroup[] => {
      if (!searchValue.trim()) return groups;
      const query = searchValue.toLowerCase();
      const filtered = groups
        .map((group) => {
          const items = group.items.filter((item) => item.label.toLowerCase().includes(query));
          return { ...group, items };
        })
        .filter((group) => group.items.length > 0);
      return filtered.length > 0 ? filtered : [{ id: 'empty', label: 'Aucun résultat', items: [] }];
    },
    [searchValue],
  );

  const sidebarGroups = React.useMemo(() => {
    if (activeTab === 'sections') return filterItems(baseSectionGroups);
    if (activeTab === 'guides') return filterItems(baseGuideGroups);
    return filterItems(baseBlockGroups);
  }, [activeTab, filterItems]);

  const shortcuts = React.useMemo<CmsNavigationProps['shortcuts']>(
    () =>
      baseShortcuts.map((item) => ({
        ...item,
        active: activeShortcut === item.id,
        onClick: () => setActiveShortcut(item.id),
      })),
    [activeShortcut],
  );

  const handleActionClick = React.useCallback(
    (actionId: string) => {
      const messages: Record<string, ToastConfig> = {
        save: { message: 'Enregistrement réussi', description: 'Vos modifications sont sauvegardées.', tone: 'success' },
        publish: { message: 'Publication en cours', description: 'Mise en ligne imminente.', tone: 'info' },
        preview: { message: 'Prévisualisation', description: 'Ouverture dans un nouvel onglet.', tone: 'info' },
        new: { message: 'Nouvelle œuvre', description: 'Formulaire de création ouvert.', tone: 'success' },
      };
      setToast(messages[actionId] ?? { message: actionId });
    },
    [],
  );

  const topbarActions: CmsNavigationProps['topbarActions'] = React.useMemo(
    () => [
      { id: 'save', label: 'Enregistrer', variant: 'primary', icon: EditIcon, onClick: () => handleActionClick('save') },
      { id: 'publish', label: 'Publier', variant: 'positive', icon: PublishIcon, onClick: () => handleActionClick('publish') },
      { id: 'preview', label: 'Prévisualiser', variant: 'ghost', icon: VideoIcon, onClick: () => handleActionClick('preview') },
      { id: 'new', label: 'Nouvelle œuvre', variant: 'accent', icon: SparklesIcon, onClick: () => handleActionClick('new') },
    ],
    [handleActionClick],
  );

  const iconActions: NonNullable<CmsNavigationProps['iconActions']> = React.useMemo(
    () => [
      {
        id: 'palette',
        label: 'Palette',
        icon: PaletteIcon,
        active: iconStates.palette,
        onClick: () =>
          setIconStates((prev) => {
            const next = { ...prev, palette: !prev.palette };
            setToast({ message: 'Palette', description: next.palette ? 'Palette visible' : 'Palette masquée', tone: 'info' });
            return next;
          }),
      },
      {
        id: 'inspector',
        label: 'Inspecteur',
        icon: PanelRightIcon,
        active: iconStates.inspector,
        onClick: () =>
          setIconStates((prev) => {
            const next = { ...prev, inspector: !prev.inspector };
            setToast({ message: 'Inspecteur', description: next.inspector ? 'Inspecteur actif' : 'Inspecteur masqué', tone: 'info' });
            return next;
          }),
      },
      {
        id: 'focus',
        label: 'Focus',
        icon: FocusIcon,
        active: iconStates.focus,
        onClick: () =>
          setIconStates((prev) => {
            const next = { ...prev, focus: !prev.focus };
            setToast({ message: 'Mode focus', description: next.focus ? 'Canvas isolé' : 'Canvas normal', tone: 'info' });
            return next;
          }),
      },
    ],
    [iconStates],
  );

  return (
    <CmsNavigation
      mode={mode}
      onModeChange={setMode}
      device={device}
      onDeviceChange={setDevice}
      breadcrumb={[
        { id: 'cms', label: 'Éditeur CMS' },
        { id: 'profil', label: 'Profil' },
      ]}
      onBack={() => setToast({ message: 'Retour', description: 'Retour au tableau de bord', tone: 'info' })}
      verificationCount={1}
      topbarActions={topbarActions}
      iconActions={iconActions}
      sidebarTabs={paletteTabs}
      activeSidebarTab={activeTab}
      onSelectSidebarTab={setActiveTab}
      sidebarGroups={sidebarGroups}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onClearSearch={() => setSearchValue('')}
      progressPercent={32}
      shortcuts={shortcuts}
      theme={theme}
      accentColor={accentColor}
      toast={toast}
      onDismissToast={() => setToast(undefined)}
      onCreateArtwork={() => setToast({ message: 'Nouvelle œuvre', description: 'Initialisation du canvas', tone: 'success' })}
      onBlockDragStart={(item: SidebarBlockItem) =>
        setToast({ message: item.label, description: 'Déplacement commencé', tone: 'info' })
      }
      onBlockDragEnd={(item: SidebarBlockItem) =>
        setToast({ message: item.label, description: 'Bloc ajouté à la page', tone: 'info' })
      }
    >
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[var(--cms-radius-card)] border border-[var(--cms-border)] bg-[var(--cms-surface)] p-8 shadow-sm">
        <header>
          <h1 className="text-2xl font-semibold text-[var(--cms-text-primary)]">Profil artiste — Aperçu</h1>
          <p className="mt-2 text-sm text-[var(--cms-text-secondary)]">
            Composez la page en glissant les blocs depuis la palette. Les contrôles restent accessibles via la topbar.
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
          Ajustez les blocs pour garantir un contraste AA/AAA. Les raccourcis vous amènent directement aux champs critiques.
        </div>
      </section>
    </CmsNavigation>
  );
};

export const Light: Story = {
  args: { theme: 'light', accentColor: '#6a5ae0' },
  render: (args: Story['args']) => <StoryContainer theme={args.theme} accentColor={args.accentColor} />,
};

export const Dark: Story = {
  args: { theme: 'dark', accentColor: '#6a5ae0' },
  render: (args: Story['args']) => <StoryContainer theme={args.theme} accentColor={args.accentColor} />,
};
