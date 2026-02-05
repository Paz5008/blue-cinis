
import { getArtists } from "@/lib/db/queries";
import ArtistCard from "@/components/features/gallery/ArtistCard";
import { ArtistSortControl } from "@/components/features/gallery/ArtistSortControl";

export const revalidate = 3600; // Revalidate every hour

export default async function ArtistsPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: 'name_asc' | 'name_desc' | 'artworks_desc' | 'style_asc' }>
}) {
    const { sort } = await searchParams;
    const artists = await getArtists(sort);

    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-24">
            <div className="absolute inset-0 z-0 pointer-events-none fixed">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with Parallax Feel & Sorting */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-white/10 pb-8">
                    <div className="max-w-2xl">
                        <span className="font-mono text-xs tracking-[0.3em] uppercase text-white/40 mb-4 block">
                            Our Talents
                        </span>
                        <h1 className="font-grand-slang text-6xl md:text-8xl mb-6 text-white leading-[0.9]">
                            Artists
                        </h1>
                        <p className="text-white/50 font-light text-lg">
                            Découvrez les visionnaires qui façonnent l'esthétique Dark Luxury de notre galerie.
                        </p>
                    </div>

                    <div className="mt-8 md:mt-0">
                        <ArtistSortControl />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                    {artists.map((artist: any, index: number) => (
                        <ArtistCard key={artist.id} artist={artist} />
                    ))}
                </div>

                {/* Empty State */}
                {artists.length === 0 && (
                    <div className="text-center py-32 border border-white/5 rounded-lg bg-white/[0.02]">
                        <p className="font-grand-slang text-2xl text-white/40">Aucun artiste trouvé.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
