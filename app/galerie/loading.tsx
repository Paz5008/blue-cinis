import { ArtworkSkeletonCard } from "@/components/ui/Skeletons";

export default function LoadingGallery() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="h-8 w-40 bg-border-subtle rounded mb-6 animate-pulse" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ArtworkSkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
