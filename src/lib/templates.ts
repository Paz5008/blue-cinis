/**
 * Blue Cinis - Templates Premium pour Portfolios Artistes
 * Ces templates peuvent être utilisés via l'IA ou manuellement
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'minimalist' | 'bold' | 'cinematic' | 'gallery' | 'modern';
  preview: string;
  blocks: TemplateBlock[];
  theme: TemplateTheme;
  personality: string[];
}

export interface TemplateBlock {
  id: string;
  type: string;
  content: Record<string, any>;
  style: Record<string, any>;
}

export interface TemplateTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  accentColor?: string;
}

export const TEMPLATES: Template[] = [
  // =========================================================================
  // MINIMALIST - Lines, whitespace, typography-focused
  // =========================================================================
  {
    id: 'minimalist-bw',
    name: 'Minimalist B&W',
    description: 'Noir & blanc élégant, typographie monumentale, espaces blancs généreux',
    category: 'minimalist',
    preview: 'Monochrome avec serif monumental',
    personality: ['elegant', 'refined', 'timeless'],
    blocks: [
      {
        id: 'hero-min',
        type: 'hero',
        content: {
          title: '{artistName}',
          subtitle: 'Artiste contemporain',
          ctaText: 'Découvrir',
          ctaLink: '#works',
        },
        style: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          textAlign: 'center',
          paddingTop: '15vh',
          paddingBottom: '15vh',
          titleFontSize: 'clamp(3rem, 8vw, 8rem)',
          titleFontWeight: '300',
          subtitleFontSize: '1.2rem',
          subtitleLetterSpacing: '0.3em',
          subtitleTextTransform: 'uppercase',
        },
      },
      {
        id: 'divider-min',
        type: 'divider',
        content: {},
        style: {
          color: '#000000',
          width: '60px',
          height: '1px',
          margin: '80px auto',
        },
      },
      {
        id: 'gallery-min',
        type: 'gallery',
        content: {
          artworkIds: [],
          displayMode: 'masonry',
        },
        style: {
          columns: 2,
          gap: '40px',
          padding: '0 10%',
        },
      },
      {
        id: 'bio-min',
        type: 'artistBio',
        content: {
          showPhoto: true,
          showName: false,
        },
        style: {
          padding: '120px 15%',
          backgroundColor: '#fafafa',
          textColor: '#333333',
          fontSize: '1.1rem',
          lineHeight: '1.8',
          textAlign: 'left',
        },
      },
    ],
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'Playfair Display',
    },
  },

  // =========================================================================
  // BOLD - High contrast, impact, colors
  // =========================================================================
  {
    id: 'bold-expression',
    name: 'Bold Expression',
    description: 'Impacts forts, couleurs saturées, énergie brute',
    category: 'bold',
    preview: 'Couleurs saturées et typographie audacieuse',
    personality: ['energetic', 'bold', 'controversial'],
    blocks: [
      {
        id: 'hero-bold',
        type: 'hero',
        content: {
          title: '{artistName}',
          subtitle: 'ŒUVRES',
        },
        style: {
          backgroundColor: '#0a0a0a',
          textColor: '#ff3c00',
          textAlign: 'center',
          paddingTop: '20vh',
          paddingBottom: '20vh',
          titleFontSize: 'clamp(4rem, 12vw, 12rem)',
          titleFontWeight: '900',
          titleTextTransform: 'uppercase',
          titleLetterSpacing: '-0.02em',
          subtitleFontSize: '1rem',
          subtitleLetterSpacing: '0.5em',
        },
      },
      {
        id: 'gallery-bold',
        type: 'gallery',
        content: {
          artworkIds: [],
          displayMode: 'carousel',
        },
        style: {
          padding: '60px 0',
          backgroundColor: '#0a0a0a',
        },
      },
      {
        id: 'quote-bold',
        type: 'text',
        content: {
          text: '"L\'art n\'est pas un miroir de la réalité, mais un marteau avec lequel la façonner."',
        },
        style: {
          padding: '100px 10%',
          backgroundColor: '#ff3c00',
          textColor: '#000000',
          fontSize: '2rem',
          fontFamily: 'Space Grotesk',
          fontStyle: 'italic',
          textAlign: 'center',
        },
      },
    ],
    theme: {
      primaryColor: '#ff3c00',
      backgroundColor: '#0a0a0a',
      textColor: '#ffffff',
      fontFamily: 'Space Grotesk',
      accentColor: '#ff3c00',
    },
  },

  // =========================================================================
  // CINEMATIC - Dark, moody, immersive
  // =========================================================================
  {
    id: 'cinematic-noir',
    name: 'Cinematic Noir',
    description: 'Ambiance cinématographie, grain, dark mode profond',
    category: 'cinematic',
    preview: 'Mode sombre avec texture filmique',
    personality: ['moody', 'atmospheric', 'cinematic'],
    blocks: [
      {
        id: 'hero-film',
        type: 'hero',
        content: {
          title: '{artistName}',
          subtitle: 'PORTFOLIO',
        },
        style: {
          backgroundColor: '#000000',
          backgroundImage: 'url(/textures/film-grain.png)',
          backgroundOpacity: '0.15',
          textColor: '#e8e8e8',
          textAlign: 'left',
          paddingTop: '25vh',
          paddingLeft: '8%',
          paddingBottom: '25vh',
          titleFontSize: 'clamp(3rem, 7vw, 9rem)',
          titleFontWeight: '400',
          titleLineHeight: '1',
        },
      },
      {
        id: 'gallery-film',
        type: 'gallery',
        content: {
          artworkIds: [],
          displayMode: 'horizontal-scroll',
        },
        style: {
          padding: '0',
          gap: '20px',
        },
      },
      {
        id: 'about-film',
        type: 'artistBio',
        content: {
          showPhoto: true,
        },
        style: {
          padding: '120px 8%',
          backgroundColor: '#050505',
          textColor: '#a0a0a0',
          fontSize: '1rem',
          lineHeight: '2',
        },
      },
    ],
    theme: {
      primaryColor: '#e8e8e8',
      backgroundColor: '#000000',
      textColor: '#e8e8e8',
      fontFamily: 'Geist',
    },
  },

  // =========================================================================
  // GALLERY - White cube, focus on art
  // =========================================================================
  {
    id: 'gallery-whitecube',
    name: 'White Cube',
    description: 'Espace galerie neutre, focus sur les œuvres, классический',
    category: 'gallery',
    preview: 'Galerie blanche style musée',
    personality: ['professional', 'museum-quality', 'curated'],
    blocks: [
      {
        id: 'hero-gallery',
        type: 'hero',
        content: {
          title: '{artistName}',
          subtitle: '',
        },
        style: {
          backgroundColor: '#ffffff',
          textColor: '#1a1a1a',
          textAlign: 'center',
          paddingTop: '12vh',
          paddingBottom: '8vh',
          titleFontSize: '2.5rem',
          titleFontWeight: '400',
          subtitleDisplay: 'none',
        },
      },
      {
        id: 'gallery-grid',
        type: 'gallery',
        content: {
          artworkIds: [],
          displayMode: 'grid',
        },
        style: {
          columns: 3,
          gap: '60px',
          padding: '60px 5%',
          backgroundColor: '#ffffff',
          maxWidth: '1600px',
          margin: '0 auto',
        },
      },
      {
        id: 'contact-gallery',
        type: 'contact',
        content: {
          showEmail: true,
          showSocial: true,
        },
        style: {
          padding: '80px',
          backgroundColor: '#f5f5f5',
          textAlign: 'center',
        },
      },
    ],
    theme: {
      primaryColor: '#1a1a1a',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'Geist',
    },
  },

  // =========================================================================
  // MODERN - Clean, tech, animations
  // =========================================================================
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    description: 'Design moderne avec animations fluides, scroll reveals',
    category: 'modern',
    preview: 'Animations au scroll, effets parallax',
    personality: ['innovative', 'digital', 'fluid'],
    blocks: [
      {
        id: 'hero-modern',
        type: 'hero',
        content: {
          title: '{artistName}',
          subtitle: 'Créateur numérique',
          ctaText: 'Explorer',
        },
        style: {
          backgroundColor: '#0f0f0f',
          textColor: '#f0f0f0',
          textAlign: 'center',
          paddingTop: '50vh',
          transform: 'translateY(-50%)',
          titleFontSize: 'clamp(2.5rem, 6vw, 6rem)',
          animation: 'fadeInUp 1s ease-out',
        },
      },
      {
        id: 'gallery-modern',
        type: 'gallery',
        content: {
          artworkIds: [],
          displayMode: 'masonry',
        },
        style: {
          columns: 2,
          gap: '24px',
          padding: '100px 8%',
          animation: 'revealOnScroll',
        },
      },
      {
        id: 'stats-modern',
        type: 'stats',
        content: {
          stats: [
            { label: 'Expositions', value: '12' },
            { label: 'Œuvres', value: '{artworkCount}' },
            { label: 'Collectionneurs', value: '150+' },
          ],
        },
        style: {
          padding: '80px',
          backgroundColor: '#1a1a1a',
        },
      },
    ],
    theme: {
      primaryColor: '#00d4ff',
      backgroundColor: '#0f0f0f',
      textColor: '#f0f0f0',
      fontFamily: 'Inter',
      accentColor: '#00d4ff',
    },
  },
];

/**
 * Récupère un template par ID
 */
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

/**
 * Récupère les templates par catégorie
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return TEMPLATES.filter(t => t.category === category);
}

/**
 * Génère le contenu de page à partir d'un template
 */
export function generateFromTemplate(
  templateId: string,
  artistName: string,
  artworkCount: number = 0
): { blocksData: Record<string, any>; theme: TemplateTheme } {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} introuvable`);
  }

  // Remplacer les variables
  const blocksData: Record<string, any> = {};
  
  for (const block of template.blocks) {
    const content = JSON.parse(
      JSON.stringify(block.content).replace(/{artistName}/g, artistName)
        .replace(/{artworkCount}/g, String(artworkCount))
    );
    blocksData[block.id] = { ...block, content };
  }

  return {
    blocksData,
    theme: template.theme,
  };
}
