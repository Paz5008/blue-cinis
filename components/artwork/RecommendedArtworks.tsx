import { getArtworkRecommendations } from '@/src/lib/recommendations';
import { RecommendationCard } from './RecommendationCard';

interface Props {
    currentArtworkId: string;
    artistId: string;
    userId?: string;
    title?: string;
    limit?: number;
}

/**
 * Server Component that displays recommended artworks
 * Fetches recommendations based on current artwork and artist context
 */
export async function RecommendedArtworks({
    currentArtworkId,
    artistId,
    userId,
    title = "Vous aimerez aussi",
    limit = 8
}: Props) {
    let recommendations: { id: string; title: string; imageUrl: string; price: number; artistName?: string | null }[] = [];

    try {
        recommendations = await getArtworkRecommendations(
            currentArtworkId,
            artistId,
            userId,
            limit
        );
    } catch (error) {
        console.error('[RecommendedArtworks] Error fetching recommendations:', error);
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <section
            aria-label={title}
            className="mt-12 pt-8 border-t border-white/10"
        >
            <h2 className="text-2xl font-semibold mb-6 text-white">
                {title}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendations.map(artwork => (
                    <RecommendationCard key={artwork.id} artwork={artwork} />
                ))}
            </div>
        </section>
    );
}

export default RecommendedArtworks;
