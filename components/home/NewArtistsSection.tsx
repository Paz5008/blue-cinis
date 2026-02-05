import { getNewestArtists } from "@/src/lib/data/artists";
import NewArtistsSectionClient from "./NewArtistsSectionClient";

export interface NewArtist {
  id: string;
  name: string;
  slug: string | null;
  portrait: string | null;
  type: string;
  location: string;
  bio: string;
  artworkCount: number;
  works: string[];
}

/**
 * Server Component for NewArtistsSection
 * Fetches newest artists from the database
 */
export default async function NewArtistsSection() {
  let artists: NewArtist[] = [];

  try {
    const rawArtists = await getNewestArtists(6);

    artists = rawArtists.map((artist) => {
      // Extract artwork images for the portfolio preview
      const works = (artist.artworks || [])
        .slice(0, 3)
        .map((aw: any) => aw?.images?.[0] || aw?.imageUrl)
        .filter(Boolean) as string[];

      // Fallback works if none available
      const fallbackWorks = [
        "/uploads/artwork-portrait-01.png",
        "/uploads/artwork-portrait-02.png",
        "/uploads/artwork-landscape-01.png"
      ];

      return {
        id: artist.id,
        name: artist.name || "Artiste",
        slug: artist.slug,
        portrait: artist.photoUrl || "/uploads/artwork-portrait-01.png",
        type: artist.artStyle || "Art Contemporain",
        location: "France", // Could be added to schema later
        bio: artist.homeSnippet || artist.biography || "",
        artworkCount: artist.artworks?.length || 0,
        works: works.length >= 3 ? works : [...works, ...fallbackWorks].slice(0, 3)
      };
    }).filter(a => a.artworkCount > 0 || a.name !== "Artiste"); // Only show artists with content

  } catch (error) {
    console.error("[NewArtistsSection] Failed to load artists:", error);
    // Fallback data
    artists = [
      {
        id: "fallback-1",
        name: "Artiste en Vedette",
        slug: null,
        portrait: "/uploads/artwork-portrait-01.png",
        type: "Art Contemporain",
        location: "France",
        bio: "Découvrez les talents émergents de notre galerie",
        artworkCount: 0,
        works: ["/uploads/artwork-portrait-01.png", "/uploads/artwork-portrait-02.png", "/uploads/artwork-landscape-01.png"]
      }
    ];
  }

  // Don't render if no artists
  if (artists.length === 0) {
    return null;
  }

  return (
    <section id="home-new-artists" className="home-section relative" aria-label="Nouveaux artistes">
      <div className="section-container relative z-10 pointer-events-none w-full">
        <NewArtistsSectionClient artists={artists} />
      </div>
    </section>
  );
}
