import Link from 'next/link';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ArtworkCard from '@/components/features/gallery/ArtworkCard';
import { Heart } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BuyerWishlistPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const wishlistItems = await prisma.wishlist.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            artwork: {
                include: {
                    artist: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (wishlistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-300">
                    <Heart size={32} />
                </div>
                <h2 className="text-xl font-heading font-medium text-gray-900 mb-2">Votre collection est vide</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                    Ajoutez des œuvres à vos favoris en cliquant sur le cœur lors de votre exploration.
                </p>
                <Link
                    href="/galerie"
                    className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Parcourir la galerie
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-medium text-gray-900">Ma Collection</h1>
                <div className="text-sm text-gray-500">
                    {wishlistItems.length} œuvre{wishlistItems.length > 1 ? 's' : ''}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistItems.map((item) => (
                    <div key={item.artworkId} className="h-[420px]">
                        <ArtworkCard
                            artwork={{
                                ...item.artwork,
                                artworkId: item.artwork.id, // Adaptation car ArtworkCard attend artworkId parfois
                                artistName: item.artwork.artist?.name || 'Artiste Inconnu',
                                artistSlug: item.artwork.artist?.slug || undefined,
                                // Assurer compatibilité type
                                price: item.artwork.price,
                                artistId: item.artwork.artistId,
                                dimensions: undefined,
                                year: item.artwork.year || undefined,
                                description: item.artwork.description || undefined,
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
