import { getFeaturedArtists, FALLBACK_NEW_ARTISTS } from "@/lib/data/artists";
import { getUpcomingEvents, FALLBACK_UPCOMING_EVENTS } from "@/lib/data/events";
import ArtistsEventsSectionClient from "./ArtistsEventsSectionClient";

export default async function ArtistsEventsSection() {
  const [artistsResult, eventsResult] = await Promise.allSettled([
    getFeaturedArtists(6),
    getUpcomingEvents(6),
  ]);

  let artists =
    artistsResult.status === "fulfilled" ? artistsResult.value : FALLBACK_NEW_ARTISTS.slice(0, 6);
  if (!artists.length) {
    artists = FALLBACK_NEW_ARTISTS.slice(0, 6);
  }

  let events =
    eventsResult.status === "fulfilled" ? eventsResult.value : FALLBACK_UPCOMING_EVENTS.slice(0, 6);
  if (!events.length) {
    events = FALLBACK_UPCOMING_EVENTS.slice(0, 6);
  }

  return <ArtistsEventsSectionClient artists={artists} events={events} />;
}
