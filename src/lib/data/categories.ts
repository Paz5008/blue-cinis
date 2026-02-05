import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
};

export const FALLBACK_CATEGORIES: CategorySummary[] = [
  { id: 'art-digital', slug: 'art-digital', name: 'Art Digital' },
  { id: 'peintures', slug: 'peintures', name: 'Peintures' },
  { id: 'photographie', slug: 'photographie', name: 'Photographie' },
  { id: 'sculptures', slug: 'sculptures', name: 'Sculptures' },
];

function normalize(name: string | null, id: string): string {
  if (!name) return id;
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || id;
}

async function loadCategories(): Promise<CategorySummary[]> {
  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    if (!categories.length) {
      return FALLBACK_CATEGORIES;
    }

    return categories.map((category) => {
      let slug = normalize(category.name, category.id);

      // Force mapping to known static routes (singular -> plural)
      if (slug === 'peinture') slug = 'peintures';
      if (slug === 'sculpture') slug = 'sculptures';
      if (slug === 'photo') slug = 'photographie';

      return {
        id: category.id,
        name: category.name ?? "",
        slug,
      };
    });
  } catch (error) {
    console.warn("Failed to load categories, using fallback list.", error);
    return FALLBACK_CATEGORIES;
  }
}

export const getCategories = unstable_cache(
  async () => loadCategories(),
  ['categories'],
  { revalidate: 300, tags: ['categories'] }
);
