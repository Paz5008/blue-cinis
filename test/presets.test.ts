import { describe, it, expect } from 'vitest';
import { getTemplateByKey, type TemplateContext } from '@/lib/cms/templates';
import type { Block, BlockType, ThemeConfig } from '@/types/cms';

function createTestContext(themeOverrides: Partial<ThemeConfig> = {}): TemplateContext {
  let idCounter = 0;
  const createBlock = (type: BlockType): Block => {
    const base: any = {
      id: `b-${++idCounter}`,
      type,
      style: {},
      showOnDesktop: true,
      showOnMobile: true,
    };
    switch (type) {
      case 'text':
        base.content = '';
        base.alignment = 'left';
        break;
      case 'image':
        base.src = '';
        base.altText = '';
        base.size = 'medium';
        base.alignment = 'center';
        break;
      case 'gallery':
        base.images = [];
        base.layout = 'grid';
        base.columns = 3;
        break;
      case 'video':
        base.src = '';
        base.controls = true;
        break;
      case 'divider':
        base.borderStyle = 'solid';
        base.color = '#000000';
        base.thickness = 1;
        break;
      case 'quote':
        base.content = '';
        base.author = '';
        base.alignment = 'left';
        break;
      case 'columns':
        base.count = 2;
        base.columns = [[], []];
        break;
      case 'button':
        base.label = '';
        base.url = '';
        base.alignment = 'center';
        break;
      case 'container':
        base.children = [];
        base.columns = 1;
        break;
      case 'spacer':
        base.height = '1rem';
        break;
      case 'oeuvre':
        base.artworks = [];
        base.layout = 'grid';
        base.columns = 3;
        break;
      case 'artworkList':
        base.mode = 'manual';
        base.selection = [];
        base.layout = 'grid';
        break;
      case 'artistName':
        base.alignment = 'center';
        break;
      case 'artistPhoto':
        base.src = '';
        base.alignment = 'center';
        base.size = 'medium';
        break;
      case 'artistBio':
        base.content = '';
        base.alignment = 'left';
        break;
      case 'contactForm':
        base.fields = [];
        break;
      case 'eventList':
        base.events = [];
        base.layout = 'list';
        break;
      default:
        break;
    }
    return base as Block;
  };

  const theme: ThemeConfig = {
    primaryColor: '#1e3a8a',
    secondaryColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    headingFont: 'Playfair Display',
    bodyFont: 'Source Sans Pro',
    stylePresetId: 'white-cube',
    ...themeOverrides,
  };

  return {
    createBlock,
    artistData: {
      name: 'Artiste Test',
      photoUrl: '/portrait.jpg',
      biography: 'Explorations sensibles autour de la Loire et de la lumière.',
    },
    theme,
    oeuvreOptions: [
      { id: 'art-1', title: 'Œuvre 1', imageUrl: '/art-1.jpg', price: 1200 },
      { id: 'art-2', title: 'Œuvre 2', imageUrl: '/art-2.jpg', price: 1500 },
      { id: 'art-3', title: 'Œuvre 3', imageUrl: '/art-3.jpg', price: 1750 },
      { id: 'art-4', title: 'Œuvre 4', imageUrl: '/art-4.jpg', price: 980 },
      { id: 'art-5', title: 'Œuvre 5', imageUrl: '/art-5.jpg', price: 2100 },
    ],
    getHeroBg: () => '/hero.jpg',
    pickUpload: () => '/fallback-upload.jpg',
    getLoremImages: (count = 4) =>
      Array.from({ length: count }).map((_, index) => ({
        id: `img-${index}`,
        src: `/image-${index}.jpg`,
        altText: `Image ${index}`,
      })),
  };
}

function flattenTypes(blocks: Block[]): string[] {
  const types: string[] = [];
  const visit = (block: any) => {
    if (!block) return;
    types.push(block.type);
    if (Array.isArray(block.children)) {
      block.children.forEach(visit);
    }
    if (Array.isArray(block.columns)) {
      block.columns.forEach((col: Block[]) => col.forEach(visit));
    }
  };
  blocks.forEach(visit);
  return types;
}

function findBlock(blocks: Block[], predicate: (block: any) => boolean): any | undefined {
  for (const block of blocks) {
    if (predicate(block)) return block;
    if (Array.isArray(block.children)) {
      const match = findBlock(block.children as Block[], predicate);
      if (match) return match;
    }
    if (Array.isArray(block.columns)) {
      for (const col of block.columns as Block[][]) {
        const match = findBlock(col as Block[], predicate);
        if (match) return match;
      }
    }
  }
  return undefined;
}

describe('getTemplateByKey', () => {
  const STRUCTURE_CASES: Array<{ key: string; expectedType: BlockType }> = [
    { key: 'profileMinimal', expectedType: 'contactForm' },
    { key: 'profileStory', expectedType: 'quote' },
    { key: 'profileCommerce', expectedType: 'artworkList' },
    { key: 'profileCollector', expectedType: 'eventList' },
  ];

  it.each(STRUCTURE_CASES)('returns a rich structure for %s', ({ key, expectedType }) => {
    const ctx = createTestContext();
    const blocks = getTemplateByKey(key, ctx);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
    expect(flattenTypes(blocks)).toContain(expectedType);
  });

  it('profileMinimal includes a hero CTA button with a default contact label', () => {
    const ctx = createTestContext();
    const blocks = getTemplateByKey('profileMinimal', ctx);
    const cta = findBlock(blocks, block => block.type === 'button');
    expect(cta).toBeDefined();
    expect((cta as any).label).toContain('Prendre contact');
  });

  it('profileCommerce configures a catalogue ready for sales', () => {
    const ctx = createTestContext();
    const blocks = getTemplateByKey('profileCommerce', ctx);
    const catalog = findBlock(
      blocks,
      block => block.type === 'artworkList' && (block as any).mode === 'query'
    );
    expect(catalog).toBeDefined();
    expect((catalog as any).showPrice).toBe(true);
    expect((catalog as any).showAvailability).toBe(true);
    expect((catalog as any).limit).toBeGreaterThan(0);
  });

  it('profileCollector seeds an agenda block with default events', () => {
    const ctx = createTestContext();
    const blocks = getTemplateByKey('profileCollector', ctx);
    const agenda = findBlock(blocks, block => block.type === 'eventList');
    expect(agenda).toBeDefined();
    expect(Array.isArray((agenda as any).events)).toBe(true);
    expect((agenda as any).events.length).toBeGreaterThan(0);
  });

  it('falls back to an empty structure for unknown preset keys', () => {
    const ctx = createTestContext();
    const blocks = getTemplateByKey('unknown-key', ctx);
    expect(blocks).toEqual([]);
  });
});
