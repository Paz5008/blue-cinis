import type { Block, ThemeConfig, BlockType } from '@/types/cms';
import { SHARED_ASSETS } from '../cms/shared-assets';
import { createBlockInstance, generatePlaceholder } from '../cms/blockFactory';
import { sortBlocksForMobile } from '../cms/layout/xy-cut';
import { applyFlowLayout } from '../cms/layout/flow-engine';

export interface PageTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    blocks: () => Block[];
    theme?: Partial<ThemeConfig>;
}

/**
 * Helper to replicate createBlock behavior locally
 * avoiding the export object that causes ReferenceError due to circular deps.
 */
const createBlock = <T extends BlockType>(
    type: T,
    overrides: Partial<Extract<Block, { type: T }>> = {},
    usePlaceholders = false
): Extract<Block, { type: T }> => {
    // 1. Create base block with defaults and ID
    const block = createBlockInstance(type);

    // 2. (Optional) Inject rich placeholders
    if (usePlaceholders) {
        const placeholders = generatePlaceholder(type);
        Object.assign(block, placeholders);
    }

    // 3. Apply manual overrides (highest priority)
    if (overrides.style) {
        block.style = { ...block.style, ...overrides.style };
        // Remove style from overrides to prevent overwrite during Object.assign
        const { style, ...rest } = overrides;
        Object.assign(block, rest);
    } else {
        Object.assign(block, overrides);
    }

    return block;
};

/**
 * Hydrates a template by generating a fresh set of blocks with unique IDs.
 * Then calculates their 2D layout positions to avoid overlapping at (0,0).
 * Finally applies XY-Cut sorting to ensure 1D mobile consistency.
 */
export function hydrateTemplate(template: PageTemplate): Block[] {
    const freshBlocks = template.blocks();

    // 1. Calculate 2D coordinates (Flow to Canvas)
    const layoutBlocks = applyFlowLayout(freshBlocks);

    // 2. Ensure 1D order matches visual topological order (Canvas to Mobile)
    return sortBlocksForMobile(layoutBlocks);
}

export const PAGE_TEMPLATES: PageTemplate[] = [
    {
        id: 'editorial',
        name: 'L\'Éditorial',
        description: 'Mise en page style magazine avec typographie forte et espaces asymétriques.',
        blocks: () => [
            // Hero Title
            createBlock('artistName', {
                tag: 'h1',
                alignment: 'left',
                style: { width: '80%', fontSize: '4rem', marginTop: '40px', marginBottom: '60px', lineHeight: '1.1' }
            }),
            // Two columns intro: Text Left, Image Right
            createBlock('text', {
                content: `<h3>Une Approche Organique</h3><p>Mon travail s'ancre dans la matérialité. Je cherche à révéler la texture du monde, le grain de la pierre, la fibre du papier. C'est une exploration tactile avant d'être visuelle.</p>`,
                style: { width: '45%', display: 'inline-block', verticalAlign: 'top', marginRight: '5%' }
            }),
            createBlock('image', {
                src: 'https://placehold.co/600x800/333/FFF?text=Portrait+Artiste',
                caption: 'Dans l\'atelier, 2024',
                style: { width: '45%', display: 'inline-block', verticalAlign: 'top', marginTop: '40px' } // Offset visuals
            }),
            // Quote-style text spanning width
            createBlock('text', {
                content: '<blockquote style="font-style: italic; font-size: 1.5rem;">La lumière ne révèle pas seulement les objets, elle révèle l\'espace entre eux.</blockquote><p style="margin-top: 0.5rem; font-size: 0.9rem;">&mdash; Vision d\'Atelier</p>',
                style: { width: '60%', margin: '80px auto' }
            }),
            // Works grid
            createBlock('artworkList', {
                layout: 'grid',
                columnsDesktop: 3,
                columnsMobile: 1,
                gap: 24,
                limit: 6,
                style: { width: '100%', marginTop: '40px' }
            })
        ]
    },
    {
        id: 'immersive',
        name: 'L\'Immersif',
        description: 'Impact visuel maximal. Idéal pour les photographes.',
        blocks: () => [
            // Full screen Hero
            createBlock('image', {
                src: 'https://placehold.co/1920x1080/111/FFF?text=Hero+Cinematic',
                style: { width: '100%', height: '80vh', objectFit: 'cover', marginBottom: '0' }
            }),
            // Minimal Title overlay effect (simulated via margin for now or plain text below)
            createBlock('artistName', {
                tag: 'h1',
                alignment: 'center',
                style: { fontSize: '3rem', margin: '-80px 0 40px 0', position: 'relative', color: '#FFF', textShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 10 }
            }),
            // Introduction centered
            createBlock('text', {
                alignment: 'center',
                content: '<p>Exploration des frontières entre le réel et l\'imaginaire. Une série photographique sur la perception.</p>',
                style: { maxWidth: '600px', margin: '60px auto', fontSize: '1.2rem' }
            }),
            // Masonry-like gallery
            createBlock('gallery', {
                layout: 'grid', // 'masonry' if supported later
                columns: 2,
                style: { width: '100%', gap: '0' } // Seamless grid
            }, true),
            createBlock('button', {
                label: 'Voir toutes les séries',
                style: { margin: '60px auto' }
            })
        ]
    },
    {
        id: 'atelier',
        name: 'L\'Atelier',
        description: 'Racontez votre histoire. Structure narrative alternée.',
        blocks: () => [
            // Header
            createBlock('artistName', {
                tag: 'h1',
                alignment: 'center',
                style: { fontSize: '2.5rem', marginBottom: '16px' }
            }),
            createBlock('divider', { style: { width: '80px', margin: '0 auto 60px auto' } }),

            // Zig-Zag 1: Image Left, Text Right
            createBlock('image', {
                src: 'https://placehold.co/800x600/222/FFF?text=Le+Processus',
                style: { width: '48%', display: 'inline-block', verticalAlign: 'middle', marginRight: '4%' }
            }),
            createBlock('text', {
                content: '<h3>La Genèse</h3><p>Tout part d\'un croquis. L\'idée brute, jetée sur le papier, prend vie petit à petit. C\'est un dialogue constant avec la matière.</p>',
                style: { width: '48%', display: 'inline-block', verticalAlign: 'middle' }
            }),

            createBlock('divider', { borderStyle: 'solid', color: 'transparent', style: { height: '80px', border: 'none' } }),

            // Zig-Zag 2: Text Left, Image Right
            createBlock('text', {
                content: '<h3>L\'Espace de Création</h3><p>Mon atelier est un sanctuaire. Baigné de lumière du nord, il abrite mes outils, mes doutes et mes révélations. C\'est ici que le temps s\'arrête.</p>',
                style: { width: '48%', display: 'inline-block', verticalAlign: 'middle', marginRight: '4%' }
            }),
            createBlock('image', {
                src: 'https://placehold.co/800x600/444/FFF?text=L\'Atelier',
                style: { width: '48%', display: 'inline-block', verticalAlign: 'middle' }
            }),

            createBlock('divider', { borderStyle: 'solid', color: 'transparent', style: { height: '80px', border: 'none' } }),

            // Video Section
            createBlock('video', {
                caption: 'Immersion : 24h dans ma vie d\'artiste',
                style: { width: '100%', maxWidth: '800px', margin: '0 auto' }
            }, true),

            createBlock('divider', { style: { margin: '60px 0' } }),

            // Events
            createBlock('text', { content: '<h3 style="text-align:center">Prochains Événements</h3>', style: { width: '100%' } }),
            createBlock('eventList', {
                layout: 'list',
                showLocation: true,
                style: { maxWidth: '800px', margin: '30px auto' }
            })
        ]
    },
    {
        id: 'essential',
        name: 'L\'Essentiel',
        description: 'Une expérience brute et sculpturale. Typographie radicale, tensions asymétriques et silences visuels.',
        blocks: () => [
            // ----------------------------------------------------------------------
            // 1. HERO: TYPE AS IMAGE
            // ----------------------------------------------------------------------
            // Massive Name overlapping the image below
            createBlock('artistName', {
                tag: 'h1',
                alignment: 'left',
                style: {
                    fontSize: 'clamp(4rem, 15vw, 15rem)', // Responsive liquid type
                    lineHeight: '0.75',
                    letterSpacing: '-0.04em',
                    fontWeight: '400',
                    fontFamily: '"Playfair Display", serif', // Fallback or custom variable needed? Using system serif for now or Playfair if available
                    marginBottom: '-6vw', // Aggressive overlap
                    marginLeft: '-0.5vw',
                    zIndex: 10, // On top of the image
                    position: 'relative',
                    color: '#222',
                    mixBlendMode: 'normal' // Difference can be tricky on white/light backgrounds, sticking to heavy contrast
                }
            }),

            // The Hero Image
            createBlock('image', {
                alignment: 'center',
                style: {
                    width: '100%',
                    height: '85vh',
                    marginBottom: '60px',
                    filter: 'grayscale(100%) contrast(1.15) brightness(0.95)', // Analog aesthetic
                    objectFit: 'cover'
                },
                src: '/placeholders/Hero%20PlaceHolder%20Serie1.jpeg'
            }),

            // Technical Index (The "Data" aesthetic)
            createBlock('columns', {
                count: 3,
                columns: [
                    [
                        createBlock('text', {
                            content: '<p>FIG. 01 &mdash; PORTFOLIO<br/>ÉTÉ 2026</p>',
                            style: {
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.7rem',
                                letterSpacing: '0.05em',
                                color: '#666',
                                textTransform: 'uppercase',
                                lineHeight: '1.4'
                            }
                        })
                    ],
                    [
                        createBlock('text', {
                            content: '<p>(INDEX VISUEL)</p>',
                            alignment: 'center',
                            style: {
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.7rem',
                                letterSpacing: '0.05em',
                                color: '#AAA',
                                textTransform: 'uppercase'
                            }
                        })
                    ],
                    [
                        createBlock('text', {
                            content: '<p>SCROLL &darr;</p>',
                            alignment: 'right',
                            style: {
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.7rem',
                                letterSpacing: '0.05em',
                                color: '#666',
                                textTransform: 'uppercase'
                            }
                        })
                    ]
                ],
                style: {
                    width: '94%',
                    margin: '-120px auto 180px auto', // Pull up significantly
                    position: 'relative',
                    zIndex: 20,
                    padding: '20px',
                    backgroundColor: 'rgba(255,255,255,0.8)', // Frost effect for readability
                    backdropFilter: 'blur(10px)'
                }
            }),

            // ----------------------------------------------------------------------
            // 2. MANIFESTO (SIDEBAR LAYOUT)
            // ----------------------------------------------------------------------
            createBlock('columns', {
                count: 2,
                columns: [
                    [   // The "Metadata" column
                        createBlock('text', {
                            content: '<p>(01)</p>',
                            style: {
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.8rem',
                                color: '#999',
                                borderTop: '1px solid #000',
                                paddingTop: '10px',
                                display: 'inline-block',
                                width: '40px'
                            }
                        })
                    ],
                    [   // The "Content" column
                        createBlock('text', {
                            content: `
                                <h2 style="font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 300; line-height: 1.1; margin-bottom: 3rem; letter-spacing: -0.02em;">
                                    Le silence comme<br/>matière première.
                                </h2>
                                <div style="display:flex; gap:2rem; align-items:flex-start;">
                                    <div style="width: 20px; height: 1px; background: #000; margin-top: 15px;"></div>
                                    <p style="font-size: 1.1rem; line-height: 1.7; color: #444; font-weight: 400; max-width: 500px;">
                                        Je ne cherche pas l'image parfaite. Je cherche l'accident contrôlé. La lumière qui bave, le grain qui résiste. 
                                        Mon travail est une soustraction constante, jusqu'à ne garder que l'os du sujet.
                                    </p>
                                </div>
                            `,
                            style: {
                                paddingLeft: '0'
                            }
                        })
                    ]
                ],
                style: {
                    width: '85%',
                    margin: '0 auto 240px auto',
                    gap: '4rem',
                    gridTemplateColumns: { desktop: '1fr 6fr', mobile: '1fr' } as any // Very distinct sidebar
                }
            }),

            // ----------------------------------------------------------------------
            // 3. CURATED WORKS (THE BROKEN GRID)
            // ----------------------------------------------------------------------

            // Header for the section
            createBlock('columns', {
                count: 2,
                columns: [
                    [
                        createBlock('text', {
                            content: '<p>(02)</p>',
                            style: {
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.8rem',
                                color: '#999',
                                borderTop: '1px solid #000',
                                paddingTop: '10px',
                                display: 'inline-block',
                                width: '40px'
                            }
                        })
                    ],
                    [
                        createBlock('text', {
                            content: '<p style="font-family: Courier New, monospace; font-size: 0.8rem; text-transform: uppercase;">SELECTED WORKS &mdash; 2023-2026</p>',
                            alignment: 'right',
                            style: {
                                borderTop: '1px solid #E5E5E5',
                                paddingTop: '10px',
                                color: '#999'
                            }
                        })
                    ]
                ],
                style: { width: '85%', margin: '0 auto 60px auto' }
            }),


            // Composition 1: The "Hero" Work + Note
            createBlock('columns', {
                count: 2,
                columns: [
                    [
                        createBlock('oeuvre', {
                            artworks: ['lorem-artwork-4'], // Eclats
                            columns: 1,
                            showTitle: false, // We hide default meta to build our own
                            showYear: false,
                            showDimensions: false,
                            style: { width: '100%' }
                        }),
                        createBlock('text', {
                            content: `
                                <div style="margin-top: 1rem; font-family: Courier New, monospace; font-size: 0.75rem; color: #555;">
                                    <p>FIG. A &mdash; ÉCLATS (2022)</p>
                                    <p>HUILE SUR TOILE, 150X100CM</p>
                                </div>
                             `,
                            style: { width: '100%' }
                        })
                    ],
                    [
                        // Empty space, pushed down text
                        createBlock('text', {
                            content: '<p>Une étude sur la fragmentation de la lumière dans un environnement urbain.</p>',
                            style: {
                                marginTop: '60vh', // Push this way down
                                fontSize: '0.9rem',
                                maxWidth: '200px',
                                borderLeft: '1px solid #000',
                                paddingLeft: '15px'
                            }
                        })
                    ]
                ],
                style: {
                    width: '90%',
                    margin: '0 auto 120px auto',
                    gap: '60px',
                    gridTemplateColumns: { desktop: '3fr 1fr', mobile: '1fr' } as any
                }
            }),

            // Composition 2: The "Cluster"
            createBlock('columns', {
                count: 2,
                columns: [
                    [
                        createBlock('divider', { borderStyle: 'solid', color: 'transparent', style: { height: '150px', border: 'none' } }), // Push down start
                        createBlock('oeuvre', {
                            artworks: ['lorem-artwork-2'],
                            columns: 1,
                            showTitle: true,
                            showYear: true,
                            style: { width: '100%', maxWidth: '400px', marginLeft: 'auto' } // Align right in its column
                        })
                    ],
                    [
                        createBlock('image', {
                            src: '/placeholders/Vertical%20PlaceHolder%20Serie2.jpeg',
                            caption: 'Détail texture (Scan)',
                            style: {
                                width: '100%',
                                filter: 'grayscale(100%) brightness(1.1)',
                                marginTop: '-50px', // Overlap upwards
                                marginLeft: '-50px', // Overlap leftwards
                                zIndex: -1 // Behind
                            }
                        })
                    ]
                ],
                style: {
                    width: '70%',
                    margin: '0 auto 200px auto',
                    gap: '0', // Manual gap management
                    gridTemplateColumns: { desktop: '1.5fr 1fr', mobile: '1fr' } as any
                }
            }),

            // 3b. SOLO MOMENT
            createBlock('image', {
                src: '/placeholders/Hero%20PlaceHolder%20Serie2.jpeg',
                style: {
                    width: '40%',
                    margin: '0 auto 200px auto',
                    filter: 'sepia(20%) grayscale(80%)'
                },
                caption: 'L\'attente.'
            }),

            // ----------------------------------------------------------------------
            // 4. STUDIO / ATELIER (DOCUMENTARY)
            // ----------------------------------------------------------------------
            createBlock('columns', {
                count: 2,
                columns: [
                    [
                        createBlock('text', {
                            content: '<p>(03)</p>',
                            style: {
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.8rem',
                                color: '#999',
                                borderTop: '1px solid #000',
                                paddingTop: '10px',
                                display: 'inline-block',
                                width: '40px'
                            }
                        }),
                        createBlock('text', {
                            content: `
                                <h3 style="font-size: 2rem; margin-top: 2rem; margin-bottom: 2rem; font-weight: 300;">Lumière Naturelle</h3>
                                <p style="font-family: Courier New, monospace; font-size: 0.85rem; line-height: 1.8; color: #333; max-width: 300px;">
                                    NOTES D'ATELIER:<br/><br/>
                                    [x] Pas d'éclairage artificiel.<br/>
                                    [x] Pas de retouches destructives.<br/>
                                    [ ] Laisser le temps faire son œuvre.
                                    <br/><br/>
                                    L'atelier est un espace de vérité brute. Un sanctuaire de poussière et d'idées.
                                </p>
                            `,
                            style: { paddingRight: '20px' }
                        })
                    ],
                    [
                        createBlock('image', {
                            src: '/placeholders/Carre%CC%81%20PlaceHolder%20Serie1.jpeg',
                            style: { width: '100%', filter: 'grayscale(100%) contrast(1.2)' }
                        })
                    ]
                ],
                style: {
                    width: '85%',
                    margin: '0 auto 160px auto',
                    gap: '4rem',
                    gridTemplateColumns: { desktop: '1fr 2fr', mobile: '1fr' } as any
                }
            }),

            // ---------------------------------------------------------------------- //
            // 5. FOOTER (STRICT GRID)
            // ---------------------------------------------------------------------- //
            createBlock('divider', {
                style: { width: '95%', margin: '0 auto 40px auto', borderTop: '1px solid #E5E5E5' }
            }),

            createBlock('columns', {
                count: 4, // 4 Col Grid
                columns: [
                    [   // Col 1: Index
                        createBlock('text', {
                            content: '<p>(04)</p>',
                            style: { fontFamily: 'Courier New, monospace', fontSize: '0.8rem', color: '#999' }
                        })
                    ],
                    [   // Col 2: Location
                        createBlock('text', {
                            content: 'PARIS, FRANCE<br/>EST. 2022',
                            style: { fontFamily: 'Courier New, monospace', fontSize: '0.8rem', lineHeight: '1.5' }
                        })
                    ],
                    [   // Col 3: Socials
                        createBlock('text', {
                            content: '<a href="#">INSTAGRAM</a><br/><a href="#">EMAIL</a>',
                            style: { fontFamily: 'Courier New, monospace', fontSize: '0.8rem', lineHeight: '1.5', textDecoration: 'underline' }
                        })
                    ],
                    [   // Col 4: Button
                        createBlock('button', {
                            label: 'CONTACTER L\'ARTISTE',
                            variant: 'outline', // Assuming we have outline
                            style: { width: '100%', fontSize: '0.8rem' }
                        })
                    ]
                ],
                style: { width: '95%', margin: '0 auto 80px auto' }
            })
        ],
        theme: {
            backgroundColor: '#F7F7F7', // Slightly grey, not pure white
            tone: 'light',
            layout: 'minimal',
            noiseTexture: true,        // Essential
            vignetteStrength: 0,
            blurIntensity: 0
        }
    }
];
