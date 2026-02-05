import { Block } from '@/types/cms';
import { CSSProperties } from 'react';

/**
 * Largeur de référence du canvas de l'éditeur.
 * Doit correspondre à desktopMaxWidth dans Editor.tsx.
 */
export const EDITOR_CANVAS_WIDTH = 1200;

/**
 * Calcule le style CSS de positionnement pour un bloc.
 * Centralise la logique de positionnement absolu utilisée par FreeFormCanvas, 
 * PreviewFrame et BlockRenderer pour assurer la cohérence du rendu.
 * 
 * IMPORTANT: La position X est convertie de pourcentage en pixels absolus
 * basés sur la largeur de référence de 1200px (desktopMaxWidth) pour éviter
 * que les blocs disparaissent quand ils sont positionnés trop à droite.
 * 
 * @param block - Le bloc à positionner
 * @param enableAbsolutePositioning - Si true, active le positionnement absolu
 * @returns Style CSS de positionnement
 * 
 * @example
 * ```tsx
 * const style = getBlockPositionStyle(block, true);
 * return <div style={style}>{content}</div>;
 * ```
 */
export function getBlockPositionStyle(
    block: Block,
    enableAbsolutePositioning: boolean
): CSSProperties {
    if (!enableAbsolutePositioning || (block.x === undefined && block.y === undefined)) {
        return {};
    }

    // FreeForm editor stores x/y directly in pixels (not percentage)
    // Use values directly without conversion
    return {
        position: 'absolute',
        left: block.x !== undefined ? `${block.x}px` : undefined,
        top: block.y !== undefined ? `${block.y}px` : undefined,
        width: block.width || 'auto',
        height: block.height || 'auto',
        transform: block.rotation ? `rotate(${block.rotation}deg)` : undefined,
        zIndex: block.zIndex || 0,
    };
}

/**
 * Calcule la largeur minimale requise pour contenir tous les blocs positionnés.
 * Utilisé pour déterminer la largeur du conteneur en mode positionnement absolu
 * afin d'éviter que les blocs ne soient coupés.
 * 
 * @param blocks - Liste des blocs à analyser
 * @param enableAbsolutePositioning - Si true, calcule la largeur pour positionnement absolu
 * @returns Largeur minimale en pixels
 * 
 * @example
 * ```tsx
 * const minWidth = calculateContentWidth(blocks, true);
 * return <div style={{ minWidth }}>{renderBlocks()}</div>;
 * ```
 */
export function calculateContentWidth(
    blocks: Block[],
    enableAbsolutePositioning: boolean
): number {
    if (!enableAbsolutePositioning || !blocks?.length) {
        return EDITOR_CANVAS_WIDTH; // Default canvas width
    }

    return blocks.reduce((max, block) => {
        if (block.x === undefined) return max;

        // x is already in pixels (FreeForm editor stores pixels directly)
        const leftPx = block.x;

        // Parse width
        let widthPx = 0;
        if (typeof block.width === 'number') {
            widthPx = block.width;
        } else if (typeof block.width === 'string' && block.width.endsWith('px')) {
            widthPx = parseInt(block.width, 10);
        } else if (typeof block.width === 'string' && block.width.endsWith('%')) {
            // If width is percentage, assume it's relative to canvas width
            const widthPercent = parseFloat(block.width);
            widthPx = (widthPercent / 100) * EDITOR_CANVAS_WIDTH;
        }

        // Calculate right edge position
        const rightEdge = leftPx + widthPx;

        return Math.max(max, rightEdge);
    }, EDITOR_CANVAS_WIDTH); // Start with at least canvas width
}

/**
 * Calcule la hauteur totale du contenu en fonction des blocs positionnés.
 * Utilisé pour déterminer la hauteur minimale du conteneur en mode positionnement absolu.
 * 
 * @param blocks - Liste des blocs à analyser
 * @param enableAbsolutePositioning - Si true, calcule la hauteur pour positionnement absolu
 * @param defaultHeight - Hauteur par défaut d'un bloc si non spécifiée (défaut: 300px)
 * @returns Hauteur totale du contenu en pixels
 * 
 * @example
 * ```tsx
 * const contentHeight = calculateContentHeight(blocks, true);
 * return <div style={{ minHeight: contentHeight }}>{renderBlocks()}</div>;
 * ```
 */
export function calculateContentHeight(
    blocks: Block[],
    enableAbsolutePositioning: boolean,
    defaultHeight: number = 300
): number {
    if (!enableAbsolutePositioning || !blocks?.length) {
        return 0;
    }

    return blocks.reduce((max, block) => {
        const y = block.y || 0;
        let h = defaultHeight;

        // Parse height si c'est une string avec unité px
        if (typeof block.height === 'number') {
            h = block.height;
        } else if (typeof block.height === 'string' && block.height.endsWith('px')) {
            h = parseInt(block.height, 10);
        }

        return Math.max(max, y + h);
    }, 0) + 150; // Ajoute 150px de padding pour éviter le clipping
}
