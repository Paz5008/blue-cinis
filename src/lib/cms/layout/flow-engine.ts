import { Block } from '@/types/cms';

const CANVAS_WIDTH = 1200; // Largeur standard du canvas Desktop
const DEFAULT_GAP = 24; // Espacement vertical par défaut

/**
 * Estime la hauteur d'un bloc pour le calcul du flux.
 * C'est une approximation car le rendu réel dépend du DOM.
 */
function estimateBlockHeight(block: Block, widthPx: number): number {
    // Si une hauteur explicite est définie en px
    if (typeof block.height === 'number') return block.height;
    if (typeof block.height === 'string' && block.height.endsWith('px')) return parseFloat(block.height);

    // Si le style définit une hauteur
    if (block.style?.height && typeof block.style.height === 'string' && block.style.height.endsWith('px')) {
        return parseFloat(block.style.height);
    }

    // Estimation par type
    switch (block.type) {
        case 'image':
            // Si ratio défini, l'utiliser. Sinon 400px par défaut.
            return 400;
        case 'text':
            // Estimation très grossière basée sur la longueur du contenu si dispo
            const content = (block as any).content || '';
            const length = content.length;
            if (length > 500) return 300;
            if (length > 200) return 200;
            return 100;
        case 'artistName':
            return 120; // H1 + margins
        case 'gallery':
            return 500;
        case 'video':
            return widthPx * (9 / 16); // 16:9 ratio
        case 'divider':
            return 40;
        default:
            return 150;
    }
}

/**
 * Parse une largeur (px ou %) en pixels absolus.
 */
function parseWidth(widthVal: number | string | undefined, containerWidth: number): number {
    if (widthVal === undefined) return containerWidth; // Default to 100%
    if (typeof widthVal === 'number') return widthVal;
    if (typeof widthVal === 'string') {
        if (widthVal.endsWith('%')) {
            const percent = parseFloat(widthVal);
            return (percent / 100) * containerWidth;
        }
        if (widthVal.endsWith('px')) {
            return parseFloat(widthVal);
        }
    }
    return containerWidth;
}

/**
 * Applique des coordonnées (x, y) aux blocs pour simuler un flux naturel (Flow Layout).
 * Les blocs se placent les uns après les autres, ou côte à côte s'ils "rentrent" dans la largeur.
 */
export function applyFlowLayout(blocks: Block[]): Block[] {
    let currentX = 0;
    let currentY = 50; // Marge initiale haut
    let rowHeight = 0;

    return blocks.map(block => {
        // Déterminer la largeur effective du bloc
        // On check pririotairement block.style.width car c'est ce que BlockFactory utilise souvent
        const styleWidth = block.style?.width;
        const widthPx = parseWidth(styleWidth || block.width, CANVAS_WIDTH);

        // Est-ce que ça rentre dans la ligne actuelle ?
        // On laisse une petite marge d'erreur (1px)
        if (currentX + widthPx > CANVAS_WIDTH + 1) {
            // New line
            currentX = 0;
            currentY += rowHeight + DEFAULT_GAP;
            rowHeight = 0;
        }

        // Positionner le bloc
        const positionedBlock = {
            ...block,
            x: currentX,
            y: currentY,
            // S'assurer que width est set sur le root pour le drag & drop si c'est un %
            width: block.width ?? styleWidth ?? CANVAS_WIDTH
        };

        // Estimation de la hauteur pour le layout du PROCHAIN bloc
        const estimatedH = estimateBlockHeight(block, widthPx);
        rowHeight = Math.max(rowHeight, estimatedH);

        // Avancer curseur X
        // Si c'est 100%, on force le passage à la ligne suivante pour être propre
        if (widthPx >= CANVAS_WIDTH - 1) {
            currentX = 0;
            currentY += estimatedH + DEFAULT_GAP;
            rowHeight = 0;
        } else {
            currentX += widthPx + DEFAULT_GAP; // Gap horizontal
        }

        return positionedBlock;
    });
}
