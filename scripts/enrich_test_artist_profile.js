require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const artist = await prisma.artist.findFirst({ where: { slug: 'artiste-test' } });
    if (!artist) throw new Error('Artiste test introuvable (slug=artiste-test)');
    // Créer quelques œuvres si l'artiste n'en a pas encore
    let artworks = await prisma.artwork.findMany({ where: { artistId: artist.id } });
    if (artworks.length < 3) {
      const toCreate = [
        { title: 'Reflets de Loire', imageUrl: '/paysage1.webp', price: 950 },
        { title: 'Brume Matinale', imageUrl: '/paysage2.webp', price: 1200 },
        { title: 'Lumières du Soir', imageUrl: '/paysage3.webp', price: 1350 },
      ];
      for (const data of toCreate) {
        const a = await prisma.artwork.create({ data: { ...data, artistId: artist.id, artistName: artist.name } });
        artworks.push(a);
      }
    }
    // Récupérer/mettre à jour la page CMS publiée
    const page = await prisma.artistPage.findUnique({ where: { userId_key: { userId: artist.userId, key: 'profile' } } });
    const artworkIds = artworks.slice(0, 6).map(a => a.id);
    const oeuvreBlock = {
      id: 'oeuvres',
      type: 'oeuvre',
      columns: 3,
      showTitle: true,
      layout: 'grid',
      artworks: artworkIds,
      style: { width: '100%' },
      titleFontSize: '16px',
      titleColor: '#111827'
    };
    let blocks = [];
    if (page && page.publishedContent && typeof page.publishedContent === 'object') {
      const content = page.publishedContent;
      blocks = Array.isArray(content.blocks) ? content.blocks.filter(b => b?.id !== 'oeuvres') : [];
      blocks.push({ id: 'separator-1', type: 'divider', color: '#E5E7EB', thickness: 1, style: { width: '80%' } });
      blocks.push({ id: 'heading-oeuvres', type: 'text', content: '<h2 style="text-align:center;font-size:28px">Sélection d\'œuvres</h2>', style: { width: '720px' } });
      blocks.push(oeuvreBlock);
      // Conserver éventuellement les autres blocs déjà présents
    } else {
      blocks = [
        { id: 'cover', type: 'artistPhoto', alignment: 'center', style: { width: '100%', height: '360px', objectFit: 'cover', imageScale: 100 }},
        { id: 'title', type: 'artistName', tag: 'h1', alignment: 'center', fontSize: '42px', color: '#111827', lineHeight: '1.2', fontWeight: 700 },
        { id: 'bio', type: 'artistBio', alignment: 'center', fontSize: '18px', color: '#374151', lineHeight: '1.7', content: "Bienvenue sur mon profil d'artiste de test. Ceci est un contenu publié via le CMS afin de valider l'intégration.", style: { width: '820px' } },
        { id: 'separator-1', type: 'divider', color: '#E5E7EB', thickness: 1, style: { width: '80%' } },
        { id: 'heading-oeuvres', type: 'text', content: '<h2 style="text-align:center;font-size:28px">Sélection d\'œuvres</h2>', style: { width: '720px' } },
        oeuvreBlock,
        { id: 'contact', type: 'text', content: '<p style="text-align:center">Pour toute demande, contactez-moi via le formulaire ci-dessous.</p>', style: { width: '720px', marginTop: '12px' } },
        { id: 'form', type: 'contactForm', style: { width: '720px' } },
      ];
    }
    const payload = {
      blocks,
      theme: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#4f46e5',
        backgroundColor: '#ffffff',
        textColor: '#111827',
      },
      meta: {
        title: `${artist.name} — Profil`,
        description: `Découvrez une sélection d'œuvres de ${artist.name}.`,
      },
      settings: { autoSaveEnabled: true, autoSaveDelayMs: 8000 },
    };
    await prisma.artistPage.upsert({
      where: { userId_key: { userId: artist.userId, key: 'profile' } },
      create: { userId: artist.userId, key: 'profile', draftContent: payload, publishedContent: payload, status: 'published', publishedAt: new Date() },
      update: { draftContent: payload, publishedContent: payload, status: 'published', publishedAt: new Date() },
    });
    console.log(`Ajouté ${artworkIds.length} œuvres au profil publié de ${artist.name}.`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
