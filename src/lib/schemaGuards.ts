import { prisma } from '@/lib/prisma';

let artistFeaturedCheck: Promise<void> | null = null;
let artistFeaturedValidated = false;

async function verifyArtistFeaturedSchema() {
  const columnExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT TRUE AS exists
    FROM information_schema.columns
    WHERE table_name = 'Artist'
      AND table_schema = current_schema()
      AND column_name = 'isFeatured'
    LIMIT 1
  `;

  if (!columnExists.length) {
    throw new Error('Database missing Artist.isFeatured column; run 20250818100000_add_is_featured_to_artist');
  }

  const indexExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT TRUE AS exists
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'Artist'
      AND indexname = 'Artist_isFeatured_idx'
    LIMIT 1
  `;

  if (!indexExists.length) {
    throw new Error('Database missing Artist_isFeatured_idx index; ensure 20250818100000_add_is_featured_to_artist ran successfully');
  }
}

export async function ensureArtistFeaturedColumnReady() {
  if (artistFeaturedValidated) return;
  if (!artistFeaturedCheck) {
    artistFeaturedCheck = verifyArtistFeaturedSchema()
      .then(() => {
        artistFeaturedValidated = true;
      })
      .catch((err) => {
        artistFeaturedCheck = null;
        throw err;
      });
  }
  await artistFeaturedCheck;
}
