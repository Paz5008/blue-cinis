import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import PaginationGeneric from "@/components/ui/PaginationGeneric";
import EvenementsPageClient from "@/components/evenements/EvenementsPageClient";
import SearchInput from "@/components/evenements/SearchInput";

export const revalidate = 300;

type EventsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const PAGE_SIZE = 12;

function pickParam(value?: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function EvenementsPage({ searchParams }: EventsPageProps) {
  const page = Math.max(1, parseInt(pickParam(searchParams?.page) || "1", 10) || 1);
  const search = pickParam(searchParams?.search)?.trim() || undefined;

  const localeStore = await cookies();
  const locale = localeStore.get("locale")?.value === "en" ? "en" : "fr";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: Prisma.EventWhereInput = {
    date: { gte: today },
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  let total = 0;
  let events: {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    location: string | null;
    imageUrl: string | null;
  }[] = [];

  try {
    total = await prisma.event.count({ where });
    events = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  } catch (error) {
    console.error("[EvenementsPage] Failed to fetch events:", error);
    // Return with empty events on error
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-[#030303]">
      {/* Client component with animated header and grid */}
      <EvenementsPageClient events={events} totalCount={total} locale={locale} />

      {/* Search + Pagination (Server rendered for SEO) */}
      <div className="container mx-auto px-6 pb-20 relative z-20">
        <div className="flex flex-col gap-6 pt-8 border-t border-white/10">
          {/* Search row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <SearchInput className="w-full md:max-w-sm" />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <PaginationGeneric
                currentPage={page}
                totalPages={totalPages}
                makeHref={(p) =>
                  `/evenements?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`
                }
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata() {
  return {
    title: "Évènements | Blue Cinis",
    description:
      "Découvrez les expositions, vernissages et rencontres artistiques à venir.",
    openGraph: {
      title: "Évènements | Blue Cinis",
      description:
        "Découvrez les expositions, vernissages et rencontres artistiques à venir.",
      type: "website",
    },
  };
}
