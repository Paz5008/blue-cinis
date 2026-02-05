import { ArtistSkeletonCard } from "@/components/ui/Skeletons";

export default function LoadingArtists() {
  return (
    <section className="bg-subtle py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 w-48 bg-border-subtle rounded mb-8 animate-pulse" />
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ArtistSkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
