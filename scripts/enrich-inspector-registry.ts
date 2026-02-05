import fs from 'fs';
import path from 'path';

interface ParamRow {
  BlockType: string;
  ParameterPath: string;
  Type: string;
  Optional: boolean;
  SuggestedTab: 'content' | 'settings' | 'styles' | 'theme';
  SuggestedControl: string;
  VisibleIf?: { path: string; equals?: any; notEquals?: any; in?: any[] };
  Scope?: 'responsive' | 'variant' | 'base';
  Label?: string;
  Section?: string;
  LabelI18n?: { fr: string; en?: string };
  SectionI18n?: { fr: string; en?: string };
}

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs', 'inspector');
const SRC = path.join(DOCS, 'param-registry.json');
const OUT = path.join(DOCS, 'param-registry.enriched.json');
const PUBLIC_OUT = path.join(process.cwd(), 'public', 'inspector', 'param-registry.enriched.json');

function enrich(rows: Record<string, ParamRow[]>) {
  const clone: Record<string, ParamRow[]> = {};
  for (const [block, list] of Object.entries(rows)) {
    clone[block] = list.map((r) => ({ ...r }));
  }

  function setVisibleIf(block: string, param: string, rule: NonNullable<ParamRow['VisibleIf']>) {
    const row = clone[block]?.find((x) => x.ParameterPath === param);
    if (row) row.VisibleIf = rule;
  }
  function setScope(block: string, matcher: (r: ParamRow) => boolean, scope: NonNullable<ParamRow['Scope']>) {
    for (const r of clone[block] || []) if (matcher(r)) r.Scope = scope;
  }

  
  function setLabel(block: string, param: string, fr: string, sectionFr?: string) {
    const row = clone[block]?.find((x) => x.ParameterPath === param);
    if (row) {
      row.Label = fr;
      row.LabelI18n = { fr };
      if (sectionFr) {
        row.Section = sectionFr;
        row.SectionI18n = { fr: sectionFr };
      }
    }
  }


  // Global rules across blocks
  for (const [block, list] of Object.entries(clone)) {
    for (const r of list) {

      // Labels normalisés (FR)
      const p = r.ParameterPath;
      const last = p.split('.').pop() || p;
      const human = (s: string) => s
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^src$/i, 'Source')
        .replace(/^url$/i, 'URL')
        .toLowerCase();
      let label = r.Label || '';
      if (!label) {
        if (p == 'alignment') label = 'Alignement';
        else if (p == 'content') label = 'Contenu';
        else if (p == 'label') label = 'Libellé';
        else if (p.endsWith('fontSize')) label = 'Taille de police';
        else if (p.endsWith('fontFamily')) label = 'Police';
        else if (p.endsWith('fontWeight')) label = 'Graisse';
        else if (p.endsWith('lineHeight')) label = 'Interligne';
        else if (p.endsWith('letterSpacing')) label = 'Espacement des lettres';
        else if (p.endsWith('textTransform')) label = 'Transformation du texte';
        else if (p.endsWith?.('color') || /(^|\.)color$/.test(p)) label = 'Couleur';
        else if (p.endsWith('backgroundColor')) label = 'Couleur de fond';
        else if (p.endsWith('backgroundImageUrl')) label = 'Image de fond';
        else if (p.endsWith('overlayColor')) label = "Couleur d'overlay";
        else if (p.endsWith('overlayOpacity')) label = "Opacité de l'overlay";
        else if (p.endsWith('gradientFrom')) label = 'Dégradé (de)';
        else if (p.endsWith('gradientTo')) label = 'Dégradé (vers)';
        else if (p.endsWith('gradientDirection')) label = 'Dégradé (direction)';
        else if (p.endsWith('parallax')) label = 'Parallaxe';
        else if (p.endsWith('borderRadius')) label = 'Rayon des coins';
        else if (p.endsWith('boxShadow') || p.endsWith('cardBoxShadow')) label = 'Ombre';
        else if (p.endsWith('objectFit')) label = "Ajustement de l'image";
        else if (p.endsWith('objectPosition')) label = "Position de l'image";
        else if (p.endsWith('size')) label = 'Taille';
        else if (p.endsWith('width')) label = 'Largeur';
        else if (p.endsWith('height')) label = 'Hauteur';
        else if (p.endsWith('gap')) label = 'Espacement';
        else if (p.startsWith('showOn')) label = 'Visibilité';
        else if (p === 'mode') label = 'Mode';
        else if (p === 'layout') label = 'Disposition';
        else if (p === 'columns' || p === 'columnsDesktop' || p === 'columnsMobile') label = p === 'columns' ? 'Colonnes' : p === 'columnsDesktop' ? 'Colonnes (desktop)' : 'Colonnes (mobile)';
        else if (p === 'paginationType') label = 'Pagination';
        else if (p === 'pageSize') label = 'Éléments par page';
        else if (p === 'selection') label = 'Sélection';
        else if (p === 'query') label = 'Requête';
        else if (p === 'sortBy') label = 'Tri';
        else if (p === 'sortOrder') label = 'Ordre';
        else if (p.startsWith('card')) label = 'Carte - ' + human(last);
        else label = human(last).replace(/\w/g, c => c.toUpperCase());
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }
      r.Label = label;

      // Sections nommées
      if (!r.Section) {
        if (p.startsWith('style.')) {
          if (/background/i.test(p)) r.Section = 'Fond';
          else if (/font|text/i.test(p)) r.Section = 'Typographie';
          else if (/border|radius|shadow/i.test(p)) r.Section = 'Bordures & Ombres';
          else r.Section = 'Apparence';
        } else if (p.startsWith('query') || p.startsWith('selection')) {
          r.Section = 'Données';
        } else if (/columns|layout|gap|width|height/i.test(p)) {
          r.Section = 'Disposition';
        } else if (p.startsWith('showOn')) {
          r.Section = 'Visibilité';
        } else if (/title|artist|price|year|dimensions|description|availability/i.test(p)) {
          r.Section = 'Champs visibles';
        }
      }

      if (r.ParameterPath === 'style.overlayOpacity') {
        r.VisibleIf = { path: 'style.overlayColor' };
      }
      if (r.ParameterPath.endsWith('backgroundSizeCustom')) {
        r.VisibleIf = { path: 'style.backgroundSize', equals: 'custom' } as any;
      }
      if (r.ParameterPath.endsWith('backgroundPositionCustom')) {
        r.VisibleIf = { path: 'style.backgroundPosition', equals: 'custom' } as any;
      }
      if (r.ParameterPath.startsWith('style.widthResp')) {
        r.Scope = 'responsive';
      }
      if (r.ParameterPath.startsWith('showOn')) {
        r.Scope = 'responsive';
      }
    }
  }

  // ArtworkList specific
  setVisibleIf('ArtworkListBlock', 'pageSize', { path: 'paginationType', in: ['paginate', 'loadMore'] });
  setVisibleIf('ArtworkListBlock', 'query', { path: 'mode', equals: 'query' });
  setVisibleIf('ArtworkListBlock', 'selection', { path: 'mode', equals: 'manual' });

  // OeuvreBlock
  setVisibleIf('OeuvreBlock', 'columns', { path: 'layout', equals: 'grid' });


  // Block-specific labels/sections (finer grained)
  // Image-like blocks
  for (const blk of ['ImageBlock', 'ArtistPhotoBlock']) {
    setLabel(blk, 'src', 'Image', 'Image');
    setLabel(blk, 'caption', 'Légende', 'Image');
    setLabel(blk, 'altText', 'Texte alternatif', 'Image');
    setLabel(blk, 'objectFit', "Ajustement de l'image", 'Image');
    setLabel(blk, 'objectPosition', "Position de l'image", 'Image');
    setLabel(blk, 'size', 'Taille', 'Image');
    setLabel(blk, 'alignment', 'Alignement', 'Disposition');
  }

  // Video block
  setLabel('VideoBlock', 'src', 'Vidéo', 'Vidéo');
  setLabel('VideoBlock', 'poster', 'Image de couverture', 'Vidéo');
  setLabel('VideoBlock', 'autoplay', 'Lecture automatique', 'Vidéo');
  setLabel('VideoBlock', 'loop', 'Boucle', 'Vidéo');
  setLabel('VideoBlock', 'muted', 'Muet', 'Vidéo');
  setLabel('VideoBlock', 'controls', 'Contrôles', 'Vidéo');
  setLabel('VideoBlock', 'width', 'Largeur', 'Dimensions');
  setLabel('VideoBlock', 'height', 'Hauteur', 'Dimensions');

  // Button block
  setLabel('ButtonBlock', 'label', 'Texte du bouton', 'Contenu');
  setLabel('ButtonBlock', 'url', 'Lien', 'Contenu');
  setLabel('ButtonBlock', 'alignment', 'Alignement', 'Disposition');
  // BaseBlock hover props → États
  for (const p of ['style.hoverOpacity', 'style.hoverScale', 'style.hoverShadow', 'style.hoverTransitionMs']) {
    for (const [block, list] of Object.entries(clone)) {
      if (block.endsWith('Block')) {
        const row = list.find((r) => r.ParameterPath === p);
        if (row) {
          row.Section = 'États (hover)';
          row.SectionI18n = { fr: 'États (hover)' };
          if (p.endsWith('hoverOpacity')) row.Label = "Opacité (hover)";
          if (p.endsWith('hoverScale')) row.Label = "Échelle (hover)";
          if (p.endsWith('hoverShadow')) row.Label = "Ombre (hover)";
          if (p.endsWith('hoverTransitionMs')) row.Label = "Transition (ms)";
        }
      }
    }
  }

  // Gallery/ArtworkList image tuning
  for (const blk of ['GalleryBlock', 'ArtworkListBlock']) {
    setLabel(blk, 'objectFit', 'Ajustement des vignettes', 'Vignettes');
    setLabel(blk, 'objectPosition', 'Position des vignettes', 'Vignettes');
  }

  // Oeuvre/ArtworkList card styling
  for (const blk of ['OeuvreBlock', 'ArtworkListBlock']) {
    for (const p of ['cardPadding', 'cardBoxShadow', 'cardBackgroundColor', 'cardTextColor', 'cardBorderRadius', 'cardBackgroundImageUrl']) {
      setLabel(blk, p, (p === 'cardPadding' ? 'Padding' :
                        p === 'cardBoxShadow' ? 'Ombre' :
                        p === 'cardBackgroundColor' ? 'Couleur de fond' :
                        p === 'cardTextColor' ? 'Couleur du texte' :
                        p === 'cardBorderRadius' ? 'Rayon des coins' :
                        'Image de fond'), 'Carte');
    }
  }

  return clone;
}

function main() {
  const raw = fs.readFileSync(SRC, 'utf8');
  const data = JSON.parse(raw) as Record<string, ParamRow[]>;
  const enriched = enrich(data);
  fs.writeFileSync(OUT, JSON.stringify(enriched, null, 2), 'utf8');
  try {
    const pubdir = path.dirname(PUBLIC_OUT);
    if (!fs.existsSync(pubdir)) fs.mkdirSync(pubdir, { recursive: true });
    fs.writeFileSync(PUBLIC_OUT, JSON.stringify(enriched, null, 2), 'utf8');
  } catch {}
  console.log('Wrote', path.relative(ROOT, OUT));
}

main();
