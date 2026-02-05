import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: ProfileCustomization -> ArtistPage(profile)');
  const all = await prisma.profileCustomization.findMany({
    select: {
      userId: true,
      draftContent: true,
      publishedContent: true,
      status: true,
      content: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  let migrated = 0;
  for (const row of all) {
    const userId = row.userId;
    if (!userId) continue;

    const existing = await prisma.artistPage.findUnique({
      where: { userId_key: { userId, key: 'profile' } },
      select: { userId: true },
    });
    if (existing) {
      console.log(`Skip user ${userId}: ArtistPage(profile) already exists`);
      continue;
    }

    const draft = row.draftContent ?? row.content ?? null;
    const published = row.publishedContent ?? null;
    const isPublished = !!published || row.status === 'published';
    await prisma.artistPage.create({
      data: {
        userId,
        key: 'profile',
        draftContent: draft || published || {},
        publishedContent: isPublished ? (published || draft || {}) : null,
        status: isPublished ? 'published' : 'draft',
        publishedAt: isPublished ? new Date() : null,
      },
    });
    migrated++;
  }
  console.log(`Migration done. Migrated ${migrated} entries.`);
}

main()
  .catch((e) => {
    console.error('Migration error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
