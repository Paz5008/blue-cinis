import { auth } from "@/auth";
import Link from 'next/link';
import { ShoppingBag, Heart, ArrowRight } from 'lucide-react';

export default async function BuyerDashboardPage() {
    const session = await auth();
    const userName = session?.user?.name || "Collectionneur";
    const firstName = userName.split(' ')[0]; // Simple extraction

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-heading font-medium text-gray-900">
                    Bonjour, {firstName}
                </h1>
                <p className="mt-2 text-gray-500">
                    Bienvenue dans votre espace personnel. Retrouvez ici vos acquisitions et vos coups de cœur.
                </p>
            </div>

            {/* Quick Stats / Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Orders Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Mes Commandes</h3>
                    <p className="text-sm text-gray-500 mb-4">Suivez vos acquisitions et téléchargez vos factures.</p>
                    <Link href="/compte/commandes" className="text-sm font-medium text-blue-600 flex items-center hover:underline">
                        Voir l'historique <ArrowRight size={14} className="ml-1" />
                    </Link>
                </div>

                {/* Wishlist Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <Heart size={20} />
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Ma Collection</h3>
                    <p className="text-sm text-gray-500 mb-4">Retrouvez vos œuvres favorites et vos artistes suivis.</p>
                    <Link href="/compte/favoris" className="text-sm font-medium text-gray-900 flex items-center hover:underline">
                        Accéder à ma liste <ArrowRight size={14} className="ml-1" />
                    </Link>
                </div>

                {/* Gallery CTA */}
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-900 shadow-sm text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black z-0"></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-medium text-white mb-1">Explorer la Galerie</h3>
                        <p className="text-sm text-gray-300 mb-4">Découvrez les dernières nouveautés.</p>
                        <Link href="/galerie" className="inline-flex px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
                            Parcourir
                        </Link>
                    </div>
                </div>

            </div>

            {/* Recent Activity Placeholder */}
            <div className="pt-8 border-t border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Activité Récente</h2>
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                    <p>Aucune activité récente à afficher.</p>
                </div>
            </div>
        </div>
    );
}
