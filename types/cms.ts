// types/cms.ts
export type BlockType =
  | 'text'
  | 'image'
  | 'gallery'
  | 'video'
  | 'embed'
  | 'divider'
  | 'button'
  | 'columns'
  | 'oeuvre'
  | 'artworkList'
  | 'artistName'
  | 'artistPhoto'
  | 'artistBio'
  | 'contactForm'
  | 'eventList'
  | 'book';

type BlockStyleValue = string | number | boolean | undefined | { desktop?: string | number; mobile?: string | number };

export interface BlockStyle {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  padding?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  backgroundColor?: string;
  color?: string;
  backgroundImageUrl?: string;
  /** Contrôle de la taille de l'image de fond */
  backgroundSize?: string; // 'cover' | 'contain' | 'auto' | 'custom'
  /** Quand backgroundSize === 'custom', valeur libre ex: '100% auto' */
  backgroundSizeCustom?: string;
  /** Contrôle de la position de l'image de fond */
  backgroundPosition?: string; // 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' ... | 'custom'
  /** Quand backgroundPosition === 'custom', valeur libre ex: '50% 30%' */
  backgroundPositionCustom?: string;
  /** Répétition de l'image de fond */
  backgroundRepeat?: string; // 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  /** Couleur d'overlay au-dessus du fond */
  overlayColor?: string; // ex: rgba(0,0,0,0.4) ou #000000
  /** Opacité de l'overlay 0-1 (appliquée si overlayColor est défini) */
  overlayOpacity?: number;
  /** Dégradé simple: from/to/direction (ex: to bottom, 45deg) */
  gradientFrom?: string; // ex: #00000000
  gradientTo?: string; // ex: #000000
  gradientDirection?: string; // ex: "to bottom", "45deg"
  /** Si true, utilise background-attachment: fixed (parallax) */
  parallax?: boolean;
  borderRadius?: string;
  /** Mode de mélange pour superposer overlay/gradient/image */
  blendMode?: string; // ex: normal, multiply, overlay
  /** Effets hover génériques */
  hoverOpacity?: number; // 0..1
  hoverScale?: number; // ex: 1.05
  hoverShadow?: string; // box-shadow CSS
  hoverTransitionMs?: number;
  // Largeur simple (flat)
  // width: string est déjà défini plus haut
  /** Alignement dans le canevas (quand width défini) */
  canvasAlign?: 'left' | 'center' | 'right';
  /** Gap générique (galerie, vidéo, etc.) */
  gap?: string;
  /** Facteur d'échelle d'image interne (ex: artistPhoto) en pourcentage (100 = 1.0) */
  imageScale?: number;
  /** Ajustements variés utilisés par le builder */
  objectFit?: string;
  objectPosition?: string;
  overflow?: string;
  boxShadow?: string;
  fontWeight?: string;
  position?: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  textAlign?: string;
  /** Animation type for scroll-triggered entrance */
  animation?: 'fadeIn' | 'slideUp' | 'scaleIn';
  backdropFilter?: string;
  mixBlendMode?: string;
  filter?: string;
  transform?: string;
  [customProp: string]: BlockStyleValue;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  /** Styles CSS inline personnalisés pour le bloc */
  style?: BlockStyle;
  // --- Free-Form / Antigravity Props (Desktop Only) ---
  x?: number;        // Percentage (0-100) or pixels depending on usage, usually % for responsive
  y?: number;        // Pixels for now (vertical scroll)
  width?: number | string; // Canvas width (% or px)
  height?: number | string; // Canvas height (% or px or 'auto')
  rotation?: number;   // Degrees
  zIndex?: number;

  /** Active l'effet de flottement/parallax (bruit visuel) */
  noise?: boolean;

  // Visibility Controls
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  /** Options typographiques */
  lineHeight?: string; // ex: '1.6', '160%'
  letterSpacing?: string; // ex: '0.5px'
  fontWeight?: string; // ex: '400', '700', 'bold'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string; // ex: 'Playfair Display', 'Montserrat', 'serif'
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  caption?: string;
  altText?: string;
  decorative?: boolean;
  alignment?: 'left' | 'center' | 'right';
  /** Maintien du ratio lors du redimensionnement (Antigravity) */
  keepAspect?: boolean;
  /** Ratio d'aspect calculé/sauvegardé (width/height) */
  aspectRatio?: number;
}

export interface GalleryImage {
  id: string;
  src: string;
  caption?: string;
  altText?: string;
  decorative?: boolean;
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  images: GalleryImage[];
  layout?: 'grid' | 'carousel' | 'masonry';
  columns?: number;
  /** Ajuste le rendu des vignettes dans leur cadre */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Position des vignettes (centre, haut, bas, gauche, droite ou valeur CSS) */
  objectPosition?: string; // ex: 'center', 'top', '50% 50%'
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  src: string;
  caption?: string;
  autoplay?: boolean;
  controls?: boolean;
  /** URL ou DataURL pour l'image de poster */
  poster?: string;
  /** Lecture en boucle */
  loop?: boolean;
  /** Modes muet */
  muted?: boolean;
  /** Largeur (ex: '600px', '%', etc.) */
  width?: string | number;
  /** Hauteur (ex: '360px', etc.) */
  height?: string | number;
}

/** Bloc d'intégration multimédia externe (YouTube, Vimeo, SoundCloud...) */
export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  /** URL sécurisée de l'embed */
  url: string;
  /** Fournisseur détecté pour appliquer les paramètres adéquats */
  provider?: 'youtube' | 'vimeo' | 'soundcloud';
  /** Titre accessible de l'iframe */
  title?: string;
  /** Légende affichée sous l'embed */
  caption?: string;
  /** Autoriser le plein écran */
  allowFullscreen?: boolean;
  /** Ratio largeur:hauteur (ex: '16:9') */
  aspectRatio?: string;
  /** Largeur CSS personnalisée */
  width?: string | number;
  /** Hauteur CSS personnalisée */
  height?: string | number;
  /** URL de miniature pour pré-chargement */
  thumbnailUrl?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  /** Style de la bordure du séparateur */
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  thickness?: number;
}

/** Block bouton (call-to-action) */
export interface ButtonBlock extends BaseBlock {
  type: 'button';
  /** Texte du bouton */
  label: string;
  /** URL cible du bouton */
  url: string;
  /** Style du bouton */
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  /** Alignement du bouton */
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Block pour créer des dispositions en colonnes.
 * Remplace l'ancien bloc container avec plus de flexibilité.
 */
export interface ColumnBlock extends BaseBlock {
  type: 'columns';
  /** Nombre de colonnes affichées */
  count: number;
  /** Contenu de chaque colonne */
  columns: Block[][];
  /** Espacement entre les colonnes (gap CSS) */
  gap?: string;
  /** Alignement vertical des enfants */
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  /** Hauteur minimale (peut servir d'espaceur) */
  minHeight?: string;
}
/**
 * Block pour afficher une sélection d'œuvres de l'artiste
 */
export interface OeuvreBlock extends BaseBlock {
  type: 'oeuvre';
  /** Identifiants des œuvres sélectionnées */
  artworks: string[];
  /** Limiter l'affichage aux N premières œuvres sélectionnées */
  limit?: number;
  /** Layout d'affichage */
  layout?: 'grid' | 'carousel';
  /** Nombre de colonnes si layout='grid' */
  columns?: number;
  /** Style de bordure autour de chaque vignette */
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  /** Couleur de la bordure */
  borderColor?: string;
  /** Épaisseur de la bordure en pixels */
  borderThickness?: number;
  /** Afficher le titre de l'œuvre */
  showTitle?: boolean;
  /** Afficher le nom de l'artiste */
  showArtist?: boolean;
  /** Afficher le prix */
  showPrice?: boolean;
  /** Afficher l'année */
  showYear?: boolean;
  /** Afficher les dimensions */
  showDimensions?: boolean;
  /** Afficher la description */
  showDescription?: boolean;
  /** Espacement (gap) entre les cartes en pixels */
  gap?: number;
  /** Tri et ordre (optionnels) */
  sortBy?: 'manual' | 'title' | 'price' | 'year';
  sortOrder?: 'asc' | 'desc';
  /** Padding interne de la carte (ex: '8px') */
  cardPadding?: string;
  /** Ombre portée de la carte (box-shadow CSS) */
  cardBoxShadow?: string;
  /** Taille de police pour l'affichage des dimensions */
  dimensionsFontSize?: string;
  /** Couleur du texte pour l'affichage des dimensions */
  dimensionsColor?: string;
  /** Taille de police pour l'affichage de la description */
  descriptionFontSize?: string;
  /** Couleur du texte pour l'affichage de la description */
  descriptionColor?: string;
  /** Taille de police du titre (ex: '16px') */
  titleFontSize?: string;
  /** Couleur du titre */
  titleColor?: string;
  /** Couleur de fond de la carte */
  cardBackgroundColor?: string;
  /** Couleur du texte de la carte */
  cardTextColor?: string;
  /** Rayon de bordure de la carte (ex: '8px') */
  cardBorderRadius?: string;
  /** URL de l'image de fond de la carte */
  cardBackgroundImageUrl?: string;
  /** Afficher le badge de disponibilité si présent */
  showAvailability?: boolean;
  /** Style de la carte (minimal, boxed, overlay) */
  cardStyle?: string;
}

/** Nouveau bloc évolué pour gérer une liste d'œuvres en mode manuel ou par requête */
export interface ArtworkListBlock extends BaseBlock {
  type: 'artworkList';
  mode?: 'manual' | 'query';
  /** Identifiants triés manuellement (si mode = manual) */
  selection?: string[];
  /** Paramètres de requête (si mode = query) */
  query?: {
    search?: string;
    categoryIds?: string[];
    priceMin?: number;
    priceMax?: number;
    yearMin?: number;
    yearMax?: number;
    status?: 'available' | 'sold' | 'all';
  };
  layout?: 'grid' | 'carousel';
  gap?: number;
  sortBy?: 'manual' | 'title' | 'price' | 'year' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  /** Pagination: none (tout), paginate (pages), loadMore (bouton charger plus) */
  paginationType?: 'none' | 'paginate' | 'loadMore';
  /** Nombre d'éléments par page (paginate/loadMore) */
  pageSize?: number;
  // Affichages
  showTitle?: boolean;
  showArtist?: boolean;
  showPrice?: boolean;
  showYear?: boolean;
  showDimensions?: boolean;
  showDescription?: boolean;
  showAvailability?: boolean;
  // Style carte basique
  cardPadding?: string;
  cardBoxShadow?: string;
  cardBackgroundColor?: string;
  cardTextColor?: string;
  cardBorderRadius?: string;
  cardBackgroundImageUrl?: string;
  /** Preset d'apparence de carte */
  cardPreset?: 'default' | 'minimal' | 'bordered' | 'elevated';
  /** Colonnes (aperçu desktop) */
  columns?: number;
  columnsDesktop?: number;
  columnsMobile?: number;
}

export interface ContactFormBlock extends BaseBlock {
  type: 'contactForm';
  variant?: 'default' | 'minimal' | 'boxed' | 'floating';
  submitLabel?: string;
  showSubject?: boolean;
}


export interface EventListItem {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
  linkLabel?: string;
  linkUrl?: string;
  highlight?: boolean;
}

export interface EventListBlock extends BaseBlock {
  type: 'eventList';
  events: EventListItem[];
  layout?: 'timeline' | 'cards' | 'list';
  accentColor?: string;
  showPastEvents?: boolean;
  sortMode?: 'manual' | 'startDateAsc' | 'startDateDesc';
  showDates?: boolean;
  showLocation?: boolean;
  showDescription?: boolean;
  showLink?: boolean;
  condensed?: boolean;
  heading?: string;
  emptyStateMessage?: string;
  upcomingBadgeLabel?: string;
}


/** Affiche dynamiquement le nom de l'artiste tel qu'enregistré */
export interface ArtistNameBlock extends BaseBlock {
  type: 'artistName';
  tag?: 'h1' | 'h2' | 'h3';
  alignment?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  /** Options typographiques */
  lineHeight?: string; // ex: '1.6', '160%'
  letterSpacing?: string; // ex: '0.5px'
  fontWeight?: string; // ex: '400', '700', 'bold'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string; // ex: 'Playfair Display', 'Montserrat', 'serif'
}
/** Affiche dynamiquement la photo de l'artiste enregistrée */
export interface ArtistPhotoBlock extends BaseBlock {
  type: 'artistPhoto';
  alignment?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large' | 'full';
  /** Ajuste le rendu de l'image dans son cadre */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Position de l'image (centre, haut, bas, gauche, droite ou valeur CSS) */
  objectPosition?: string; // ex: 'center', 'top', '50% 50%'
  /** Raccourci de forme pour le rayon des coins */
  shapePreset?: 'square' | 'rounded' | 'soft' | 'circle';
}
/** Affiche ou édite la biographie de l'artiste */
export interface ArtistBioBlock extends BaseBlock {
  type: 'artistBio';
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  /** Options typographiques */
  lineHeight?: string; // ex: '1.6', '160%'
  letterSpacing?: string; // ex: '0.5px'
  fontWeight?: string; // ex: '400', '700', 'bold'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string; // ex: 'Playfair Display', 'Montserrat', 'serif'
}

export type Block =
  | TextBlock
  | ImageBlock
  | GalleryBlock
  | VideoBlock
  | EmbedBlock
  | DividerBlock
  | ButtonBlock
  | ColumnBlock
  | OeuvreBlock
  | ArtworkListBlock
  | ArtistNameBlock
  | ArtistPhotoBlock
  | ArtistBioBlock
  | ContactFormBlock
  | EventListBlock
  | BookBlock;

export interface PageContent {
  title: string;
  slug: string;
  blocks: Block[];
  publishedAt?: Date;
  updatedAt: Date;
}
// -----------------------------------------------------------------------------
// Configuration de thème pour la personnalisation du profil artiste
// -----------------------------------------------------------------------------
export interface ThemeConfig {
  /** Couleur principale du thème (hex, rgb, etc.) */
  primaryColor?: string;
  /** Couleur secondaire ou accentuée */
  secondaryColor?: string;
  /** Couleur de fond de la page */
  backgroundColor?: string;
  /** Couleur du texte principal */
  textColor?: string;
  /** Police d'en-tête (font-family) */
  headingFont?: string;
  /** Police de corps de texte (font-family) */
  bodyFont?: string;
  /** Identifiant d'une famille esthétique complète (couleurs + typographies + surfaces) */
  stylePresetId?: string;
  /** Identifiant d'une palette couleurs dédiée (permet d'écraser celle du preset) */
  colorPresetId?: string;
  /** Identifiant d'une rampe typographique */
  typographyPresetId?: string;
  /** Rythme d'espacement souhaité pour les sections */
  spacingPresetId?: 'compact' | 'balanced' | 'airy';
  /** Traitement des angles des composants (rayon de bordure) */
  surfaceStyle?: 'rounded' | 'soft' | 'sharp' | 'pill';
  /** Ambiance générale (permet d'affiner certains presets dynamiques) */
  tone?: 'light' | 'dark' | 'contrast';
  /** Disposition du profil (default, modern, minimal, custom) */
  layout?: 'default' | 'modern' | 'minimal' | 'custom';
  /** URL d'image de fond */
  backgroundImageUrl?: string;
  /** Couleur d'overlay au-dessus du fond */
  overlayColor?: string; // ex: rgba(0,0,0,0.4) ou #000000
  /** Opacité de l'overlay 0-1 (appliquée si overlayColor est défini) */
  overlayOpacity?: number;
  /** Dégradé simple: from/to/direction (ex: to bottom, 45deg) */
  gradientFrom?: string; // ex: #00000000
  gradientTo?: string;   // ex: #000000
  gradientDirection?: string; // ex: "to bottom", "45deg"
  /** URL d'image de couverture (header) */
  coverImageUrl?: string;
  /** Active une texture de bruit granulé sur l'arrière-plan */
  noiseTexture?: boolean;
  /** Intensité du vignetage (0-100) pour assombrir les bords */
  vignetteStrength?: number;
  /** Intensité du flou d'arrière-plan (0-100) */
  blurIntensity?: number;
  /** Désaturation de l'image de fond (0-100) pour un effet noir & blanc partiel ou total */
  backgroundDesaturation?: number;
  /** Active l'effet de profondeur (parallax) sur le fond */
  backgroundParallax?: boolean;
}

export interface CanvasSettings {
  /** Active l’auto-enregistrement du brouillon dans le CMS */
  autoSaveEnabled?: boolean;
  /** Délai entre chaque sauvegarde automatique (ms) */
  autoSaveDelayMs?: number;
  /**
   * Quand false, le thème (fond/overlays) n’est pas appliqué au rendu Home.
   * Le canevas seul est utilisé pour alimenter les bandeaux de la page d’accueil.
   */
  applyThemeToHome?: boolean;
}

// -----------------------------------------------------------------------------
// NOUVELLE STRUCTURE (Prompt 1 "Data Structure")
// Séparation claire entre Données (Blocks) et Présentation (Layout)
// -----------------------------------------------------------------------------

export interface BlockData {
  id: string;
  type: BlockType;
  // Propriétés de contenu (text, src, etc.)
  [key: string]: any;
}

export interface LayoutCoordinates {
  x: number;
  y: number;
  w: number;
  h: number | string;
  z: number; // zIndex
}

export interface MobileLayoutProps {
  order: number;
  isHidden: boolean;
}

export interface ArtistPageContent {
  /** Données brutes des blocs (contenu partagé) */
  blocksData: Record<string, Block>;

  /** Listes ordonnées d'IDs par device */
  layout: {
    desktop: string[];
    mobile: string[];
  };
}

// Type Guards
export function isTextBlock(block: Block): block is TextBlock {
  return block.type === 'text';
}

export function isImageBlock(block: Block): block is ImageBlock {
  return block.type === 'image';
}

export function isGalleryBlock(block: Block): block is GalleryBlock {
  return block.type === 'gallery';
}

export function isVideoBlock(block: Block): block is VideoBlock {
  return block.type === 'video';
}

export function isEmbedBlock(block: Block): block is EmbedBlock {
  return block.type === 'embed';
}

export function isDividerBlock(block: Block): block is DividerBlock {
  return block.type === 'divider';
}

export function isButtonBlock(block: Block): block is ButtonBlock {
  return block.type === 'button';
}

export function isColumnBlock(block: Block): block is ColumnBlock {
  return block.type === 'columns';
}

export function isOeuvreBlock(block: Block): block is OeuvreBlock {
  return block.type === 'oeuvre';
}

export function isArtworkListBlock(block: Block): block is ArtworkListBlock {
  return block.type === 'artworkList';
}

export function isArtistNameBlock(block: Block): block is ArtistNameBlock {
  return block.type === 'artistName';
}

export function isArtistPhotoBlock(block: Block): block is ArtistPhotoBlock {
  return block.type === 'artistPhoto';
}

export function isArtistBioBlock(block: Block): block is ArtistBioBlock {
  return block.type === 'artistBio';
}

export function isContactFormBlock(block: Block): block is ContactFormBlock {
  return block.type === 'contactForm';
}

export function isEventListBlock(block: Block): block is EventListBlock {
  return block.type === 'eventList';
}

export interface BookItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

export interface BookBlock extends BaseBlock {
  type: 'book';
  items: BookItem[];
  bookStyle?: 'slider' | 'coverflow' | 'cards' | 'fade';
}

export function isBookBlock(block: Block): block is BookBlock {
  return block.type === 'book';
}
