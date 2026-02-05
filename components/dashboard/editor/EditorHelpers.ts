import type { Block } from '@/types/cms';

/**
 * Calcule le style CSS wrapper pour un bloc donné
 * Gère position absolue, alignement canvas, backgrounds multicouches (overlay + gradient + image)
 * 
 * @param b - Le bloc dont le style doit être calculé
 * @returns CSSProperties pour le wrapper du bloc
 */
import { composeWrapperStyle } from '@/lib/cms/style';

/**
 * Calcule le style CSS wrapper pour un bloc donné
 * Utilise maintenant la logique partagée (src/lib/cms/style.ts)
 */
export const computeWrapperStyle = (b: Block): React.CSSProperties => {
    // Editor always enables absolute positioning if x/y are present
    const isAbsolute = (b.x !== undefined || b.y !== undefined) || (b.style?.position === 'absolute');
    return composeWrapperStyle(b, isAbsolute);
};

/**
 * Résout le nom d'une font family en valeur CSS complète avec CSS variables
 * Re-export pour compatibilité
 */
export { resolveFontFamily } from '@/lib/cms/fonts';

/**
 * Génère une checklist des étapes de personnalisation basée sur les types de blocs présents
 * 
 * @param blocksToInspect - Blocs à analyser
 * @returns Liste unique de messages de checklist
 */
export const checklistFromBlocks = (blocksToInspect: Block[]): string[] => {
    const steps = new Set<string>();
    const visit = (block: Block) => {
        const type = block.type;
        switch (type) {
            case 'text':
                steps.add('Adapter les textes à votre univers');
                break;
            case 'image':
            case 'gallery':
            case 'artistPhoto':
                steps.add('Remplacer les visuels par vos propres images');
                break;
            case 'button':
                steps.add('Mettre à jour le libellé et le lien du bouton');
                break;
            case 'oeuvre':
            case 'artworkList':
                steps.add('Sélectionner vos œuvres ou séries à mettre en avant');
                break;
            case 'contactForm':
                steps.add('Vérifier vos informations de contact');
                break;
            case 'eventList':
                steps.add('Actualiser vos événements et disponibilités');
                break;
        }
        const children = (block as any).children as Block[] | undefined;
        if (Array.isArray(children)) children.forEach((child: Block) => visit(child));
        const columns = (block as any).columns as Block[][] | undefined;
        if (Array.isArray(columns)) columns.forEach((col: Block[]) => col?.forEach(visit));
    };
    blocksToInspect.forEach(visit);
    return Array.from(steps);
};

/**
 * Find a block by ID in a nested block tree (including columns and children)
 */
export const findBlockById = (items: Block[], blockId: string): Block | null => {
    for (const blk of items) {
        if (blk.id === blockId) return blk;
        const children = (blk as any)?.children as Block[] | undefined;
        if (Array.isArray(children)) {
            const found = findBlockById(children, blockId);
            if (found) return found;
        }
        const columns = (blk as any)?.columns as Block[][] | undefined;
        if (Array.isArray(columns)) {
            for (const col of columns) {
                const found = findBlockById(col, blockId);
                if (found) return found;
            }
        }
    }
    return null;
};

/**
 * Replace a block by ID in a nested block tree, returning new tree and change flag
 */
export const replaceBlockInTree = (
    items: Block[],
    blockId: string,
    replacer: (current: Block) => Block
): { blocks: Block[]; changed: boolean } => {
    let changed = false;
    const next = items.map(block => {
        let current = block;
        if ((block as any)?.id === blockId) {
            const replaced = replacer(block);
            if (replaced !== block) {
                changed = true;
                current = replaced;
            }
            return current;
        }

        let localChanged = false;

        const children = (block as any)?.children;
        if (Array.isArray(children) && children.length > 0) {
            const result = replaceBlockInTree(children, blockId, replacer);
            if (result.changed) {
                current = { ...(current as any), children: result.blocks } as Block;
                localChanged = true;
            }
        }

        const columns = (block as any)?.columns;
        if (Array.isArray(columns) && columns.length > 0) {
            let columnsChanged = false;
            const nextColumns = columns.map((col: Block[]) => {
                const result = replaceBlockInTree(col, blockId, replacer);
                if (result.changed) {
                    columnsChanged = true;
                    return result.blocks;
                }
                return col;
            });
            if (columnsChanged) {
                current = { ...(current as any), columns: nextColumns } as Block;
                localChanged = true;
            }
        }

        if (localChanged) changed = true;
        return current;
    });
    return { blocks: next, changed };
};
