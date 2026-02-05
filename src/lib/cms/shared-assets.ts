export interface SharedAsset {
    id: string;
    url: string;
    name: string;
    category: 'nature' | 'texture' | 'architecture' | 'abstract' | 'minimal';
}

export const SHARED_ASSETS: SharedAsset[] = [
    // Textures & Surfaces (Great for backgrounds/overlays)
    {
        id: 'shared-texture-paper',
        url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=2787&auto=format&fit=crop',
        name: 'Papier Grain',
        category: 'texture'
    },
    {
        id: 'shared-texture-stone',
        url: 'https://images.unsplash.com/photo-1549309019-38e21971790c?q=80&w=2670&auto=format&fit=crop',
        name: 'Pierre Brute',
        category: 'texture'
    },
    {
        id: 'shared-texture-concrete',
        url: 'https://images.unsplash.com/photo-1517646331032-9e8563c523a1?q=80&w=2787&auto=format&fit=crop',
        name: 'Béton Lisse',
        category: 'texture'
    },

    // Abstract & Minimal (Great for headers/hero)
    {
        id: 'shared-abstract-shadows',
        url: 'https://images.unsplash.com/photo-1507646580970-17e94cb0b234?q=80&w=2670&auto=format&fit=crop',
        name: 'Ombres Architecturales',
        category: 'minimal'
    },
    {
        id: 'shared-abstract-light',
        url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=2787&auto=format&fit=crop',
        name: 'Lumière Divine',
        category: 'abstract'
    },

    // Nature (Great for "Atmosphere")
    {
        id: 'shared-nature-fog',
        url: 'https://images.unsplash.com/photo-1485594050903-8e8ee532298a?q=80&w=2670&auto=format&fit=crop',
        name: 'Brume Matinale',
        category: 'nature'
    },
    {
        id: 'shared-nature-leaves',
        url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2787&auto=format&fit=crop',
        name: 'Feuillage Sombre',
        category: 'nature'
    }
];
