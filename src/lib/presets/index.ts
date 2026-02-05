import type { ReactNode } from 'react';
import type { BlockStyle } from '@/types/cms';
// Icons can be imported here if we want default icons, but for now we'll define them in the component usage or leave as ReactNode.
// Actually, generic presets might not have specific icons unless we import them from lucide-react here.
// But libraries usually avoid giant icon imports.
// We will define the type first.

export interface BlockPreset {
    id: string;
    label: string;
    icon?: ReactNode; // Can be a component or string identifier if we had an icon registry
    style: Partial<BlockStyle>;
    // Description for tooltips could be added later
}

// --- Text Presets ---
export const TextPresets: BlockPreset[] = [
    {
        id: 'hero-title',
        label: 'Titre Hero',
        style: {
            fontSize: '3rem',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: '1.5rem',
        }
    },
    {
        id: 'quote',
        label: 'Citation',
        style: {
            fontSize: '1.5rem',
            fontStyle: 'italic',
            fontFamily: 'serif',
            textAlign: 'center',
            color: '#4b5563', // gray-600
            padding: '2rem',
            borderLeft: '4px solid #e5e7eb', // gray-200
        }
    },
    {
        id: 'caption',
        label: 'Légende',
        style: {
            fontSize: '0.875rem',
            color: '#6b7280', // gray-500
            textAlign: 'center',
            marginTop: '0.5rem',
        }
    }
];

// --- Image Presets ---
export const ImagePresets: BlockPreset[] = [
    {
        id: 'full-width',
        label: 'Pleine largeur',
        style: {
            width: '100%',
            height: 'auto',
            borderRadius: '0px',
        }
    },
    {
        id: 'polaroid',
        label: 'Polaroid',
        style: {
            padding: '1rem',
            paddingBottom: '3rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
            transform: 'rotate(-2deg)',
            width: '80%',
            margin: '0 auto',
        }
    },
    {
        id: 'circle',
        label: 'Cercle',
        style: {
            borderRadius: '50%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            width: '200px', // Example fixed size or allow user to resize
            height: '200px',
        }
    },
    {
        id: 'floating',
        label: 'Flottant',
        style: {
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-xl
            borderRadius: '1rem',
            transform: 'translateY(-10px)',
        }
    }
];

// --- Button Presets ---
export const ButtonPresets: BlockPreset[] = [
    {
        id: 'primary',
        label: 'Primaire',
        style: {
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            fontWeight: '600',
            textAlign: 'center',
            border: 'none',
        }
    },
    {
        id: 'outline',
        label: 'Outline',
        style: {
            backgroundColor: 'transparent',
            color: '#000000',
            border: '2px solid #000000',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            fontWeight: '600',
            textAlign: 'center',
        }
    },
    {
        id: 'ghost',
        label: 'Ghost',
        style: {
            backgroundColor: 'transparent',
            color: '#374151', // gray-700
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontWeight: '500',
            border: 'none',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
        }
    }
];

// --- Container Presets ---
export const ContainerPresets: BlockPreset[] = [
    {
        id: 'card',
        label: 'Carte',
        style: {
            border: '1px solid #e5e7eb', // gray-200
            borderRadius: '0.75rem',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // shadow-sm
        }
    },
    {
        id: 'dark-section',
        label: 'Section Sombre',
        style: {
            backgroundColor: '#111827', // gray-900
            color: '#f9fafb', // gray-50
            padding: '3rem 1.5rem',
            borderRadius: '0px',
            width: '100%',
        }
    }
];
