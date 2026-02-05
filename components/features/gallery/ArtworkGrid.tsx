import ArtworkCard from './ArtworkCard';

export function ArtworkGrid({ artworks }: { artworks: any[] }) {
    if (!artworks || artworks.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                Aucune œuvre trouvée.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
        </div>
    );
}
