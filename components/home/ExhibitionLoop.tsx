import { getFeaturedArtists } from "@/src/lib/data/artists";
import ExhibitionLoopClient from "./ExhibitionLoopClient";

/**
 * Server Component wrapper for ExhibitionLoop
 * Fetches featured artists from DB and passes to client component
 */
export default async function ExhibitionLoop() {
    const artists = await getFeaturedArtists(6);

    // Transform DB artists to client format
    const clientArtists = artists.map((artist) => ({
        id: artist.id,
        name: artist.name ?? "Artiste invité",
        image: artist.artworks?.[0]?.imageUrl ?? artist.photoUrl ?? "/uploads/artwork-portrait-01.png",
        portrait: artist.photoUrl ?? "/uploads/artwork-portrait-01.png",
        slug: artist.slug ?? artist.id,
        role: artist.artStyle ?? "Art contemporain",
        location: "France",
        works: artist.artworks?.length ?? 0,
        tagline: artist.biography?.slice(0, 100) ?? "Découvrez l'univers unique de cet artiste",
    }));

    // Use fallback if no DB artists found
    const displayArtists = clientArtists.length > 0 ? clientArtists : FALLBACK_ARTISTS;

    return <ExhibitionLoopClient artists={displayArtists} />;
}

// Fallback static data for when DB is empty
const FALLBACK_ARTISTS = [
    {
        id: "1",
        name: "Elena Rossi",
        image: "/uploads/artwork-portrait-01.png",
        portrait: "/uploads/artwork-portrait-01.png",
        slug: "elena-rossi",
        role: "Digital Sculpture",
        location: "Milano, IT",
        works: 24,
        tagline: "Exploring the boundaries between organic forms and digital precision"
    },
    {
        id: "2",
        name: "Marcus Thompson",
        image: "/uploads/artwork-portrait-02.png",
        portrait: "/uploads/artwork-portrait-02.png",
        slug: "marcus-thompson",
        role: "Light Installation",
        location: "London, UK",
        works: 18,
        tagline: "Light as a medium for emotional storytelling"
    },
    {
        id: "3",
        name: "Sarah Kimura",
        image: "/uploads/artwork-landscape-01.png",
        portrait: "/uploads/artwork-landscape-01.png",
        slug: "sarah-kimura",
        role: "Abstract Paint",
        location: "Tokyo, JP",
        works: 47,
        tagline: "Color fields that speak to the unconscious mind"
    },
    {
        id: "4",
        name: "David Laurent",
        image: "/uploads/6a596e69-767e-452e-a938-9c9c89f6b8d4.jpg",
        portrait: "/uploads/6a596e69-767e-452e-a938-9c9c89f6b8d4.jpg",
        slug: "david-laurent",
        role: "Photography",
        location: "Paris, FR",
        works: 89,
        tagline: "Capturing the poetry of everyday moments"
    },
];
