'use client';

import React from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft as ArrowLeftIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  ChevronDown as ChevronDownIcon,
  GripVertical as GripVerticalIcon,
  MoreVertical as MoreVerticalIcon,
  Search as SearchIcon,
  X as XIcon,
  CheckCircle2 as CheckCircleIcon,
  Info as InfoIcon,
  AlertTriangle as AlertTriangleIcon,
  AlertCircle as AlertCircleIcon,
  Sparkles as SparklesIcon,
  Plus as PlusIcon,
} from 'lucide-react';

import styles from './CmsNavigation.module.css';

export type EditorViewMode = 'edit' | 'preview';
export type DeviceMode = 'desktop' | 'mobile';

export type ActionVariant = 'primary' | 'positive' | 'ghost' | 'accent';
export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface BreadcrumbSegment {
  id?: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface TopbarAction {
  id: string;
  label: string;
  variant: ActionVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export interface IconAction {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface SidebarBlockItem {
  id: string;
  label: string;
  icon: LucideIcon;
  popular?: boolean;
  badgeLabel?: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  dragHandleLabel?: string;
  onClick?: (item: SidebarBlockItem) => void;
  onOpenContextMenu?: (item: SidebarBlockItem) => void;
}

export interface SidebarGroup {
  id: string;
  label: string;
  icon?: LucideIcon;
  items: SidebarBlockItem[];
  collapsed?: boolean;
}

export interface SidebarTab {
  id: string;
  label: string;
}

export interface ShortcutChip {
  id: string;
  label: string;
  active?: boolean;
  onClick?: (chip: ShortcutChip) => void;
}

export interface ToastConfig {
  message: string;
  description?: string;
  tone?: ToastTone;
  icon?: LucideIcon;
}

export interface CmsNavigationProps {
  mode: EditorViewMode;
  onModeChange: (mode: EditorViewMode) => void;
  device: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
  breadcrumb: BreadcrumbSegment[];
  onBack?: () => void;
  verificationCount?: number;
  topbarActions: TopbarAction[];
  iconActions?: IconAction[];
  sidebarTabs: SidebarTab[];
  activeSidebarTab: string;
  onSelectSidebarTab: (tabId: string) => void;
  sidebarGroups: SidebarGroup[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch?: () => void;
  searchPlaceholder?: string;
  progressPercent?: number;
  shortcuts: ShortcutChip[];
  children?: React.ReactNode;
  modeOptions?: ToggleOption<EditorViewMode>[];
  deviceOptions?: ToggleOption<DeviceMode>[];
  toast?: ToastConfig;
  onDismissToast?: () => void;
  accentColor?: string;
  theme?: 'light' | 'dark';
  onCreateArtwork?: () => void;
  inspectorHint?: React.ReactNode;
  onBlockDragStart?: (item: SidebarBlockItem, group: SidebarGroup) => void;
  onBlockDragEnd?: (item: SidebarBlockItem, group: SidebarGroup) => void;
}

const defaultModeOptions: ToggleOption<EditorViewMode>[] = [
  { value: 'edit', label: 'Éditer' },
  { value: 'preview', label: 'Aperçu' },
];

const defaultDeviceOptions: ToggleOption<DeviceMode>[] = [
  { value: 'desktop', label: 'Desktop', icon: MonitorIcon },
  { value: 'mobile', label: 'Mobile', icon: SmartphoneIcon },
];

const toastToneIcon: Record<ToastTone, LucideIcon> = {
  success: CheckCircleIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
};

function hexToRgb(value: string): string | null {
  const hex = value.trim().replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return null;
}

export function CmsNavigation({
  mode,
  onModeChange,
  device,
  onDeviceChange,
  breadcrumb,
  onBack,
  verificationCount = 0,
  topbarActions,
  iconActions = [],
  sidebarTabs,
  activeSidebarTab,
  onSelectSidebarTab,
  sidebarGroups,
  searchValue,
  onSearchChange,
  onClearSearch,
  searchPlaceholder = 'Rechercher un bloc…',
  progressPercent = 0,
  shortcuts,
  children,
  modeOptions = defaultModeOptions,
  deviceOptions = defaultDeviceOptions,
  toast,
  onDismissToast,
  accentColor,
  theme,
  onCreateArtwork,
  inspectorHint,
  onBlockDragStart,
  onBlockDragEnd,
}: CmsNavigationProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(sidebarGroups.map((group) => [group.id, !!group.collapsed])),
  );
  const [dragAnnouncement, setDragAnnouncement] = React.useState<string>('');

  const previousOverflowRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const group of sidebarGroups) {
      next[group.id] = collapsedGroups[group.id] ?? !!group.collapsed;
    }
    setCollapsedGroups(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarGroups.map((group) => group.id).join('|')]);

  React.useEffect(() => {
    if (drawerOpen) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }
    return () => {
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, [drawerOpen]);

  const handleToggleGroup = React.useCallback(
    (groupId: string) => {
      setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    },
    [setCollapsedGroups],
  );

  const accentRgb = React.useMemo(() => {
    if (!accentColor) return null;
    return hexToRgb(accentColor);
  }, [accentColor]);

  const themeVariables = React.useMemo<React.CSSProperties>(() => {
    const variables: Record<string, string> = {};
    if (theme === 'dark') {
      variables['--cms-bg'] = '#0b0d0f';
      variables['--cms-surface'] = '#111418';
      variables['--cms-surface-alt'] = '#0b0d0f';
      variables['--cms-surface-raised'] = 'rgba(245, 247, 250, 0.08)';
      variables['--cms-border'] = '#262a30';
      variables['--cms-border-strong'] = '#3a3f47';
      variables['--cms-text-primary'] = '#f5f7fa';
      variables['--cms-text-secondary'] = 'rgba(245, 247, 250, 0.75)';
      variables['--cms-text-muted'] = 'rgba(245, 247, 250, 0.55)';
      variables['--cms-shadow-elevated'] = '0 8px 24px rgba(0, 0, 0, 0.35)';
    } else if (theme === 'light') {
      variables['--cms-bg'] = '#ffffff';
      variables['--cms-surface'] = '#f8fafb';
      variables['--cms-surface-alt'] = '#ffffff';
      variables['--cms-surface-raised'] = 'rgba(11, 13, 15, 0.08)';
      variables['--cms-border'] = '#e6e8ec';
      variables['--cms-border-strong'] = '#cfd3d9';
      variables['--cms-text-primary'] = '#0b0d0f';
      variables['--cms-text-secondary'] = 'rgba(11, 13, 15, 0.65)';
      variables['--cms-text-muted'] = 'rgba(11, 13, 15, 0.45)';
      variables['--cms-shadow-elevated'] = '0 8px 24px rgba(11, 13, 15, 0.12)';
    }
    if (accentColor) {
      variables['--cms-accent'] = accentColor;
    }
    if (accentRgb) {
      variables['--cms-accent-rgb'] = accentRgb;
    }
    return variables as React.CSSProperties;
  }, [accentColor, accentRgb, theme]);

  const badgeLabel = React.useMemo(() => `Vérifications ${verificationCount}`, [verificationCount]);
  const progressLabel = React.useMemo(() => `${Math.round(progressPercent)}% complet`, [progressPercent]);

  const handleDrawerOpen = React.useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const renderSidebarContent = React.useCallback(
    (isMobile = false) => (
      <>
        <div className={styles.sidebarHeader}>
          <div>
            <h2 className={styles.sidebarTitle}>Espace créatif</h2>
            <p className={styles.sidebarSubtitle}>Structure &amp; blocs</p>
          </div>
          <span className={styles.progressPill} aria-live="polite">
            <SparklesIcon size={14} aria-hidden="true" />
            {progressLabel}
          </span>
        </div>
        <nav className={styles.tabs} role="tablist" aria-label="Rubriques de palette">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              className={clsx(styles.tab, tab.id === activeSidebarTab && styles.tabActive)}
              aria-selected={tab.id === activeSidebarTab}
              onClick={() => onSelectSidebarTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className={styles.search}>
          <SearchIcon size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            className={styles.searchInput}
            type="search"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={searchPlaceholder}
          />
          {searchValue && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => {
                onClearSearch?.();
                onSearchChange('');
              }}
              aria-label="Effacer la recherche"
            >
              <XIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div role="list" aria-label="Types de blocs">
          {sidebarGroups.map((group) => {
            const Icon = group.icon;
            const collapsed = collapsedGroups[group.id];
            return (
              <div key={group.id} className={styles.group}>
                <div className={styles.groupHeader}>
                  <button
                    type="button"
                    className={styles.groupTitle}
                    onClick={() => handleToggleGroup(group.id)}
                    aria-controls={`group-${group.id}`}
                    aria-expanded={!collapsed}
                  >
                    {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                    {group.label}
                  </button>
                  <button
                    type="button"
                    className={styles.groupToggle}
                    onClick={() => handleToggleGroup(group.id)}
                    aria-label={`${collapsed ? 'Déplier' : 'Replier'} la section ${group.label}`}
                  >
                    <ChevronDownIcon
                      size={18}
                      style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div
                  id={`group-${group.id}`}
                  className={styles.groupList}
                  role="listbox"
                  aria-hidden={collapsed}
                  style={{ display: collapsed ? 'none' : undefined }}
                >
                  <div className={styles.srOnly} role="status" aria-live="polite">
                    {dragAnnouncement}
                  </div>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const badge = item.badgeLabel ?? (item.popular ? 'Populaire' : undefined);
                    return (
                      <div key={item.id} className={styles.blockRow}>
                        <button
                          type="button"
                          className={clsx(
                            styles.blockItem,
                            item.active && styles.blockItemActive,
                            item.disabled && styles.blockItemDisabled,
                          )}
                          disabled={item.disabled}
                          role="option"
                          aria-selected={item.active}
                          aria-label={item.ariaLabel ?? item.label}
                          draggable={!item.disabled}
                          onDragStart={() => {
                            setDragAnnouncement(`${item.label} sélectionné`);
                            onBlockDragStart?.(item, group);
                          }}
                          onDragEnd={() => {
                            setDragAnnouncement(`${item.label} relâché`);
                            onBlockDragEnd?.(item, group);
                          }}
                          onClick={() => {
                            if (item.onClick) {
                              item.onClick(item);
                            }
                          }}
                        >
                          <ItemIcon size={20} aria-hidden="true" />
                          <span>{item.label}</span>
                          {badge ? (
                            <span className={styles.blockBadge} aria-label={badge}>
                              {badge}
                            </span>
                          ) : (
                            <span />
                          )}
                          <GripVerticalIcon size={18} aria-hidden="true" />
                        </button>
                        {item.onOpenContextMenu ? (
                          <button
                            type="button"
                            className={styles.contextButton}
                            aria-label={`Menu pour le bloc ${item.label}`}
                            onClick={() => item.onOpenContextMenu?.(item)}
                          >
                            <MoreVerticalIcon size={18} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {isMobile ? (
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => {
              handleDrawerClose();
            }}
          >
            Fermer
          </button>
        ) : null}
      </>
    ),
    [
      activeSidebarTab,
      collapsedGroups,
      dragAnnouncement,
      handleDrawerClose,
      handleToggleGroup,
      onBlockDragEnd,
      onBlockDragStart,
      onClearSearch,
      onSearchChange,
      onSelectSidebarTab,
      progressLabel,
      searchPlaceholder,
      searchValue,
      sidebarGroups,
      sidebarTabs,
    ],
  );

  const toastToneClass =
    toast?.tone === 'success'
      ? styles.toastToneSuccess
      : toast?.tone === 'warning'
      ? styles.toastToneWarning
      : toast?.tone === 'error'
      ? styles.toastToneError
      : toast?.tone === 'info'
      ? styles.toastToneInfo
      : undefined;

  const ToastIcon = toast?.icon ?? (toast?.tone ? toastToneIcon[toast.tone] : InfoIcon);

  return (
    <div className={styles.shell} style={themeVariables}>
      <a href="#cms-canvas" className={styles.skipLink}>
        Aller au contenu principal
      </a>
      <header className={styles.topbar} role="banner">
        <div className={styles.topbarLeft}>
          <button type="button" className={styles.mobileSidebarTrigger} onClick={handleDrawerOpen} aria-label="Ouvrir la palette">
            <PanelLeftOpenIcon size={20} aria-hidden="true" />
          </button>
          <button type="button" className={styles.backButton} onClick={onBack} aria-label="Retour">
            <ArrowLeftIcon size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <nav aria-label="Fil d’Ariane">
            <ol className={styles.breadcrumb}>
              {breadcrumb.map((segment, index) => {
                const isLast = index === breadcrumb.length - 1;
                return (
                  <React.Fragment key={segment.id ?? segment.label}>
                    {index > 0 && <span className={styles.breadcrumbSeparator}>›</span>}
                    {isLast ? (
                      <span className={styles.breadcrumbCurrent} aria-current="page">
                        {segment.label}
                      </span>
                    ) : segment.href ? (
                      <a
                        className={styles.breadcrumbLink}
                        href={segment.href}
                        onClick={(event) => {
                          segment.onClick?.();
                          if (!segment.href) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {segment.label}
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={styles.breadcrumbLink}
                        onClick={() => segment.onClick?.()}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        {segment.label}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>
        </div>
        <div className={styles.topbarCenter}>
          <div role="radiogroup" aria-label="Modes de l’éditeur">
            <div className={styles.toggleGroup}>
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(styles.toggleButton, option.value === mode && styles.toggleButtonActive)}
                  aria-pressed={option.value === mode}
                  onClick={() => onModeChange(option.value)}
                >
                  {option.icon ? <option.icon size={16} aria-hidden="true" /> : null}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div role="radiogroup" aria-label="Mode d’affichage">
            <div className={styles.toggleGroup}>
              {deviceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={clsx(styles.toggleButton, option.value === device && styles.toggleButtonActive)}
                  aria-pressed={option.value === device}
                  onClick={() => onDeviceChange(option.value)}
                >
                  {option.icon ? <option.icon size={16} aria-hidden="true" /> : null}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {iconActions.length > 0 ? (
            <div className={styles.iconActions}>
              {iconActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={clsx(styles.iconButton, action.active && styles.iconButtonActive)}
                  aria-pressed={action.active ?? false}
                  disabled={action.disabled}
                  onClick={() => action.onClick?.()}
                  title={action.label}
                  aria-label={action.label}
                >
                  <action.icon size={18} aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className={styles.topbarRight}>
          {verificationCount !== undefined ? <span className={styles.badge}>{badgeLabel}</span> : null}
          <div className={styles.actions}>
            {topbarActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className={clsx(
                    styles.actionButton,
                    action.variant === 'primary' && styles.variantPrimary,
                    action.variant === 'positive' && styles.variantPositive,
                    action.variant === 'ghost' && styles.variantGhost,
                    action.variant === 'accent' && styles.variantAccent,
                  )}
                  disabled={action.disabled}
                  onClick={() => action.onClick?.()}
                  title={action.tooltip}
                >
                  {Icon ? <Icon size={18} aria-hidden="true" /> : null}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebarDesktop} aria-label="Palette des blocs">
          {renderSidebarContent()}
        </aside>
        <div className={styles.contentArea}>
          <div className={styles.chips} role="toolbar" aria-label="Raccourcis de profil">
            {shortcuts.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={clsx(styles.chip, chip.active && styles.chipActive)}
                aria-pressed={chip.active ?? false}
                onClick={() => chip.onClick?.(chip)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <main id="cms-canvas" className={styles.canvas}>
            {children ?? (
              <article className={styles.canvasCard}>
                <h1>Canvas de l’éditeur</h1>
                <p>
                  Utilisez ce canevas pour prévisualiser la page profil de l’artiste. Les composants s’alignent sur une grille de 8&nbsp;px
                  avec des marges de 32&nbsp;px.
                </p>
              </article>
            )}
          </main>
        </div>
        <aside className={styles.inspectorPlaceholder} aria-label="Inspecteur (à venir)">
          <div className={styles.inspectorTitle}>Inspecteur</div>
          <p>
            Cette zone accueillera les réglages contextuels du bloc sélectionné (typographie, espacements, métadonnées). Prévoir un layout
            dynamique.
          </p>
          {inspectorHint}
        </aside>
      </div>

      {toast ? (
        <div
          className={clsx(styles.toast, toastToneClass)}
          role="status"
          aria-live="polite"
        >
          <ToastIcon size={20} aria-hidden="true" />
          <div className={styles.toastBody}>
            <span className={styles.toastTitle}>{toast.message}</span>
            {toast.description ? <span className={styles.toastDescription}>{toast.description}</span> : null}
          </div>
          {onDismissToast ? (
            <button type="button" className={styles.toastClose} onClick={onDismissToast} aria-label="Fermer la notification">
              <XIcon size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.fab}
        onClick={() => {
          onCreateArtwork?.();
        }}
      >
        <PlusIcon size={20} aria-hidden="true" />
        Nouvelle œuvre
      </button>

      {drawerOpen ? (
        <div className={styles.drawerOverlay} role="dialog" aria-modal="true">
          <div className={styles.drawerPanel}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Palette</span>
              <button type="button" className={styles.contextButton} onClick={handleDrawerClose} aria-label="Fermer la palette">
                <XIcon size={18} aria-hidden="true" />
              </button>
            </div>
            {renderSidebarContent(true)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CmsNavigation;
