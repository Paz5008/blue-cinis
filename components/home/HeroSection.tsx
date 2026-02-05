import Hero from "@/components/layout/Hero";
import { getFeaturedArtworks } from "@/lib/data/artworks";

export default async function HeroSection() {
  const { items } = await getFeaturedArtworks(10); // Fetch enough items for the carousel

  return <Hero artworks={items} />;
}
