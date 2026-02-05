require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = 'artiste.test@example.com';
    const passwordPlain = 'Test1234!';
    let user = await prisma.user.findUnique({ where: { email } });
    const hashed = await bcrypt.hash(passwordPlain, 10);
    if (!user) {
      user = await prisma.user.create({ data: { email, password: hashed, name: 'Artiste Test', role: 'artist', isActive: true } });
    } else {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: 'artist', isActive: true, password: hashed, name: user.name || 'Artiste Test' } });
    }
    let slug = 'artiste-test';
    const baseSlug = slug; let i = 1;
    while (true) {
      const exists = await prisma.artist.findUnique({ where: { slug } }).catch(() => null);
      if (!exists) break;
      slug = `${baseSlug}-${i++}`;
    }
    let artist = await prisma.artist.findFirst({ where: { userId: user.id } });
    if (!artist) {
      artist = await prisma.artist.create({ data: { userId: user.id, name: user.name || 'Artiste Test', slug, biography: 'Artiste de test', artStyle: 'Peinture', portfolio: 'https://example.com', photoUrl: '/artist.webp', enableCommerce: true, enableLeads: true } });
    }
    console.log(JSON.stringify({ email, password: passwordPlain, userId: user.id, artistId: artist.id, artistSlug: artist.slug }, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
