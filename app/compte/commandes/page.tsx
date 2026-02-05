import Link from 'next/link';
import Image from 'next/image';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OrderStatusBadge from '@/components/dashboard-buyer/OrderStatusBadge';
import { Archive, ChevronRight, Calendar, Tag } from 'lucide-react';
import { redirect } from 'next/navigation';

// Dynamic rendering to ensure we fetch latest orders
export const dynamic = 'force-dynamic';

export default async function BuyerOrdersPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const orders = await prisma.order.findMany({
        where: {
            userId: session.user.id
        },
        include: {
            artwork: true,
            artist: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Archive size={32} />
                </div>
                <h2 className="text-xl font-heading font-medium text-gray-900 mb-2">Aucune commande</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                    Vous n'avez pas encore passé de commande. Explorez la galerie pour trouver votre première œuvre d'art.
                </p>
                <Link
                    href="/galerie"
                    className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Découvrir la galerie
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-medium text-gray-900">Mes Commandes</h1>
                <div className="text-sm text-gray-500">
                    {orders.length} commande{orders.length > 1 ? 's' : ''}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/50">
                                <th className="px-6 py-4 font-medium text-gray-500">Référence & Date</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Œuvre</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Montant</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Statut</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => {
                                const date = new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });
                                const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(order.amount / 100);

                                return (
                                    <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                        {/* Ref & Date */}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 truncate max-w-[120px]" title={order.id}>
                                                {order.id.slice(0, 8).toUpperCase()}...
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                                <Calendar size={12} className="mr-1" />
                                                {date}
                                            </div>
                                        </td>

                                        {/* Artwork & Artist */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {order.artwork.imageUrl ? (
                                                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                                        <Image
                                                            src={order.artwork.imageUrl}
                                                            alt={order.artwork.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <Tag size={16} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{order.artwork.title}</div>
                                                    <div className="text-xs text-gray-500">{order.artist.name}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {amount}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <OrderStatusBadge status={order.status} />
                                        </td>

                                        {/* Action */}
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/compte/commandes/${order.id}`}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-colors"
                                                title="Voir les détails"
                                            >
                                                <ChevronRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
