/**
 * Preset Index
 * 
 * Catalogue des presets CMS disponibles pour les artistes.
 * Chaque preset est un fichier JSON contenant un tableau de Block[].
 */

export interface PresetMetadata {
    id: string;
    name: string;
    description: string;
    category: 'creative' | 'structured' | 'minimal';
    thumbnail?: string;
    layout: 'freeform' | 'flow';
}

export const PRESETS: PresetMetadata[] = [
    {
        id: 'nuage-eclate',
        name: 'Nuage Éclaté',
        description: 'Disposition libre et dynamique avec des blocs flottants',
        category: 'creative',
        layout: 'freeform',
    },
    {
        id: 'grid-classique',
        name: 'Grille Classique',
        description: 'Mise en page structurée en 2 colonnes',
        category: 'structured',
        layout: 'flow',
    },
    {
        id: 'masonry-moderne',
        name: 'Masonry Moderne',
        description: 'Disposition asymétrique inspirée Pinterest',
        category: 'structured',
        layout: 'flow',
    },
    {
        id: 'minimaliste-epure',
        name: 'Minimaliste Épuré',
        description: 'Design sobre et centré',
        category: 'minimal',
        layout: 'flow',
    },
    {
        id: 'profil-artiste-defaut',
        name: 'Profil Artiste (Défaut)',
        description: 'Design élégant sombre avec hero et grille d\'œuvres',
        category: 'minimal',
        layout: 'flow',
    },
];

/**
 * Charge un preset par son ID
 */
export async function loadPreset(id: string): Promise<unknown[]> {
    const preset = PRESETS.find(p => p.id === id);
    if (!preset) {
        throw new Error(`Preset "${id}" not found`);
    }

    // Import dynamique du fichier JSON
    const module = await import(`./${id}.json`);
    return module.default;
}

/**
 * Récupère la liste des presets par catégorie
 */
export function getPresetsByCategory(category: PresetMetadata['category']): PresetMetadata[] {
    return PRESETS.filter(p => p.category === category);
}

/**
 * Récupère tous les presets
 */
export function getAllPresets(): PresetMetadata[] {
    return PRESETS;
}
