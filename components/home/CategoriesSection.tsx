import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import CategoriesSectionClient from "./CategoriesSectionClient";

export interface CategoryWithCount {
    id: string;
    slug: string;
    name: string;
    description: string;
    image: string;
    count: number;
}

// Category descriptions and images mapping
const CATEGORY_META: Record<string, { description: string; image: string; subtitle: string }> = {
    peintures: {
        subtitle: "OIL & ACRYLIC",
        description: "La matière brute, capturée sur la toile. Chaque coup de pinceau raconte une histoire.",
        image: "/uploads/artwork-landscape-01.png"
    },
    sculptures: {
        subtitle: "BRONZE & MARBLE",
        description: "L'art de donner forme au vide. La matière sublimée par les mains de l'artiste.",
        image: "/uploads/artwork-portrait-01.png"
    },
    photographie: {
        subtitle: "ANALOG & DIGITAL",
        description: "L'instant suspendu dans la lumière. Un fragment d'éternité capturé.",
        image: "/uploads/artwork-portrait-02.png"
    },
    "art-digital": {
        subtitle: "NFT & GENERATIVE",
        description: "Les nouvelles frontières du pixel. L'art né du code.",
        image: "/uploads/6a596e69-767e-452e-a938-9c9c89f6b8d4.jpg"
    }
};

const DEFAULT_META = {
    subtitle: "ART COLLECTION",
    description: "Découvrez notre collection d'œuvres uniques.",
    image: "/uploads/artwork-landscape-01.png"
};

function normalize(name: string | null, id: string): string {
    if (!name) return id;
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || id;
}

async function loadCategoriesWithCounts(): Promise<CategoryWithCount[]> {
    try {
        // Get categories with artwork counts using raw aggregation
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        artworks: {
                            where: { status: "available" }
                        }
                    }
                }
            },
            orderBy: { name: "asc" }
        });

        if (!categories.length) {
            // Return fallback data
            return Object.entries(CATEGORY_META).map(([slug, meta], index) => ({
                id: slug,
                slug,
                name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
                subtitle: meta.subtitle,
                description: meta.description,
                image: meta.image,
                count: 25 + index * 15
            }));
        }

        return categories.map((cat) => {
            let slug = normalize(cat.name, cat.id);

            // Force mapping to known static routes
            if (slug === 'peinture') slug = 'peintures';
            if (slug === 'sculpture') slug = 'sculptures';
            if (slug === 'photo') slug = 'photographie';

            const meta = CATEGORY_META[slug] || DEFAULT_META;

            return {
                id: cat.id,
                slug,
                name: cat.name ?? "Collection",
                subtitle: meta.subtitle,
                description: meta.description,
                image: meta.image,
                count: cat._count?.artworks ?? 0
            };
        }).filter(cat => cat.count > 0).slice(0, 6); // Only show categories with artworks, max 6
    } catch (error) {
        console.error("[CategoriesSection] Failed to load categories:", error);
        // Return fallback
        return Object.entries(CATEGORY_META).map(([slug, meta], index) => ({
            id: slug,
            slug,
            name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
            subtitle: meta.subtitle,
            description: meta.description,
            image: meta.image,
            count: 25 + index * 15
        }));
    }
}

const getCategoriesWithCounts = unstable_cache(
    loadCategoriesWithCounts,
    ["categories-with-counts"],
    { revalidate: 300, tags: ["categories", "artworks"] }
);

/**
 * Server Component wrapper for CategoriesSection
 * Fetches categories with artwork counts from DB
 */
export default async function CategoriesSection() {
    const categories = await getCategoriesWithCounts();

    return <CategoriesSectionClient categories={categories} />;
}
