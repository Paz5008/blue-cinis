require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    // Retrouver l'artiste test
    const artist = await prisma.artist.findFirst({ where: { slug: 'artiste-test' } });
    if (!artist) throw new Error('Artiste test introuvable (slug=artiste-test)');
    if (!artist.userId) throw new Error('Cet artiste ne possède pas de userId');

    const payload = {
      blocks: [
        {
          id: 'cover',
          type: 'artistPhoto',
          alignment: 'center',
          style: { width: '100%', height: '360px', objectFit: 'cover', imageScale: 100 },
        },
        {
          id: 'title',
          type: 'artistName',
          tag: 'h1',
          alignment: 'center',
          fontSize: '42px',
          color: '#111827',
          lineHeight: '1.2',
          fontWeight: 700,
        },
        {
          id: 'bio',
          type: 'artistBio',
          alignment: 'center',
          fontSize: '18px',
          color: '#374151',
          lineHeight: '1.7',
          content: "Bienvenue sur mon profil d'artiste de test. Ceci est un contenu publié via le CMS afin de valider l'intégration.",
          style: { width: '820px' },
        },
        {
          id: 'contact',
          type: 'text',
          content: '<p style="text-align:center">Pour toute demande, contactez-moi via le formulaire ci-dessous.</p>',
          style: { width: '720px', marginTop: '12px' },
        },
        { id: 'form', type: 'contactForm', style: { width: '720px' } },
      ],
      theme: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#4f46e5',
        backgroundColor: '#ffffff',
        textColor: '#111827',
      },
      meta: {
        title: 'Artiste Test — Profil',
        description: 'Page de profil publiée via CMS pour l\'artiste de test.'
      },
      settings: { autoSaveEnabled: true, autoSaveDelayMs: 8000 },
    };

    const upsert = await prisma.artistPage.upsert({
      where: { userId_key: { userId: artist.userId, key: 'profile' } },
      create: {
        userId: artist.userId,
        key: 'profile',
        draftContent: payload,
        publishedContent: payload,
        status: 'published',
        publishedAt: new Date(),
      },
      update: {
        draftContent: payload,
        publishedContent: payload,
        status: 'published',
        publishedAt: new Date(),
      },
    });

    console.log('Profil publié pour', artist.name, 'artistId=', artist.id, 'userId=', artist.userId);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
