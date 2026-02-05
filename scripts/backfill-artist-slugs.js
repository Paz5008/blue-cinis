require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

function slugify(input) {
  return (input || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueArtistSlug(prisma, base) {
  const b = base || 'artiste';
  let candidate = b;
  let i = 1;
  for (;;) {
    const exists = await prisma.artist.findUnique({ where: { slug: candidate } }).catch(() => null);
    if (!exists) return candidate;
    candidate = `${b}-${++i}`;
  }
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const list = await prisma.artist.findMany({ where: { OR: [{ slug: null }, { slug: '' }] }, select: { id: true, name: true } });
    if (!list.length) { console.log('No missing slugs to backfill.'); await prisma.$disconnect(); return; }
    console.log(`Backfilling slugs for ${list.length} artists...`);
    for (const a of list) {
      const base = slugify(a.name || 'artiste');
      const slug = await ensureUniqueArtistSlug(prisma, base);
      await prisma.artist.update({ where: { id: a.id }, data: { slug } });
      console.log(`- ${a.id}: ${slug}`);
    }
    console.log('Done.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
