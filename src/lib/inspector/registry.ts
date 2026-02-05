import type { BlockType } from '@/types/cms';
import rawRegistry from '../../../docs/inspector/param-registry.json';

type RawDescriptor = {
  BlockType: string;
  ParameterPath: string;
  Type: string;
  Optional?: boolean;
  SuggestedTab?: string;
  SuggestedControl?: string;
};

export interface StyleParamDescriptor extends RawDescriptor {
  styleParts: string[];
  styleKey: string;
  isAdvanced?: boolean;
}

const registry = rawRegistry as Record<string, RawDescriptor[]>;

const blockTypeToRegistryName: Partial<Record<BlockType, string>> = {
  text: 'TextBlock',
  image: 'ImageBlock',
  gallery: 'GalleryBlock',
  video: 'VideoBlock',
  embed: 'EmbedBlock',
  divider: 'DividerBlock',
  columns: 'ColumnBlock',
  button: 'ButtonBlock',
  oeuvre: 'OeuvreBlock',
  artworkList: 'ArtworkListBlock',
  artistName: 'ArtistNameBlock',
  artistPhoto: 'ArtistPhotoBlock',
  artistBio: 'ArtistBioBlock',
  contactForm: 'ContactFormBlock',
  eventList: 'EventListBlock',
};

const baseStyleDescriptors: RawDescriptor[] =
  (registry.BaseBlock || []).filter(entry => entry.ParameterPath.startsWith('style.'));

const transformDescriptor = (descriptor: RawDescriptor): StyleParamDescriptor | null => {
  if (!descriptor.ParameterPath.startsWith('style.')) return null;
  const styleParts = descriptor.ParameterPath.split('.').slice(1);
  if (styleParts.length === 0) return null;
  return {
    ...descriptor,
    styleParts,
    styleKey: styleParts.join('.'),
  };
};


// Définition des propriétés de style autorisées par type de bloc.
// Cela permet de nettoyer l'interface en masquant les options non pertinentes (ex: 'gap' sur un bloc texte).
const ALLOWED_STYLES: Partial<Record<BlockType, Record<string, string[]>>> = {
  text: {
    layout: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'padding', 'width'],
    appearance: ['backgroundColor', 'borderRadius'],
    typography: ['textAlign'],
  },
  image: {
    layout: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'width'],
    appearance: ['borderRadius', 'boxShadow', 'objectFit', 'objectPosition'],
    behavior: ['hoverScale', 'hoverOpacity', 'hoverTransitionMs'],
  },
  video: {
    layout: ['marginTop', 'marginBottom', 'width'],
    appearance: ['borderRadius', 'boxShadow'],
  },
  embed: {
    layout: ['marginTop', 'marginBottom', 'width'],
    appearance: ['borderRadius', 'boxShadow'],
  },
  button: {
    layout: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'padding', 'width', 'canvasAlign'],
    appearance: ['backgroundColor', 'color', 'borderRadius'],
    behavior: ['hoverScale', 'hoverOpacity', 'hoverShadow'],
  },
  columns: {
    layout: ['marginTop', 'marginBottom', 'padding', 'gap', 'width'],
    background: ['backgroundColor', 'backgroundImageUrl', 'backgroundPosition', 'backgroundSize', 'backgroundRepeat', 'gradientFrom', 'gradientTo', 'gradientDirection', 'overlayColor', 'overlayOpacity'],
    appearance: ['borderRadius', 'boxShadow'],
  },
  gallery: {
    layout: ['marginTop', 'marginBottom', 'gap', 'width'],
  },
  artistPhoto: {
    layout: ['marginTop', 'marginBottom', 'width'],
    appearance: ['borderRadius'],
    behavior: ['hoverScale', 'hoverOpacity'],
  },
  artistName: {
    layout: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'padding', 'width'],
    appearance: ['backgroundColor'],
  },
  artistBio: {
    layout: ['marginTop', 'marginBottom', 'padding', 'width'],
    appearance: ['backgroundColor'],
  },
  // Par défaut, si non listé, on garde les styles de base minimaux
};

const DEFAULT_ALLOWED_STYLES = ['marginTop', 'marginBottom', 'width'];

export const getStyleParamDescriptorsForBlock = (type: BlockType): StyleParamDescriptor[] => {
  const registryName = blockTypeToRegistryName[type];
  const blockEntries = registryName ? registry[registryName] || [] : [];

  // Filtrage des styles de base selon la allowlist
  let localizedAllowed: string[] = DEFAULT_ALLOWED_STYLES;

  const allowedConfig = ALLOWED_STYLES[type];
  if (allowedConfig) {
    // Si la config est un objet de groupes, on l'aplatit
    localizedAllowed = Object.values(allowedConfig).flat();
  }

  const filteredBaseStyles = baseStyleDescriptors.filter(entry => {
    // Reconstruction de la clé de style (ex: 'widthResp.desktop')
    const stylePart = entry.ParameterPath.replace('style.', '');
    return localizedAllowed.includes(stylePart);
  });

  const rawList = [...filteredBaseStyles, ...blockEntries.filter(entry => entry.ParameterPath.startsWith('style.'))];

  const descriptorMap = new Map<string, StyleParamDescriptor>();
  rawList.forEach(descriptor => {
    const transformed = transformDescriptor(descriptor);
    if (!transformed) return;

    // Double vérification, au cas où des styles spécifiques au bloc seraient aussi hors sujet
    // (Mais généralement on fait confiance au blockEntries spécifiques)
    descriptorMap.set(transformed.ParameterPath, transformed);
  });
  return Array.from(descriptorMap.values());
};

export const getGroupedStyleParamDescriptorsForBlock = (type: BlockType): Record<string, StyleParamDescriptor[]> => {
  const registryName = blockTypeToRegistryName[type];
  const blockEntries = registryName ? registry[registryName] || [] : [];

  const allowedConfig = ALLOWED_STYLES[type];
  // Si pas de config, on considère tout comme "misc" ou on utilise default
  // Mais pour supporter le fallback existant :
  const flattenedDescriptors = getStyleParamDescriptorsForBlock(type);

  const groups: Record<string, StyleParamDescriptor[]> = {};

  // 1. Initialiser les groupes connus s'ils existent dans la config
  if (allowedConfig) {
    Object.keys(allowedConfig).forEach(groupName => {
      groups[groupName] = [];
    });
  } else {
    groups['general'] = [];
  }

  // 2. Mapper chaque descriptor à son groupe
  flattenedDescriptors.forEach(descriptor => {
    // Retrouver le stylePart (ex: 'widthResp.desktop')
    const key = descriptor.styleKey;

    let allocated = false;
    if (allowedConfig) {
      for (const [groupName, keys] of Object.entries(allowedConfig)) {
        // On check si la clé exacte est dans le groupe
        // Ou si c'est une sous-clé (ex: 'widthResp.desktop' match 'widthResp' ??? Non, dans ALLOWED_STYLES on a mis les chemins complets flat ou alors on a mis 'widthResp.desktop')
        // Dans registry actuel, j'ai mis 'widthResp.desktop'.
        if (keys.includes(key)) {
          groups[groupName].push(descriptor);
          allocated = true;
          break;
        }
      }
    }

    if (!allocated) {
      // Fallback pour les props non listées explicitement mais passées (ex: block specific)
      if (!groups['misc']) groups['misc'] = [];
      groups['misc'].push(descriptor);
    }
  });

  // Nettoyer les groupes vides
  Object.keys(groups).forEach(k => {
    if (groups[k].length === 0) delete groups[k];
  });

  return groups;
};

