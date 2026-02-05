#!/usr/bin/env ts-node
/**
 * Script générateur de preset "Nuage Éclaté"
 * Utilise un algorithme mathématique (polaire → cartésien) + AABB collision
 * Sans moteur physique (respect nogravity.md)
 */

// ============================================================================
// TYPES & INTERFACES (standalone, pas d'import externe)
// ============================================================================

interface BlockStyle {
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;
    padding?: string;
    width?: string;
    height?: string;
    backgroundColor?: string;
    color?: string;
    borderRadius?: string;
    boxShadow?: string;
    blendMode?: string;
    hoverOpacity?: number;
    hoverScale?: number;
    hoverShadow?: string;
    hoverTransitionMs?: number;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    [key: string]: any;
}

interface LayoutBlock {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    style: BlockStyle;
    noise?: boolean;
    showOnDesktop?: boolean;
    showOnMobile?: boolean;
    content?: any;
}

interface BoundingBox {
    x: number;  // pourcentage 0-100
    y: number;  // pixels
    width: number;  // pixels
    height: number; // pixels
}

// ============================================================================
// PALETTES COULEURS (extraites de themeTokens.ts)
// ============================================================================

const COLOR_PALETTES = [
    {
        name: 'Loire Editorial',
        primary: '#1d3b62',
        secondary: '#f0b429',
        accent: '#2dd4bf',
        text: '#f8fafc',
        surface: '#16233b',
    },
    {
        name: 'Atelier Haze',
        primary: '#d97706',
        secondary: '#fb923c',
        accent: '#14b8a6',
        text: '#2a1f15',
        surface: '#fdf8f1',
    },
    {
        name: 'Chromatic Neon',
        primary: '#0ea5e9',
        secondary: '#f97316',
        accent: '#a855f7',
        text: '#fdf4ff',
        surface: '#111827',
    },
    {
        name: 'White Cube',
        primary: '#111827',
        secondary: '#475569',
        accent: '#2563eb',
        text: '#0f172a',
        surface: '#ffffff',
    },
];

// Surfaces & Ombres
const SURFACE_STYLES = [
    {
        name: 'rounded',
        radii: { xs: '10px', sm: '14px', md: '18px', lg: '26px' },
        shadows: {
            soft: '0 12px 28px rgba(15,23,42,0.12)',
            medium: '0 20px 48px rgba(15,23,42,0.16)',
            strong: '0 30px 70px rgba(12,10,9,0.32)',
        },
    },
    {
        name: 'soft',
        radii: { xs: '6px', sm: '10px', md: '14px', lg: '18px' },
        shadows: {
            soft: '0 10px 26px rgba(15,23,42,0.1)',
            medium: '0 16px 40px rgba(15,23,42,0.14)',
            strong: '0 24px 60px rgba(15,23,42,0.2)',
        },
    },
    {
        name: 'sharp',
        radii: { xs: '0px', sm: '2px', md: '4px', lg: '6px' },
        shadows: {
            soft: '0 12px 24px rgba(15,23,42,0.14)',
            medium: '0 18px 42px rgba(15,23,42,0.18)',
            strong: '0 26px 66px rgba(15,23,42,0.26)',
        },
    },
    {
        name: 'pill',
        radii: { xs: '16px', sm: '22px', md: '28px', lg: '34px' },
        shadows: {
            soft: '0 16px 40px rgba(15,23,42,0.22)',
            medium: '0 24px 55px rgba(15,23,42,0.28)',
            strong: '0 36px 80px rgba(15,23,42,0.36)',
        },
    },
];

// ============================================================================
// UTILITAIRES MATHÉMATIQUES
// ============================================================================

/** Génère un nombre aléatoire entre min et max (inclusif) */
function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/** Génère un entier aléatoire entre min et max (inclusif) */
function randomInt(min: number, max: number): number {
    return Math.floor(randomRange(min, max + 1));
}

/** Choisit un élément aléatoire dans un tableau */
function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/** Convertit coordonnées polaires (angle, distance) en cartésiennes (x, y) */
function polarToCartesian(
    centerX: number,
    centerY: number,
    angle: number,
    distance: number
): { x: number; y: number } {
    const radians = (angle * Math.PI) / 180;
    return {
        x: centerX + distance * Math.cos(radians),
        y: centerY + distance * Math.sin(radians),
    };
}

/** Vérifie si deux boîtes AABB se chevauchent */
function aabbOverlap(a: BoundingBox, b: BoundingBox): boolean {
    return !(
        a.x + a.width < b.x ||
        b.x + b.width < a.x ||
        a.y + a.height < b.y ||
        b.y + b.height < a.y
    );
}

/** Calcule le pourcentage de chevauchement entre deux boîtes */
function overlapPercentage(a: BoundingBox, b: BoundingBox): number {
    if (!aabbOverlap(a, b)) return 0;

    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    const overlapArea = overlapX * overlapY;
    const aArea = a.width * a.height;
    const bArea = b.width * b.height;
    const smallerArea = Math.min(aArea, bArea);

    return smallerArea > 0 ? (overlapArea / smallerArea) * 100 : 0;
}

// ============================================================================
// CONFIGURATION PRESET "NUAGE ÉCLATÉ"
// ============================================================================

const SCATTER_CONFIG = {
    // Centre du canvas (viewport 1920x1080 approximatif)
    centerX: 50, // % (centre horizontal)
    centerY: 800, // pixels (milieu vertical approximatif)
    canvasWidth: 100, // % total
    canvasHeight: 2000, // pixels total (scrollable)

    // Plages de distance depuis le centre (en pixels)
    distanceRange: { min: 150, max: 550 },

    // Rotation "organique" (degrés)
    rotationRange: { min: -15, max: 15 },

    // Profondeur (zIndex)
    zIndexRange: { min: 1, max: 10 },

    // Seuil de chevauchement toléré (%)
    overlapThreshold: 10,

    // Tentatives max pour résoudre collision
    maxCollisionAttempts: 60,
};

// ============================================================================
// GÉNÉRATEUR DE STYLES
// ============================================================================

/** Génère un style BlockStyle créatif basé sur le type de bloc */
function generateBlockStyle(type: string): BlockStyle {
    // Couleurs aléatoires
    const palette = randomChoice(COLOR_PALETTES);
    const surface = randomChoice(SURFACE_STYLES);

    const baseStyle: BlockStyle = {
        hoverScale: randomRange(1.03, 1.08),
        hoverTransitionMs: 280,
    };

    // Styles spécifiques par type
    switch (type) {
        case 'artistName':
            return {
                ...baseStyle,
                backgroundColor: palette.primary,
                color: palette.text,
                borderRadius: surface.radii.md,
                boxShadow: surface.shadows.strong,
                padding: '2rem 3rem',
                fontSize: '3.5rem',
                fontWeight: '700',
                hoverScale: 1.02, // Moins de mouvement pour l'élément principal
            };

        case 'image':
            return {
                ...baseStyle,
                borderRadius: randomChoice(['0px', surface.radii.xs, surface.radii.lg, '50%']),
                boxShadow: surface.shadows.medium,
                hoverScale: 1.06,
                blendMode: randomChoice(['normal', 'multiply', 'overlay', 'soft-light']),
            };

        case 'text':
            return {
                ...baseStyle,
                backgroundColor: `${palette.accent}22`, // Alpha faible
                color: palette.text,
                borderRadius: surface.radii.sm,
                boxShadow: surface.shadows.soft,
                padding: '1rem 1.5rem',
                fontSize: '1.2rem',
                lineHeight: '1.6',
            };

        default:
            return {
                ...baseStyle,
                borderRadius: surface.radii.md,
                boxShadow: surface.shadows.soft,
            };
    }
}

// ============================================================================
// GÉNÉRATEUR DE LAYOUT "NUAGE ÉCLATÉ"
// ============================================================================

function generateScatterLayout(): LayoutBlock[] {
    const blocks: LayoutBlock[] = [];
    const placedBoxes: BoundingBox[] = [];

    // 1. ANCRE CENTRALE : artistName (taille énorme, zIndex max)
    const anchorBlock: LayoutBlock = {
        id: 'anchor-artist-name',
        type: 'artistName',
        x: SCATTER_CONFIG.centerX, // %
        y: SCATTER_CONFIG.centerY, // px
        width: 600,
        height: 120,
        rotation: 0, // Pas de rotation pour l'ancre
        zIndex: SCATTER_CONFIG.zIndexRange.max,
        style: generateBlockStyle('artistName'),
        noise: false,
        showOnDesktop: true,
        showOnMobile: false,
        content: { tag: 'h1' },
    };
    blocks.push(anchorBlock);

    // Convertir x% en pixels pour AABB (approximation viewport 1920px)
    const anchorX = (anchorBlock.x / 100) * 1920;
    placedBoxes.push({
        x: anchorX - anchorBlock.width / 2,
        y: anchorBlock.y - anchorBlock.height / 2,
        width: anchorBlock.width,
        height: anchorBlock.height,
    });

    // 2. DÉFINITION DES BLOCS À PLACER
    const blocksToPlace: Array<{
        type: string;
        width: number;
        height: number;
        content?: any;
    }> = [
            // 3 artworks (tailles variées)
            {
                type: 'image',
                width: 500,
                height: 400,
                content: { src: '/placeholder-artwork-1.jpg', altText: 'Artwork 1' },
            },
            {
                type: 'image',
                width: 350,
                height: 280,
                content: { src: '/placeholder-artwork-2.jpg', altText: 'Artwork 2' },
            },
            {
                type: 'image',
                width: 320,
                height: 320,
                content: { src: '/placeholder-artwork-3.jpg', altText: 'Artwork 3' },
            },

            // 2 stickers (petits, rotation forte)
            {
                type: 'image',
                width: 150,
                height: 150,
                content: { src: '/sticker-1.png', altText: 'Sticker décoratif' },
            },
            {
                type: 'image',
                width: 120,
                height: 120,
                content: { src: '/sticker-2.png', altText: 'Sticker artistique' },
            },

            // 2 textes courts
            {
                type: 'text',
                width: 280,
                height: 120,
                content: { content: 'Exploration organique des matières brutes' },
            },
            {
                type: 'text',
                width: 320,
                height: 100,
                content: { content: 'Une vision éclatée du monde' },
            },
        ];

    // 3. PLACEMENT EN NUAGE (Polar → Cartesian + AABB)
    blocksToPlace.forEach((blockDef, index) => {
        let placed = false;
        let attempts = 0;
        let distance = randomRange(
            SCATTER_CONFIG.distanceRange.min,
            SCATTER_CONFIG.distanceRange.max
        );

        while (!placed && attempts < SCATTER_CONFIG.maxCollisionAttempts) {
            attempts++;

            // Génère position polaire aléatoire
            const angle = randomRange(0, 360);
            const centerXPx = (SCATTER_CONFIG.centerX / 100) * 1920; // Convertir % en px
            const pos = polarToCartesian(centerXPx, SCATTER_CONFIG.centerY, angle, distance);

            const candidateBox: BoundingBox = {
                x: pos.x - blockDef.width / 2,
                y: pos.y - blockDef.height / 2,
                width: blockDef.width,
                height: blockDef.height,
            };

            // Vérifie chevauchement avec tous les blocs déjà placés
            let hasConflict = false;
            for (const placedBox of placedBoxes) {
                const overlap = overlapPercentage(candidateBox, placedBox);
                if (overlap > SCATTER_CONFIG.overlapThreshold) {
                    hasConflict = true;
                    break;
                }
            }

            if (!hasConflict) {
                // Placement réussi !
                const isSticker = blockDef.width <= 150;

                // Reconvertir position px en %
                const xPercent = (pos.x / 1920) * 100;

                const newBlock: LayoutBlock = {
                    id: `block-${blocks.length}`,
                    type: blockDef.type,
                    x: xPercent, // Stocke en %
                    y: pos.y, // Stocke en px
                    width: blockDef.width,
                    height: blockDef.height,
                    rotation: isSticker
                        ? randomRange(-45, 45) // Rotation forte pour stickers
                        : randomRange(
                            SCATTER_CONFIG.rotationRange.min,
                            SCATTER_CONFIG.rotationRange.max
                        ),
                    zIndex: randomInt(
                        SCATTER_CONFIG.zIndexRange.min,
                        SCATTER_CONFIG.zIndexRange.max
                    ),
                    style: generateBlockStyle(blockDef.type),
                    noise: Math.random() > 0.5, // 50% de chance d'avoir du bruit visuel
                    showOnDesktop: true,
                    showOnMobile: false,
                    content: blockDef.content,
                };

                blocks.push(newBlock);
                placedBoxes.push(candidateBox);
                placed = true;
            } else {
                // Conflit détecté : repousse vers l'extérieur
                distance += 35;
            }
        }

        if (!placed) {
            console.warn(
                `⚠️  Impossible de placer le bloc ${index} (${blockDef.type}) après ${attempts} tentatives`
            );
        }
    });

    return blocks;
}

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================

function main() {
    console.log('🎨 Génération du preset "Nuage Éclaté"...\n');

    const blocks = generateScatterLayout();

    console.log(`✅ ${blocks.length} blocs générés avec succès!\n`);
    console.log('📊 Statistiques:');
    console.log(`   - artistName: ${blocks.filter((b) => b.type === 'artistName').length}`);
    console.log(`   - image: ${blocks.filter((b) => b.type === 'image').length}`);
    console.log(`   - text: ${blocks.filter((b) => b.type === 'text').length}`);
    console.log(`   - Blocs avec noise: ${blocks.filter((b) => b.noise).length}`);

    console.log('\n📦 Preset JSON:\n');
    console.log(JSON.stringify(blocks, null, 2));

    return blocks;
}

// Exécution automatique
main();

export { generateScatterLayout, main };
