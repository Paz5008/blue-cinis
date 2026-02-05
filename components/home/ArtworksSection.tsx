import { getFeaturedArtworks } from "@/lib/data/artworks";
import ArtworksSectionClient from "./ArtworksSectionClient";

export default async function ArtworksSection() {
    const { items, nextCursor } = await getFeaturedArtworks(8);
    return (
        <ArtworksSectionClient
            artworks={items}
        />
    );
}
