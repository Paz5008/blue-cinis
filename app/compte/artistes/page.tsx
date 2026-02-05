import Link from 'next/link';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ArtistCard from '@/components/features/gallery/ArtistCard'; // Direct path as seen in file view
import { Users, Search } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BuyerFollowsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const follows = await prisma.follower.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            artist: {
                include: {
                    profileImage: true // Check relation name is correct (verified in Artist model view: profileImage MediaLibrary?)
                }
            }
        },
        orderBy: {
            // Since Follower model doesn't have created_at in my recollection (checked in social view, simplistic model), 
            // we might not act on ordering, or default order.
            // Wait, schema view: model Follower { userId String artistId String @@id... } 
            // It has NO created_at?
            // Let's check schema again or assume no sort available.
            // If no sort, we just take it as is.
            // Prisma relies on default sort of ID usually, but compound ID...
            // Let's omit orderBy if unsafe.
        }
    });

    if (follows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-300">
                    <Users size={32} />
                </div>
                <h2 className="text-xl font-heading font-medium text-gray-900 mb-2">Aucun abonnement</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                    Suivez des artistes pour être tenu informé de leurs nouvelles créations.
                </p>
                <Link
                    href="/galerie" // Maybe /artistes if available? Assuming /artistes exists public side?
                    className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Découvrir nos artistes
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-medium text-gray-900">Artistes Suivis</h1>
                <div className="text-sm text-gray-500">
                    {follows.length} artiste{follows.length > 1 ? 's' : ''}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {follows.map((follow) => (
                    <div key={follow.artistId} className="h-full">
                        <ArtistCard
                            artist={{
                                id: follow.artist.id,
                                name: follow.artist.name,
                                slug: follow.artist.slug || undefined,
                                image: follow.artist.photoUrl || follow.artist.profileImage?.fileUrl, // Fallback logic
                                specialty: follow.artist.artStyle || undefined
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
