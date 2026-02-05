import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import NewsAgendaSectionClient from "./NewsAgendaSectionClient";

export interface EventData {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  category: string;
}

async function loadUpcomingEvents(): Promise<EventData[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        date: { gte: new Date() } // Only future events
      },
      orderBy: { date: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
      }
    });

    if (events.length === 0) {
      return FALLBACK_EVENTS;
    }

    return events.map((event) => {
      const date = new Date(event.date);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();

      return {
        id: event.id,
        title: event.title,
        dateLabel: `${day} ${month}`,
        location: event.location || "Blue Cinis Gallery",
        category: "Événement"
      };
    });
  } catch (error) {
    console.error("[NewsAgendaSection] Failed to load events:", error);
    return FALLBACK_EVENTS;
  }
}

const getUpcomingEvents = unstable_cache(
  loadUpcomingEvents,
  ["upcoming-events"],
  { revalidate: 300, tags: ["events"] }
);

// Fallback data for when DB is empty or errors
const FALLBACK_EVENTS: EventData[] = [
  { id: "1", title: "Lumière & Matière", dateLabel: "12 OCT", location: "Paris, Le Marais", category: "Vernissage" },
  { id: "2", title: "Digital Sculpting Workshop", dateLabel: "24 NOV", location: "Lyon, Confluence", category: "Masterclass" },
  { id: "3", title: "Echoes of Void", dateLabel: "05 DEC", location: "Online / Metaverse", category: "Exposition" },
];

export default async function NewsAgendaSection() {
  const events = await getUpcomingEvents();

  return <NewsAgendaSectionClient events={events} />;
}
