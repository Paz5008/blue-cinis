import { useMemo } from 'react';
import type { Block } from '@/types/cms';

export interface QualityIndicatorItem {
    key: string;
    label: string;
    ok: boolean;
    hint: string;
    familyKey?: string;
}

export interface QualityIndicators {
    score: number;
    items: QualityIndicatorItem[];
}

interface UseQualityIndicatorsOptions {
    blocks: Block[];
    isBanner: boolean;
    metaTitle?: string;
    metaDescription?: string;
}

/**
 * Hook to compute page quality indicators for the editor.
 * Tracks hero presence, gallery, contact form, CTA buttons, and SEO metadata.
 */
export function useQualityIndicators({
    blocks,
    isBanner,
    metaTitle,
    metaDescription,
}: UseQualityIndicatorsOptions): QualityIndicators {
    return useMemo(() => {
        // Traverse blocks to find all types present
        const typeSet = new Set<string>();

        const traverse = (block: Block) => {
            if (!block) return;
            typeSet.add(block.type);
            // Handle container children
            const children = (block as any)?.children;
            if (Array.isArray(children)) {
                children.forEach(traverse);
            }
            // Handle column blocks
            const columns = (block as any)?.columns;
            if (Array.isArray(columns)) {
                columns.forEach((col: Block[]) => col?.forEach(traverse));
            }
        };

        blocks.forEach(traverse);

        // Check for key page components
        const hasHero = typeSet.has('artistName');
        const hasGallery = typeSet.has('gallery') || typeSet.has('artworkList') || typeSet.has('oeuvre');
        const hasContact = typeSet.has('contactForm');
        const hasCTA = typeSet.has('button');
        const hasSeo = Boolean((metaTitle || '').trim()) && Boolean((metaDescription || '').trim());

        const items: QualityIndicatorItem[] = [
            {
                key: 'hero',
                label: 'Hero immersif',
                ok: hasHero,
                hint: 'Ajoutez un hero pour présenter votre univers dès le début.',
            },
            {
                key: 'gallery',
                label: 'Œuvres en vitrine',
                ok: hasGallery,
                hint: 'Sélectionnez quelques pièces clés pour prouver votre savoir-faire.',
            },
            {
                key: 'contact',
                label: 'Point de contact',
                ok: hasContact,
                hint: 'Facilitez la prise de contact avec un formulaire dédié.',
            },
            {
                key: 'cta',
                label: "Appel à l'action",
                ok: hasCTA,
                hint: 'Ajoutez un bouton pour guider vos visiteurs vers la prochaine étape.',
            },
            {
                key: 'seo',
                label: 'SEO complété',
                ok: hasSeo,
                hint: 'Renseignez un titre et une description pour votre page publique.',
            },
        ];

        const completed = items.filter(item => item.ok).length;
        const score = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

        return { score, items };
    }, [blocks, isBanner, metaTitle, metaDescription]);
}
