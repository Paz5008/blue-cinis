import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isDev = process.env.NODE_ENV !== "production";
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL;

// Allow a lightweight mock client for build environments without DB
// Set PRISMA_MOCK=1 to avoid network access and return empty results.
// This is only intended for non-production builds.
const makeMock = () => {
  const handler: any = {
    get(_t: any, _p: any) {
      return async () => ([] as any);
    }
  };
  return new Proxy({}, handler) as unknown as PrismaClient;
}

export const prisma =
  globalForPrisma.prisma ||
  ((process.env.PRISMA_MOCK === "1" && process.env.NODE_ENV !== "production")
    ? makeMock()
    : new PrismaClient({
    ...(isDev ? { log: ['query', 'warn', 'error'] as any } : {}),
    datasources: { db: { url: accelerateUrl } },
  })) as PrismaClient;

if (isDev) globalForPrisma.prisma = prisma;

// Auto-slug pour les artistes sur création/mise à jour (si absent)
function slugify(input: string) {
  return (input || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueArtistSlug(base: string) {
  const b = base || 'artiste';
  let candidate = b;
  let i = 1;
  // Boucle de collision simple, sécurisée par contrainte unique
  // On utilise findUnique pour vérifier l'existence
  // NB: si base == '', on rebase sur 'artiste'
  while (true) {
    const exists = await prisma.artist.findUnique({ where: { slug: candidate } }).catch(() => null);
    if (!exists) return candidate;
    candidate = `${b}-${++i}`;
  }
}

// Enregistrer un middleware uniquement si on a un vrai client (pas le mock)
if (!(process.env.PRISMA_MOCK === '1' && process.env.NODE_ENV !== 'production')) {
  prisma.$use(async (params, next) => {
    if (params.model === 'Artist') {
      if (params.action === 'create' && params.args?.data) {
        const data: any = params.args.data;
        if (!data.slug) {
          const base = slugify(data.name || 'artiste');
          data.slug = await ensureUniqueArtistSlug(base);
        }
      } else if (params.action === 'update' && params.args?.data) {
        const data: any = params.args.data;
        if (data.slug == null && typeof data.name === 'string' && data.name.trim().length > 0) {
          const base = slugify(data.name);
          data.slug = await ensureUniqueArtistSlug(base);
        }
      }
    }
    return next(params);
  });
}
