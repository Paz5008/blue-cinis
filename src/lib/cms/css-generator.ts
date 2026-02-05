import { Block } from "@/types/cms";

export const buildHoverCSS = (block: Block) => {
    const id = (block?.id || '').toString(); if (!id) return '';
    const st: any = (block?.style) || {};
    const parts: string[] = [];
    const hover: string[] = [];
    if (typeof st.hoverOpacity === 'number') hover.push(`opacity:${Math.max(0, Math.min(1, st.hoverOpacity))};`);
    if (typeof st.hoverScale === 'number' && !isNaN(st.hoverScale)) hover.push(`transform: scale(${st.hoverScale});`);
    if (typeof st.hoverShadow === 'string' && st.hoverShadow.trim().length > 0) hover.push(`box-shadow:${st.hoverShadow};`);
    if (typeof st.hoverTransitionMs === 'number') parts.push(`#blk-${id}{transition: all ${Math.max(0, st.hoverTransitionMs)}ms ease;}`);
    if (hover.length > 0) parts.push(`#blk-${id}:hover{${hover.join(' ')}}`);
    return parts.join('\n');
};

export const buildResponsiveCSS = (block: Block) => {
    const id = (block?.id || '').toString(); if (!id) return '';
    const b: any = block || {}; const css: string[] = [];
    const add = (rule: string) => css.push(rule);

    // Font Size Responsiveness
    if (b.fontSizeResp && (b.fontSizeResp.mobile || b.fontSizeResp.desktop)) {
        if (b.fontSizeResp.mobile) add(`@media (max-width: 767px){#blk-${id} > *{font-size:${b.fontSizeResp.mobile} !important;}}`);
        if (b.fontSizeResp.desktop) add(`@media (min-width: 768px){#blk-${id} > *{font-size:${b.fontSizeResp.desktop} !important;}}`);
    }

    // Width Responsiveness
    if (b.style?.widthResp && (b.style.widthResp.mobile || b.style.widthResp.desktop)) {
        if (b.style.widthResp.mobile) add(`@media (max-width: 767px){#blk-${id} > *{width:${b.style.widthResp.mobile} !important; margin-left:auto; margin-right:auto;}}`);
        if (b.style.widthResp.desktop) add(`@media (min-width: 768px){#blk-${id} > *{width:${b.style.widthResp.desktop} !important; margin-left:auto; margin-right:auto;}}`);
    }

    // Grid Columns Responsiveness (Gallery & Oeuvre)
    if ((b.type === 'gallery' || b.type === 'oeuvre') && (b.columnsMobile || b.columnsDesktop)) {
        const mob = b.columnsMobile || b.columns || 2;
        const desk = b.columnsDesktop || b.columns || 3;
        add(`@media (max-width: 767px){#blk-${id} > *{grid-template-columns:repeat(${mob},minmax(0,1fr)) !important;}}`);
        add(`@media (min-width: 768px){#blk-${id} > *{grid-template-columns:repeat(${desk},minmax(0,1fr)) !important;}}`);
    }

    // Custom Layout (Columns Asymmetry)
    // Support style.gridTemplateColumns as responsive object { mobile, desktop }
    const gtc = b.style?.gridTemplateColumns;
    if (gtc && typeof gtc === 'object') {
        // cast to any to access properties safely given typescript constraints on BlockStyle
        const { mobile, desktop } = gtc as any;
        if (mobile) add(`@media (max-width: 767px){#blk-${id} > *{grid-template-columns:${mobile} !important;}}`);
        if (desktop) add(`@media (min-width: 768px){#blk-${id} > *{grid-template-columns:${desktop} !important;}}`);
    }

    return css.join('\n');
};

export const buildVisibilityCSS = (block: Block) => {
    const id = (block?.id || '').toString(); if (!id) return '';
    const b: any = block || {}; const css: string[] = [];
    const add = (rule: string) => css.push(rule);
    if (b.showOnMobile === false) add(`@media (max-width: 767px){#blk-${id}{display:none !important;}}`);
    if (b.showOnDesktop === false) add(`@media (min-width: 768px){#blk-${id}{display:none !important;}}`);
    if (b.showOnSm === false) add(`@media (min-width:640px) and (max-width:767px){#blk-${id}{display:none !important;}}`);
    if (b.showOnMd === false) add(`@media (min-width:768px) and (max-width:1023px){#blk-${id}{display:none !important;}}`);
    if (b.showOnLg === false) add(`@media (min-width:1024px) and (max-width:1279px){#blk-${id}{display:none !important;}}`);
    if (b.showOnXl === false) add(`@media (min-width:1280px){#blk-${id}{display:none !important;}}`);
    return css.join('');
};
