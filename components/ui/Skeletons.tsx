"use client";

export function ArtworkSkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden border border-subtle bg-white/5 backdrop-blur-md shadow-md animate-pulse">
      <div className="h-56 sm:h-64 bg-border-subtle" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-border-subtle rounded w-3/4" />
        <div className="h-3 bg-border-subtle rounded w-1/2" />
        <div className="h-3 bg-border-subtle rounded w-2/3" />
      </div>
    </div>
  );
}

export function ArtistSkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden border border-subtle bg-white/5 backdrop-blur-md shadow-md animate-pulse">
      <div className="h-48 lg:h-56 bg-border-subtle" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-border-subtle rounded w-2/3" />
        <div className="h-3 bg-border-subtle rounded w-1/3" />
        <div className="h-3 bg-border-subtle rounded w-5/6" />
      </div>
    </div>
  );
}
