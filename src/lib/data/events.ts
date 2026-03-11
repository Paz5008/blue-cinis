import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { clearRuntimeAlert, markRuntimeAlert } from "@/lib/runtimeAlerts";

export type UpcomingEvent = {
  id: string;
  title: string | null;
  description: string | null;
  date: Date | string | null;
  location: string | null;
  imageUrl: string | null;
};

type QueryParams = {
  limit?: number;
};

const MARCHE_EVENT_IMAGE = "/hero-background3.avif";

export const FALLBACK_UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: "fallback-event-1",
    title: "Rencontre à la Galerie Blue Cinis",
    description: "Une soirée intimiste pour découvrir les nouvelles séries des artistes résidents.",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Nevers",
    imageUrl: "/event.webp",
  },
  {
    id: "fallback-event-2",
    title: "Atelier d’impression artisanale",
    description: "Initiation aux techniques de gravure et d’impression en petit groupe.",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Angers",
    imageUrl: "/exhibition.webp",
  },
  {
    id: "fallback-event-3",
    title: "Vernissage « Lumières d'Atelier »",
    description: "Un accrochage mêlant peintures et sculptures inspirées du fleuve.",
    date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Tours",
    imageUrl: "/gallery.webp",
  },
];

async function loadUpcomingEvents({ limit = 3 }: QueryParams): Promise<UpcomingEvent[]> {
  const take = Math.min(Math.max(Number(limit) || 3, 1), 24);

  try {
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      orderBy: { date: "asc" },
      take,
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
      },
    });

    const normalized = events.map((event) => {
      const title = event.title?.toLowerCase() ?? "";
      if (title.includes("marché de l'art contemporain")) {
        return { ...event, imageUrl: MARCHE_EVENT_IMAGE };
      }
      return event;
    });
    clearRuntimeAlert("data.events.fallback");
    return normalized;
  } catch (error) {
    console.warn("Failed to load upcoming events, using fallback list.", error);
    markRuntimeAlert("data.events.fallback", "Impossible de charger les événements – fallback statique", "critical");
    return FALLBACK_UPCOMING_EVENTS.slice(0, take);
  }
}

export async function queryUpcomingEvents(params: QueryParams = {}): Promise<UpcomingEvent[]> {
  return loadUpcomingEvents(params);
}

export const getUpcomingEvents = unstable_cache(
  async (limit: number) => loadUpcomingEvents({ limit }),
  [CACHE_TAGS.upcomingEvents],
  { revalidate: 120, tags: [CACHE_TAGS.upcomingEvents] }
);
