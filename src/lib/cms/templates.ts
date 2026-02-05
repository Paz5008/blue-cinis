import type { Block, BlockType, ThemeConfig } from '@/types/cms';
import { resolveThemeTokens } from '@/lib/cms/themeTokens';

export interface OeuvreOption {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    dimensions?: string;
    year?: number;
    description?: string;
    artistName?: string;
}

export interface TemplateContext {
    createBlock: (type: BlockType) => Block;
    artistData: { name: string; photoUrl?: string; biography?: string };
    theme: ThemeConfig;
    oeuvreOptions: OeuvreOption[];
    getHeroBg: (key: string) => string | undefined;
    pickUpload: (seed: number) => string | undefined;
    getLoremImages: (count?: number, seed?: number) => { id: string; src: string; altText?: string }[];
}

export type BannerPresetId =
    | 'profileMinimal'
    | 'profileStory'
    | 'profileCommerce'
    | 'profileCollector'
    | 'boutique'
    | 'minimal'
    | 'portfolio'
    | 'bioGrid'
    | 'complete'
    | 'showcase'
    | 'aboutPortfolio'
    | 'modern'
    | 'minimalPlus'
    | 'dark'
    | 'editorial'
    | 'poster'
    | 'banner'
    | 'heroVideo'
    | 'editorialMixed'
    | 'minimalLuxe'
    | 'showcaseDeluxe'
    | 'portfolioMasonry'
    | 'monochromeEditorial'
    | 'signature'
    | 'commerce'
    | 'editorialPro'
    | 'minimalClean';

export function getTemplateByKey(key: string, ctx: TemplateContext): Block[] {
    const { createBlock, artistData, getLoremImages, pickUpload } = ctx as any;
    const themeTokens = resolveThemeTokens(ctx.theme || {} as ThemeConfig);
    const palette = themeTokens.palette.colors;
    const fonts = themeTokens.typography;
    const spacing = themeTokens.spacing;
    const surfaces = themeTokens.surfaces;
    const textColor = palette.text;
    const textMuted = palette.textMuted;
    const primaryColor = palette.primary;
    const accentColor = palette.accent;
    const surfaceBackground = themeTokens.surfaceBackground;
    const cardBackground = themeTokens.cardBackground;
    const pickReadable = (hex?: string) => {
        if (!hex || typeof hex !== 'string') return textColor;
        const clean = hex.replace('#', '').trim();
        const normalized =
            clean.length === 3
                ? clean.split('').map(ch => ch + ch).join('')
                : clean.length >= 6
                    ? clean.slice(0, 6)
                    : `${clean}${clean.slice(-1).repeat(Math.max(0, 6 - clean.length))}`;
        if (normalized.length !== 6) return textColor;
        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6 ? '#0b1120' : '#f8fafc';
    };
    const textOnAccent = pickReadable(accentColor);
    const textOnPrimary = pickReadable(primaryColor);
    switch (key) {
        case 'profileMinimal': {
            const hero = createBlock('container') as any;
            hero.columns = 1;
            hero.style = {
                padding: `${spacing.sectionPadding.hero} 1.5rem`,
                textAlign: 'center',
                backgroundColor: surfaceBackground,
                gap: spacing.gap.sm,
                borderRadius: surfaces.radii.lg,
                boxShadow: surfaces.shadows.soft,
                border: surfaces.border.subtle,
                color: textColor,
            };

            const nameBlock = createBlock('artistName') as any;
            nameBlock.style = {
                margin: '0',
                letterSpacing: fonts.ramps.h2.letterSpacing,
                fontSize: fonts.ramps.h2.fontSize,
                lineHeight: fonts.ramps.h2.lineHeight,
                fontWeight: fonts.ramps.h2.fontWeight || '600',
                fontFamily: fonts.headingFont,
            };

            const pitch = createBlock('text') as any;
            const intro = artistData?.biography ? (artistData.biography.split(/[.,]/)[0] || '').trim() : 'Exploration sensible des matières et de la lumière.';
            pitch.content = `<p style="margin:0;font-family:${fonts.bodyFont};font-size:${fonts.ramps.lead.fontSize};line-height:${fonts.ramps.lead.lineHeight};color:${textMuted};">${artistData?.name || 'Artiste'} — ${intro}</p>`;
            pitch.style = { margin: '0.25rem 0 0', textAlign: 'center' };

            const primaryCta = createBlock('button') as any;
            primaryCta.label = 'Prendre contact';
            primaryCta.url = '/contact';
            primaryCta.alignment = 'center';
            primaryCta.style = {
                margin: `${spacing.gap.xs} auto 0`,
                padding: '0.85rem 2.5rem',
                backgroundColor: accentColor,
                color: textOnAccent,
                borderRadius: surfaces.radii.pill,
                fontFamily: fonts.bodyFont,
                fontWeight: fonts.ramps.button.fontWeight || '600',
            };

            hero.children = [nameBlock, pitch, primaryCta];

            const portrait = createBlock('artistPhoto') as any;
            portrait.style = {
                width: '220px',
                height: '220px',
                borderRadius: surfaces.radii.md,
                margin: '0 auto',
                objectFit: 'cover',
                boxShadow: surfaces.shadows.soft,
            };
            if (!artistData?.photoUrl) portrait.src = pickUpload(0) || '';

            const bio = createBlock('artistBio') as any;
            bio.style = {
                maxWidth: '680px',
                margin: `${spacing.gap.sm} auto 0`,
                lineHeight: fonts.ramps.body.lineHeight,
                textAlign: 'center',
                color: textMuted,
                fontFamily: fonts.bodyFont,
            };

            const highlights = createBlock('columns') as any;
            highlights.count = 3;
            highlights.columns = [
                [
                    (() => {
                        const t = createBlock('text') as any;
                        t.content = '<strong>Œuvres originales</strong><br/>Pièces uniques disponibles en ligne.';
                        t.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return t;
                    })(),
                ],
                [
                    (() => {
                        const t = createBlock('text') as any;
                        t.content = '<strong>Expositions</strong><br/>Sélection nationale & internationale.';
                        t.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return t;
                    })(),
                ],
                [
                    (() => {
                        const t = createBlock('text') as any;
                        t.content = '<strong>Collaborations</strong><br/>Architectes, maisons d’édition, hôtels.';
                        t.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return t;
                    })(),
                ],
            ];
            highlights.style = { gap: spacing.gap.sm, padding: `${spacing.gap.sm} 0` };

            const artworks = createBlock('artworkList') as any;
            artworks.mode = 'query';
            artworks.layout = 'grid';
            artworks.columnsDesktop = 3;
            artworks.columnsMobile = 1;
            artworks.gap = 20;
            artworks.limit = 6;
            artworks.sortBy = 'createdAt';
            artworks.sortOrder = 'desc';
            artworks.showPrice = true;
            artworks.showArtist = false;
            artworks.showAvailability = true;
            artworks.cardPreset = 'minimal';
            artworks.cardBackgroundColor = cardBackground;
            artworks.cardTextColor = textColor;

            const contact = createBlock('contactForm') as any;
            contact.style = {
                margin: '2rem auto',
                maxWidth: '560px',
                padding: '2rem',
                border: surfaces.border.subtle,
                borderRadius: surfaces.radii.md,
                backgroundColor: cardBackground,
                boxShadow: surfaces.shadows.soft,
            };

            return [hero, portrait, bio, highlights, artworks, contact] as Block[];
        }
        case 'profileStory': {
            const hero = createBlock('container') as any;
            hero.columns = 1;
            hero.style = {
                padding: `${spacing.sectionPadding.hero} 1.5rem`,
                textAlign: 'center',
                backgroundImageUrl: ctx.getHeroBg('story'),
                overlayColor: primaryColor,
                overlayOpacity: 0.55,
                color: textOnPrimary,
                gap: spacing.gap.sm,
                borderRadius: surfaces.radii.lg,
                boxShadow: surfaces.shadows.strong,
            };
            const title = createBlock('artistName') as any;
            title.style = {
                margin: 0,
                fontSize: fonts.ramps.h2.fontSize,
                lineHeight: fonts.ramps.h2.lineHeight,
                letterSpacing: fonts.ramps.h2.letterSpacing,
                fontFamily: fonts.headingFont,
                fontWeight: fonts.ramps.h2.fontWeight || '600',
            };
            const subtitle = createBlock('text') as any;
            subtitle.content = 'Parcours & manifeste';
            subtitle.style = {
                margin: '0',
                textTransform: fonts.ramps.kicker.textTransform,
                letterSpacing: fonts.ramps.kicker.letterSpacing,
                fontSize: fonts.ramps.kicker.fontSize,
                fontFamily: fonts.bodyFont,
                fontWeight: fonts.ramps.kicker.fontWeight,
                color: textOnPrimary === '#0b1120' ? '#0b1120' : 'rgba(248,250,252,0.85)',
            };
            hero.children = [title, subtitle];

            const intro = createBlock('text') as any;
            intro.content = `<h2 style="margin-bottom:0.5rem;font-family:${fonts.headingFont};font-size:${fonts.ramps.h3.fontSize};line-height:${fonts.ramps.h3.lineHeight};">${artistData?.name || 'Chapitre'} — Origins</h2><p style="font-family:${fonts.bodyFont};line-height:${fonts.ramps.body.lineHeight};color:${textColor};">Partager le déclic, la matière fondatrice, les rencontres déterminantes.</p>`;
            intro.style = { maxWidth: '720px', margin: '2rem auto', textAlign: 'left', color: textColor };

            const timeline = createBlock('columns') as any;
            timeline.count = 3;
            timeline.columns = [
                [
                    (() => {
                        const block = createBlock('text') as any;
                        block.content = '<strong>2017</strong><br/>Résidence à Kyoto — immersion dans les pigments naturels.';
                        block.style = { textAlign: 'left', margin: '0', color: textMuted, fontFamily: fonts.bodyFont, lineHeight: fonts.ramps.body.lineHeight };
                        return block;
                    })(),
                ],
                [
                    (() => {
                        const block = createBlock('text') as any;
                        block.content = '<strong>2020</strong><br/>Série “Les courants” — exploration des flux et marées.';
                        block.style = { textAlign: 'left', margin: '0', color: textMuted, fontFamily: fonts.bodyFont, lineHeight: fonts.ramps.body.lineHeight };
                        return block;
                    })(),
                ],
                [
                    (() => {
                        const block = createBlock('text') as any;
                        block.content = '<strong>2023</strong><br/>Collaboration avec les ateliers Blue Cinis pour une pièce monumentale.';
                        block.style = { textAlign: 'left', margin: '0', color: textMuted, fontFamily: fonts.bodyFont, lineHeight: fonts.ramps.body.lineHeight };
                        return block;
                    })(),
                ],
            ];
            timeline.style = { gap: spacing.gap.md, padding: `${spacing.gap.xs} 0` };

            const gallery = createBlock('gallery') as any;
            gallery.layout = 'masonry';
            gallery.columns = 4;
            gallery.images = getLoremImages(8, 9);
            gallery.style = { gap: spacing.gap.xs, borderRadius: surfaces.radii.md };

            const quote = createBlock('quote') as any;
            quote.content = '« La matière m’apprend à ralentir, à suivre les cycles de la Loire. »';
            quote.author = artistData?.name || '';
            quote.style = { maxWidth: '640px', margin: '2rem auto', color: textColor, fontFamily: fonts.headingFont };

            const closing = createBlock('button') as any;
            closing.label = 'Télécharger le dossier de presse';
            closing.url = '/contact';
            closing.alignment = 'center';
            closing.variant = 'outline';
            closing.style = {
                margin: '1.5rem auto',
                width: '240px',
                borderRadius: surfaces.radii.pill,
                border: `1px solid ${textOnPrimary}`,
                color: textOnPrimary,
            };

            return [hero, intro, timeline, gallery, quote, closing] as Block[];
        }
        case 'profileCommerce': {
            const banner = createBlock('container') as any;
            banner.columns = 1;
            banner.style = {
                padding: `${spacing.sectionPadding.hero} 1.5rem`,
                textAlign: 'center',
                backgroundImageUrl: ctx.getHeroBg('commerce'),
                overlayColor: primaryColor,
                overlayOpacity: 0.4,
                color: textOnPrimary,
                gap: spacing.gap.sm,
                borderRadius: surfaces.radii.lg,
                boxShadow: surfaces.shadows.strong,
            };
            const heading = createBlock('text') as any; heading.content = `<h1 style="margin:0;font-family:${fonts.headingFont};font-size:${fonts.ramps.h2.fontSize};line-height:${fonts.ramps.h2.lineHeight};">${artistData?.name ? `Éditions ${artistData.name}` : 'Éditions limitées'}</h1>`;
            const subheading = createBlock('text') as any; subheading.content = `<p style="margin:0;font-family:${fonts.bodyFont};color:${textOnPrimary === '#0b1120' ? '#0b1120' : 'rgba(248,250,252,0.85)'};">Livraison soignée, certificat signé et paiement sécurisé.</p>`;
            banner.children = [heading, subheading];

            const featured = createBlock('oeuvre') as any;
            featured.layout = 'grid';
            featured.gap = 18;
            featured.columns = 2;
            featured.artworks = (ctx.oeuvreOptions || []).slice(0, 4).map((o: any) => o.id);
            featured.style = { backgroundColor: cardBackground, padding: spacing.sectionPadding.tight, borderRadius: surfaces.radii.md, boxShadow: surfaces.shadows.soft };

            const catalog = createBlock('artworkList') as any;
            catalog.mode = 'query';
            catalog.layout = 'grid';
            catalog.columnsDesktop = 3;
            catalog.columnsMobile = 1;
            catalog.gap = 18;
            catalog.cardPreset = 'minimal';
            catalog.showPrice = true;
            catalog.showAvailability = true;
            catalog.sortBy = 'createdAt';
            catalog.sortOrder = 'desc';
            catalog.limit = 9;
            catalog.cardBackgroundColor = cardBackground;
            catalog.cardTextColor = textColor;

            const serviceBlock = createBlock('columns') as any;
            serviceBlock.count = 3;
            serviceBlock.columns = [
                [
                    (() => {
                        const b = createBlock('text') as any;
                        b.content = '<strong>Livraison</strong><br/>France et international sur devis.';
                        b.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return b;
                    })(),
                ],
                [
                    (() => {
                        const b = createBlock('text') as any;
                        b.content = '<strong>Accompagnement</strong><br/>Conseil collectionneurs & professionnels.';
                        b.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return b;
                    })(),
                ],
                [
                    (() => {
                        const b = createBlock('text') as any;
                        b.content = '<strong>Authenticité</strong><br/>Certificat et facture nominative inclus.';
                        b.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return b;
                    })(),
                ],
            ];
            serviceBlock.style = { gap: spacing.gap.md, padding: `${spacing.gap.sm} 0` };

            const commerceCta = createBlock('button') as any;
            commerceCta.label = 'Planifier un rendez-vous vidéo';
            commerceCta.url = '/contact';
            commerceCta.alignment = 'center';
            commerceCta.style = {
                margin: '2rem auto',
                padding: '0.9rem 2.4rem',
                backgroundColor: accentColor,
                color: textOnAccent,
                borderRadius: surfaces.radii.pill,
                fontFamily: fonts.bodyFont,
                fontWeight: fonts.ramps.button.fontWeight || '600',
            };

            return [banner, featured, catalog, serviceBlock, commerceCta] as Block[];
        }
        case 'profileCollector': {
            const hero = createBlock('container') as any;
            hero.columns = 1;
            hero.style = {
                padding: `${spacing.sectionPadding.hero} 1.5rem`,
                textAlign: 'center',
                backgroundColor: primaryColor,
                color: textOnPrimary,
                gap: spacing.gap.sm,
                borderRadius: surfaces.radii.lg,
                boxShadow: surfaces.shadows.strong,
            };
            const title = createBlock('artistName') as any;
            title.style = {
                margin: 0,
                fontSize: fonts.ramps.h2.fontSize,
                lineHeight: fonts.ramps.h2.lineHeight,
                letterSpacing: fonts.ramps.h2.letterSpacing,
                fontFamily: fonts.headingFont,
                fontWeight: fonts.ramps.h2.fontWeight || '600',
            };
            const subtitle = createBlock('text') as any;
            subtitle.content = '<p style="margin:0;letter-spacing:0.18em;text-transform:uppercase;">Portfolio collectionneur</p>';
            hero.children = [title, subtitle];

            const stats = createBlock('columns') as any;
            stats.count = 3;
            stats.columns = [
                [
                    (() => {
                        const b = createBlock('text') as any;
                        b.content = '<strong>25 pièces</strong><br/>Disponibles';
                        b.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return b;
                    })(),
                ],
                [
                    (() => {
                        const b = createBlock('text') as any;
                        b.content = '<strong>7 séries</strong><br/>En cours';
                        b.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return b;
                    })(),
                ],
                [
                    (() => {
                        const b = createBlock('text') as any;
                        b.content = '<strong>3 expositions</strong><br/>Planifiées';
                        b.style = { textAlign: 'center', margin: '0', color: textMuted, fontFamily: fonts.bodyFont };
                        return b;
                    })(),
                ],
            ];
            stats.style = {
                gap: spacing.gap.md,
                backgroundColor: cardBackground,
                padding: '1.5rem 1rem',
                borderRadius: surfaces.radii.md,
                margin: '1.5rem 0',
                boxShadow: surfaces.shadows.soft,
            };

            const focus = createBlock('oeuvre') as any;
            focus.layout = 'grid';
            focus.columns = 3;
            focus.gap = 18;
            focus.artworks = (ctx.oeuvreOptions || []).slice(0, 3).map((o: any) => o.id);
            focus.style = { backgroundColor: surfaceBackground, padding: '1.5rem', borderRadius: surfaces.radii.md, boxShadow: surfaces.shadows.soft };

            const agenda = createBlock('eventList') as any;
            agenda.layout = 'timeline';
            agenda.events = [
                { id: 'vernissage', title: 'Vernissage Blue Cinis', startDate: '', location: 'Nantes', description: 'Rencontre collectionneurs — accès avant-première.' },
                { id: 'studio', title: 'Studio privé', startDate: '', location: 'Paris', description: 'Présentation des nouvelles toiles grands formats.' },
            ];
            agenda.style = { padding: '1.5rem 0', color: textColor, fontFamily: fonts.bodyFont };

            const contact = createBlock('contactForm') as any;
            contact.style = {
                margin: '2rem auto',
                maxWidth: '580px',
                padding: '2rem',
                borderRadius: surfaces.radii.md,
                backgroundColor: cardBackground,
                color: textColor,
                boxShadow: surfaces.shadows.soft,
            };

            return [hero, stats, focus, agenda, contact] as Block[];
        }
        case 'boutique': {
            // Preset Boutique: hero + artworkList (query: récents) avec prix et disponibilité
            const hero = createBlock('container') as any; hero.columns = 1; hero.style = { padding: '2.6rem 1rem', textAlign: 'center', color: '#ffffff', backgroundImageUrl: ctx.getHeroBg('boutique'), overlayColor: '#000000', overlayOpacity: 0.35 } as any; hero.lockAppearance = true;
            const t1 = createBlock('text') as any; t1.content = 'Boutique'; t1.style = { margin: '0', fontSize: '2.2rem' } as any;
            const t2 = createBlock('text') as any; t2.content = 'Œuvres disponibles'; t2.style = { margin: '0.35rem 0 0' } as any;
            hero.children = [t1, t2];
            const list = createBlock('artworkList') as any;
            list.mode = 'query'; list.layout = 'grid'; list.columnsMobile = 2; list.columnsDesktop = 3; list.gap = 22;
            list.sortBy = 'createdAt'; list.sortOrder = 'desc'; list.limit = 12;
            list.showTitle = true; list.showArtist = true; list.showPrice = true; list.showAvailability = true; list.showYear = false; list.showDimensions = false; list.showDescription = false;
            const cta = createBlock('button') as any; cta.label = 'Voir toutes les œuvres'; cta.url = '/galerie'; cta.alignment = 'center'; cta.style = { width: '220px', margin: '1rem auto' };
            return [hero, list, cta];
        }
        case 'minimal': {
            // Affiche nom, photo et bio avec mise en page centrée
            const b1 = createBlock('artistName') as any;
            b1.style = { textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem', color: primaryColor };
            const b2 = createBlock('artistPhoto') as any;
            b2.style = { textAlign: 'center', margin: '0 auto 1.5rem', width: '180px', height: '180px', overflow: 'hidden', borderRadius: '50%' };
            const b3 = createBlock('artistBio') as any;
            b3.style = { maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', textAlign: 'center', color: textColor };
            return [b1, b2, b3];
        }
        case 'portfolio': {
            // Bloc Œuvre affichant toutes les œuvres
            const oe = createBlock('oeuvre') as any;
            oe.artworks = (ctx.oeuvreOptions || []).map(o => o.id);
            oe.style = { padding: '2rem', backgroundColor: '#f9f9f9' };
            return [oe];
        }
        case 'bioGrid': {
            // Mise en page en grille : nom + photo + bio + portfolio
            const cont = createBlock('container') as any;
            cont.columns = 2;
            cont.style = { padding: '2rem', backgroundColor: '#fafafa', gap: '1.5rem' };
            const b1 = createBlock('artistName') as any;
            b1.style = { fontSize: '2rem', color: primaryColor, textAlign: 'center' };
            const b2 = createBlock('artistPhoto') as any;
            b2.style = { width: '160px', height: '160px', borderRadius: '50%', margin: '0 auto' };
            const b3 = createBlock('artistBio') as any;
            b3.style = { lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' };
            const oe = createBlock('oeuvre') as any;
            oe.artworks = (ctx.oeuvreOptions || []).map(o => o.id);
            oe.style = { padding: '1rem' };
            cont.children = [b1, b2, b3, oe];
            return [cont];
        }
        case 'complete': {
            // Page complète : héro, profil, portfolio et contact
            const hero = createBlock('text') as any;
            hero.content = `<h1 style="margin-bottom:0.5rem;">Bienvenue sur mon profil</h1><p style=\"font-size:1.1rem;color:${accentColor}\">Je suis ${artistData.name}, découvrez mon univers artistique.</p>`;
            hero.style = { padding: '3rem 1rem', textAlign: 'center', backgroundColor: primaryColor, color: '#fff' };
            const name = createBlock('artistName') as any;
            name.style = { fontSize: '2.2rem', textAlign: 'center', margin: '2rem 0 1rem' };
            const photo = createBlock('artistPhoto') as any;
            photo.style = { width: '200px', height: '200px', borderRadius: '50%', margin: '0 auto 1.5rem', border: `4px solid ${accentColor}` };
            if (!artistData?.photoUrl) { photo.src = pickUpload(1) || ''; }
            const bio = createBlock('artistBio') as any;
            bio.style = { maxWidth: '700px', margin: '0 auto 2rem', lineHeight: '1.8' };
            const portfolio = createBlock('oeuvre') as any;
            portfolio.artworks = (ctx.oeuvreOptions || []).map(o => o.id);
            portfolio.layout = 'grid';
            portfolio.style = { padding: '2rem', backgroundColor: '#fff' };
            const contact = createBlock('contactForm') as any;
            contact.style = { padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '400px', margin: '2rem auto' };
            return [hero, name, photo, bio, portfolio, contact];
        }
        case 'showcase': {
            const hero = createBlock('text') as any;
            hero.content = `${artistData.name}`;
            hero.style = { padding: '4rem 1rem', textAlign: 'center', backgroundColor: primaryColor, color: '#fff', backgroundImageUrl: ctx.getHeroBg('default'), overlayColor: '#000000', overlayOpacity: 0.25 };
            const photo = createBlock('artistPhoto') as any;
            photo.style = { width: '220px', height: '220px', borderRadius: '50%', margin: '1rem auto', border: `6px solid ${accentColor}` };
            if (!artistData?.photoUrl) { photo.src = pickUpload(1) || ''; }
            const portfolio = createBlock('oeuvre') as any;
            portfolio.layout = 'grid';
            portfolio.columns = 4;
            portfolio.gap = 20;
            portfolio.artworks = (ctx.oeuvreOptions || []).map(o => o.id);
            portfolio.style = { padding: '2rem', backgroundColor: '#fff' };
            return [hero, photo, portfolio];
        }
        case 'aboutPortfolio': {
            const cont = createBlock('container') as any;
            cont.columns = 2;
            cont.style = { padding: '2rem', gap: '2rem' };
            const name = createBlock('artistName') as any;
            name.style = { fontSize: '2.2rem', color: primaryColor, marginBottom: '0.5rem' };
            const bio = createBlock('artistBio') as any;
            bio.style = { lineHeight: '1.8' };
            const left = createBlock('container') as any;
            left.columns = 1;
            left.children = [name, bio];
            const portfolio = createBlock('oeuvre') as any;
            portfolio.layout = 'grid';
            portfolio.columns = 3;
            portfolio.gap = 16;
            portfolio.artworks = (ctx.oeuvreOptions || []).map(o => o.id);
            const right = createBlock('container') as any;
            right.columns = 1;
            right.children = [portfolio];
            cont.children = [left, right];
            return [cont];
        }
        case 'modern': {
            const title = createBlock('text') as any; title.content = `<h1 style=\"margin:0\">${artistData.name}</h1><p style=\"margin-top:0.5rem\">Artiste contemporain</p>`; title.fontFamily = 'Inter'; title.fontWeight = '600'; title.style = { padding: '4.2rem 1rem', textAlign: 'center', color: '#ffffff', backgroundImageUrl: ctx.getHeroBg('default'), overlayColor: '#000000', overlayOpacity: 0.35 };
            const bio = createBlock('artistBio') as any; bio.fontFamily = 'Inter'; bio.style = { maxWidth: '740px', margin: '1rem auto', lineHeight: '1.85' };
            const grid = createBlock('gallery') as any; grid.layout = 'grid'; grid.columns = 3; grid.images = getLoremImages(9, 2); grid.style = { gap: '16px' };
            return [title, bio, grid];
        }
        case 'minimalPlus': {
            const name = createBlock('artistName') as any; name.style = { fontSize: '2.8rem', textAlign: 'center', margin: '2rem 0 1rem' }; name.fontFamily = 'Playfair Display';
            const photo = createBlock('artistPhoto') as any; photo.style = { width: '180px', height: '180px', borderRadius: '50%', margin: '0 auto 1rem' };
            const list = createBlock('artworkList') as any; list.layout = 'grid'; list.columnsDesktop = 4; list.cardPreset = 'minimal'; list.cardHoverOpacity = 0.9; list.cardTextAlign = 'center';
            return [name, photo, list];
        }
        case 'dark': {
            const hero = createBlock('text') as any; hero.content = artistData.name; hero.fontFamily = 'Poppins'; hero.fontWeight = '600'; hero.style = { padding: '3rem 1rem', textAlign: 'center', color: '#fff', backgroundImageUrl: ctx.getHeroBg('default'), overlayColor: 'rgba(0,0,0,0.35)', overlayOpacity: 0.35 };
            const grid = createBlock('gallery') as any; grid.layout = 'grid'; grid.columns = 3; grid.images = getLoremImages(9, 2); grid.style = { gap: '16px' };
            const contact = createBlock('contactForm') as any; contact.style = { padding: '2rem', backgroundColor: '#0b0f19', color: '#fff', borderRadius: '12px', maxWidth: '600px', margin: '2rem auto' };
            return [hero, grid, contact];
        }
        case 'editorial': {
            const hero = createBlock('container') as any; hero.columns = 1; hero.style = { padding: '2rem 1rem', textAlign: 'center', color: '#111827', backgroundImageUrl: ctx.getHeroBg('editorialPro'), overlayColor: 'rgba(255,255,255,0.2)', overlayOpacity: 0.2 } as any;
            const tTitle = createBlock('text') as any; tTitle.content = 'Portfolio'; tTitle.fontFamily = 'Lora'; tTitle.fontWeight = '600'; tTitle.style = { margin: '0', fontSize: '2rem' };
            const tSub = createBlock('text') as any; tSub.content = 'Sélection éditoriale'; tSub.fontFamily = 'Inter'; tSub.style = { margin: '0.25rem 0 0' } as any;
            hero.children = [tTitle, tSub];
            const grid = createBlock('gallery') as any; grid.layout = 'grid'; grid.columns = 3; grid.images = getLoremImages(9, 2); grid.style = { gap: '16px' };
            const bio = createBlock('artistBio') as any; bio.fontFamily = 'Lora'; bio.style = { maxWidth: '680px', margin: '1rem auto', lineHeight: '1.8' };
            return [hero, grid, bio];
        }
        case 'poster': {
            const sanitize = (value: string) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const bioSnippet = (() => {
                const raw = (artistData?.biography || '').trim();
                if (!raw) return 'Découvrez mon univers artistique et mes dernières créations.';
                const sentence = raw.split(/[\.\!\?]/).find(Boolean)?.trim() || raw;
                const clipped = sentence.length > 220 ? `${sentence.slice(0, 220)}…` : sentence;
                return sanitize(clipped);
            })();
            const hero = createBlock('container') as any;
            hero.columns = 1;
            const heroTexture = ctx.getHeroBg('showcaseDeluxe') || pickUpload(37);
            hero.style = {
                padding: '4.6rem 1.6rem',
                textAlign: 'center',
                color: '#f8fafc',
                backgroundColor: heroTexture ? 'rgba(11,17,32,0.86)' : primaryColor,
                backgroundImageUrl: heroTexture || undefined,
                backgroundSize: heroTexture ? 'cover' : undefined,
                backgroundPosition: heroTexture ? 'center' : undefined,
                borderRadius: '32px',
                boxShadow: '0 32px 80px rgba(15,23,42,0.25)',
                border: heroTexture ? '1px solid rgba(248,250,252,0.18)' : '1px solid rgba(15,23,42,0.08)',
                gap: '1.2rem',
            };
            const heroKicker = createBlock('text') as any; heroKicker.content = '<p style="margin:0;font-size:0.75rem;letter-spacing:0.3em;text-transform:uppercase;opacity:0.75">Nouvelle série immersive</p>';
            const heroTitle = createBlock('text') as any; heroTitle.content = `<h1 style=\"margin:0;font-size:3.1rem;line-height:1.05;font-weight:700;\">${sanitize(artistData?.name || 'Affiche signature')}</h1>`;
            const heroLead = createBlock('text') as any; heroLead.content = `<p style=\"margin:0 auto;max-width:720px;font-size:1.05rem;line-height:1.6;opacity:0.92;\">${bioSnippet}</p>`;
            const heroBadge = createBlock('text') as any; heroBadge.content = '<p style="margin:0.25rem auto 0;font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8">Vernissage — samedi 18h • Galerie Blue Cinis</p>';
            const heroButton = createBlock('button') as any; heroButton.label = 'Voir la série complète'; heroButton.url = '#galerie'; heroButton.alignment = 'center';
            heroButton.style = { margin: '1rem auto 0', padding: '0.95rem 3rem', backgroundColor: '#f8fafc', color: '#0f172a', borderRadius: '999px', fontWeight: 600, boxShadow: '0 18px 35px rgba(15,23,42,0.25)' };
            hero.children = [heroKicker, heroTitle, heroLead, heroBadge, heroButton];

            const highlightWrap = createBlock('container') as any;
            highlightWrap.columns = 1;
            highlightWrap.style = { padding: '2.4rem 1.6rem', backgroundColor: 'rgba(248,250,252,0.92)', borderRadius: '28px', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 24px 56px rgba(15,23,42,0.12)', gap: '1.1rem' };
            const highlightTitle = createBlock('text') as any; highlightTitle.content = '<h3 style="margin:0;font-size:1.4rem;line-height:1.45;font-weight:600;">Sélection du moment</h3>';
            const highlightList = createBlock('oeuvre') as any;
            highlightList.layout = 'grid';
            highlightList.columns = 3;
            highlightList.columnsDesktop = 3;
            highlightList.columnsMobile = 1;
            highlightList.gap = 18;
            highlightList.limit = 3;
            highlightList.cardPadding = '18px';
            highlightList.cardBackgroundColor = '#ffffff';
            highlightList.cardTextColor = '#0f172a';
            highlightList.artworks = (ctx.oeuvreOptions || []).slice(0, 3).map((o: any) => o.id);
            highlightWrap.children = [highlightTitle, highlightList];

            const eventWrap = createBlock('container') as any;
            eventWrap.columns = 2;
            eventWrap.style = { padding: '2rem 1.4rem', backgroundColor: 'rgba(15,23,42,0.06)', borderRadius: '24px', border: '1px dashed rgba(15,23,42,0.1)', gap: '1.4rem' };
            const eventInfo = createBlock('container') as any; eventInfo.columns = 1;
            const eventLabel = createBlock('text') as any; eventLabel.content = '<p style="margin:0;font-size:0.72rem;letter-spacing:0.3em;text-transform:uppercase;color:#475569;">À l’affiche</p>';
            const eventTitle = createBlock('text') as any; eventTitle.content = '<h3 style="margin:0.35rem 0 0;font-size:1.35rem;line-height:1.4;font-weight:600;">Performance & dédicace atelier</h3>';
            const eventDetails = createBlock('text') as any; eventDetails.content = '<p style="margin:0;font-size:0.95rem;line-height:1.6;color:#475569;">Dimanche 15 juin • 14h-18h • Verrière Loire</p>';
            const eventCTA = createBlock('button') as any; eventCTA.label = 'Je confirme ma présence'; eventCTA.url = '/contact'; eventCTA.alignment = 'left';
            eventCTA.style = { margin: '0.8rem 0 0', padding: '0.7rem 1.9rem', borderRadius: '999px', backgroundColor: primaryColor, color: '#ffffff', fontWeight: 600 };
            eventInfo.children = [eventLabel, eventTitle, eventDetails, eventCTA];
            const agendaHeading = createBlock('text') as any; agendaHeading.content = '<p style="margin:0 0 0.35rem;font-size:0.75rem;letter-spacing:0.24em;text-transform:uppercase;color:#64748b;">Agenda</p>';
            const agendaList = createBlock('eventList') as any; agendaList.layout = 'timeline'; agendaList.limit = 3; agendaList.condensed = true; agendaList.showPastEvents = false; agendaList.showDescription = false;
            const agendaCol = createBlock('container') as any; agendaCol.columns = 1; agendaCol.children = [agendaHeading, agendaList];
            eventWrap.children = [eventInfo, agendaCol];

            return [hero, highlightWrap, eventWrap];
        }
        case 'banner': {
            const band = createBlock('container') as any;
            band.columns = 1;
            const sanitizeInline = (value: string) =>
                String(value ?? '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            const bannerAccent = accentColor || primaryColor || '#0f172a';
            band.style = {
                padding: '1.4rem 1.6rem',
                backgroundColor: bannerAccent,
                borderRadius: '999px',
                textAlign: 'center',
                color: '#f8fafc',
                border: '1px solid rgba(248,250,252,0.35)',
                boxShadow: '0 18px 36px rgba(15,23,42,0.18)',
                gap: '0.35rem',
            } as any;
            const label = createBlock('text') as any; label.content = '<p style="margin:0;font-size:0.7rem;letter-spacing:0.32em;text-transform:uppercase;opacity:0.82;">Annonce flash</p>';
            const headline = createBlock('text') as any;
            headline.content = `<p style=\"margin:0;font-size:1.3rem;line-height:1.45;font-weight:600;\">${sanitizeInline(
                artistData?.name || 'Artiste invité'
            )} — pièce disponible cette semaine</p>`;
            const secondary = createBlock('text') as any; secondary.content = '<p style="margin:0;font-size:0.85rem;opacity:0.9;">Édition limitée à 12 exemplaires • Expédition en 48h</p>';
            const action = createBlock('button') as any; action.label = 'Découvrir la pièce'; action.url = '/galerie'; action.alignment = 'center'; action.style = { margin: '0.3rem auto 0', padding: '0.55rem 1.8rem', borderRadius: '999px', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 600 };
            band.children = [label, headline, secondary, action];
            return [band];
        }
        case 'heroVideo': {
            // Héro vidéo + overlay + CTA
            const vid = createBlock('video') as any;
            vid.src = '';
            vid.autoplay = true; vid.muted = true; vid.loop = true; vid.controls = false;
            vid.style = { width: '100%', height: '420px', backgroundColor: '#000000' };
            const overlayText = createBlock('text') as any;
            overlayText.content = `<h1 style=\"margin:0;font-size:2.6rem\">${artistData.name}</h1><p style=\"margin-top:0.35rem\">Exploration en vidéo</p>`;
            overlayText.fontFamily = 'Poppins'; overlayText.fontWeight = '600';
            overlayText.style = { padding: '2rem 1rem', textAlign: 'center', gradientType: 'linear', gradientFrom: 'rgba(0,0,0,0.75)', gradientTo: 'rgba(0,0,0,0.75)', color: '#ffffff' };
            const cta = createBlock('button') as any; cta.label = 'Me contacter'; cta.url = '#contact'; cta.alignment = 'center'; cta.style = { width: '200px', margin: '0 auto' };
            const grid = createBlock('artworkList') as any; grid.columnsMobile = 2; grid.columnsDesktop = 3; grid.gap = 20; grid.cardPreset = 'minimal'; grid.cardHoverScale = 1.04;
            return [vid, overlayText, cta, grid];
        }
        case 'editorialMixed': {
            // Grille éditoriale mixte: 2 colonnes, bio + grid glass
            const cont = createBlock('container') as any; cont.columns = 2; cont.style = { padding: '2rem', gap: '2rem' };
            const left = createBlock('container') as any; left.columns = 1;
            const name = createBlock('artistName') as any; name.fontFamily = 'Playfair Display'; name.style = { fontSize: '2.6rem', color: primaryColor, marginBottom: '0.5rem' };
            const bio = createBlock('artistBio') as any; bio.fontFamily = 'Inter'; bio.style = { lineHeight: '1.8' };
            left.children = [name, bio];
            const right = createBlock('artworkList') as any; right.columnsMobile = 2; right.columnsDesktop = 3; right.gap = 18; right.cardPreset = 'minimal'; right.cardHoverOpacity = 0.98;
            cont.children = [left, right];
            return [cont];
        }
        case 'minimalLuxe': {
            // Monochrome + accents dorés
            const gold = '#d4af37';
            const hero = createBlock('text') as any; hero.content = `<h1 style=\"margin:0\">${artistData.name}</h1><p style=\"margin-top:0.35rem\">Sélection raffinée</p>`; hero.fontFamily = 'Playfair Display'; hero.fontWeight = '600';
            hero.style = { padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#111827', color: '#ffffff', backgroundImageUrl: ctx.getHeroBg('default'), overlayColor: '#000000', overlayOpacity: 0.1 };
            const grid = createBlock('artworkList') as any; grid.columnsMobile = 2; grid.columnsDesktop = 4; grid.cardPreset = 'bordered'; grid.gap = 18; grid.cardTextColor = '#e5e7eb'; grid.cardBackgroundColor = '#0f172a'; grid.titleColor = gold; grid.showPrice = true; grid.limit = 8;
            const quote = createBlock('quote') as any; quote.content = '“L’élégance est la seule beauté qui ne se fane jamais.”'; quote.author = 'Audrey Hepburn'; quote.style = { maxWidth: '720px', margin: '1.6rem auto', textAlign: 'center', color: gold };
            return [hero, grid, quote];
        }
        case 'showcaseDeluxe': {
            const hero = createBlock('container') as any; hero.columns = 1; hero.style = { padding: '5rem 1rem', textAlign: 'center', color: '#ffffff', backgroundImageUrl: ctx.getHeroBg('showcaseDeluxe'), overlayColor: '#000000', overlayOpacity: 0.35 } as any; hero.lockAppearance = true;
            const title = createBlock('artistName') as any; title.fontFamily = 'Poppins'; title.fontWeight = '600'; title.tag = 'h1'; title.style = { fontSize: '3rem', margin: '0' }; hero.children = [title];
            const c1 = createBlock('button') as any; c1.label = 'Contact'; c1.url = '#contact'; c1.alignment = 'center'; c1.style = { width: '180px', margin: '0 auto' };
            const c2 = createBlock('button') as any; c2.label = 'Galerie'; c2.url = '/galerie?page=1'; c2.alignment = 'center'; c2.style = { width: '180px', margin: '0 auto' };
            const c3 = createBlock('button') as any; c3.label = 'À propos'; c3.url = '/a-propos'; c3.alignment = 'center'; c3.style = { width: '180px', margin: '0 auto' };
            const ctaBar = createBlock('container') as any; ctaBar.columns = 3; ctaBar.style = { padding: '0.5rem 0', gap: '0.75rem' } as any; ctaBar.children = [c1, c2, c3];
            const section = createBlock('container') as any; section.columns = 1; section.style = { gap: '1rem' } as any;
            if (ctx.oeuvreOptions && ctx.oeuvreOptions.length > 0) {
                const carousel = createBlock('oeuvre') as any; carousel.artworks = (ctx.oeuvreOptions || []).slice(0, 2).map((o: any) => o.id); carousel.layout = 'carousel'; carousel.gap = 20; section.children = [carousel];
                const list = createBlock('artworkList') as any; list.mode = 'query'; list.layout = 'grid'; list.columnsDesktop = 4; list.gap = 20; list.sortBy = 'createdAt'; list.sortOrder = 'desc'; list.limit = 8; section.children.push(list);
            } else {
                const grid = createBlock('gallery') as any; grid.layout = 'grid'; grid.columns = 4; grid.images = getLoremImages(8, 2); grid.style = { gap: '16px' }; section.children = [grid];
            }
            return [hero, ctaBar, section];
        }
        case 'portfolioMasonry': {
            const hero = createBlock('container') as any; hero.columns = 1; hero.style = { padding: '3.5rem 1rem', textAlign: 'center', color: '#ffffff', backgroundImageUrl: ctx.getHeroBg('portfolioMasonry'), overlayColor: '#000000', overlayOpacity: 0.35 } as any;
            const tTitle = createBlock('text') as any; tTitle.content = 'Portfolio'; tTitle.fontFamily = 'Playfair Display'; tTitle.fontWeight = '600'; tTitle.style = { fontSize: '2.4rem', margin: '0 0 0.35rem' };
            const tSub = createBlock('text') as any; tSub.content = 'Sélection en lumière'; tSub.fontFamily = 'Inter'; tSub.style = { margin: '0' } as any; hero.children = [tTitle, tSub];
            const section = createBlock('container') as any; section.columns = 1; section.style = { gap: '1rem' } as any;
            if (ctx.oeuvreOptions && ctx.oeuvreOptions.length > 0) {
                const feat = createBlock('oeuvre') as any; feat.artworks = [ctx.oeuvreOptions[0].id]; feat.layout = 'grid'; feat.columns = 1; feat.gap = 10; section.children = [feat];
            }
            const gal = createBlock('gallery') as any; gal.layout = 'masonry'; gal.columns = 4; gal.images = getLoremImages(12, 2); gal.style = { gap: '10px' };
            section.children = (section.children || []).concat([gal]);
            return [hero, section];
        }
        case 'monochromeEditorial': {
            // Noir & blanc éditorial + typographies
            const banner = createBlock('text') as any; banner.content = `<h2 style=\"margin:0\">${artistData.name}</h2><p style=\"margin-top:0.35rem\">Portfolio éditorial</p>`; banner.fontFamily = 'Lora';
            banner.style = { padding: '2rem 1rem', textAlign: 'center', gradientType: 'linear', gradientFrom: '#111827', gradientTo: '#111827', color: '#ffffff' };
            const grid = createBlock('artworkList') as any; grid.columnsMobile = 2; grid.columnsDesktop = 3; grid.cardPreset = 'bordered'; grid.cardTextColor = '#111827'; grid.cardBackgroundColor = '#ffffff'; grid.gap = 18; grid.cardHoverOpacity = 0.96;
            const quote = createBlock('quote') as any; quote.content = '“Less is more.”'; quote.author = 'Mies van der Rohe'; quote.style = { maxWidth: '680px', margin: '1.5rem auto', textAlign: 'center' };
            return [banner, grid, quote];
        }
        case 'signature': {
            // Hero container (H1 + subtitle)
            const hero = createBlock('container') as any; hero.columns = 1; hero.style = { padding: '5rem 1rem', textAlign: 'center', color: '#ffffff', backgroundImageUrl: ctx.getHeroBg('signature'), overlayColor: '#000000', overlayOpacity: 0.35 } as any;
            const heroTitle = createBlock('artistName') as any; heroTitle.fontFamily = 'Playfair Display'; heroTitle.fontWeight = '600'; heroTitle.tag = 'h1'; heroTitle.style = { fontSize: '3rem', margin: '0 0 0.5rem' };
            const heroSub = createBlock('text') as any; heroSub.content = 'Portfolio & œuvres originales'; heroSub.style = { margin: '0' } as any;
            hero.children = [heroTitle, heroSub];
            // Split: left (portrait + bio), right (highlight + list/gallery)
            const left = createBlock('container') as any; left.columns = 1;
            const photo = createBlock('artistPhoto') as any; photo.style = { width: '200px', height: '200px', borderRadius: '50%', margin: '0 auto 1rem' }; if (!artistData?.photoUrl) photo.src = pickUpload(1) || '';
            const bio = createBlock('artistBio') as any; bio.fontFamily = 'Inter'; bio.style = { maxWidth: '680px', margin: '0 auto', lineHeight: '1.8', textAlign: 'center', color: '#374151' };
            left.children = [photo, bio];
            const right = createBlock('container') as any; right.columns = 1; right.style = { gap: '1rem' } as any;
            if (ctx.oeuvreOptions && ctx.oeuvreOptions.length > 0) {
                const highlight = createBlock('oeuvre') as any; highlight.artworks = (ctx.oeuvreOptions || []).slice(0, 2).map((o: any) => o.id); highlight.layout = 'grid'; highlight.columns = 2; highlight.gap = 16;
                right.children = [highlight];
                const list = createBlock('artworkList') as any; list.mode = 'query'; list.layout = 'grid'; list.columnsDesktop = 3; list.gap = 18; list.sortBy = 'createdAt'; list.sortOrder = 'desc'; list.limit = 9; right.children.push(list);
            } else {
                const gal = createBlock('gallery') as any; gal.layout = 'grid'; gal.columns = 3; gal.images = getLoremImages(9, 2); gal.style = { gap: '14px' };
                right.children = [gal];
            }
            const contact = createBlock('contactForm') as any; contact.style = { padding: '2rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' };
            return [hero, left, right, contact];
        }
        case 'commerce': {
            const hero = createBlock('container') as any; hero.columns = 1; hero.style = { padding: '2rem 1rem', textAlign: 'center', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
            const h1 = createBlock('artistName') as any; h1.tag = 'h1'; h1.style = { margin: '0' };
            hero.children = [h1];
            const list = createBlock('artworkList') as any; list.layout = 'grid'; list.columnsDesktop = 4; list.gap = 20; list.showPrice = true; list.showAvailability = true; list.cardPreset = 'minimal'; list.cardBackgroundColor = '#ffffff';
            return [hero, list];
        }
        case 'editorialPro': {
            const c = createBlock('container') as any; c.columns = 2; c.style = { padding: '4rem 2rem', gap: '3rem', backgroundColor: '#fff' };
            const l = createBlock('container') as any; l.columns = 1;
            const t = createBlock('text') as any; t.content = `<h1>${artistData.name}</h1>`;
            l.children = [t];
            const r = createBlock('gallery') as any; r.layout = 'masonry'; r.columns = 2; r.style = { gap: '12px' };
            c.children = [l, r];
            return [c];
        }
        case 'minimalClean': {
            const c = createBlock('container') as any; c.columns = 1; c.style = { padding: '4rem', textAlign: 'center' };
            const n = createBlock('artistName') as any; n.style = { fontSize: '3rem', fontWeight: '300' };
            c.children = [n];
            return [c];
        }
        default:
            return [];
    }
}
