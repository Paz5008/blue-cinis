import Link from 'next/link';
import Image from 'next/image';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OrderStatusBadge from '@/components/dashboard-buyer/OrderStatusBadge';
import { notFound, redirect } from 'next/navigation';
import {
    ArrowLeft,
    MapPin,
    CreditCard,
    Download,
    Package,
    Truck,
    CheckCircle,
    HelpCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            artwork: true,
            artist: true
        }
    });

    // Security check: Order must belong to the user
    if (!order || order.userId !== session.user.id) {
        notFound();
    }

    const date = new Date(order.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(order.amount / 100);

    // Parse addresses (assuming they are JSON, we cast carefully)
    const shippingAddress = order.shippingAddress as any;
    // const billingAddress = order.billingAddress as any; // If needed

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Back Link */}
            <div className="flex items-center gap-4">
                <Link
                    href="/compte/commandes"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-heading font-medium text-gray-900">Commande #{order.id.slice(0, 8).toUpperCase()}</h1>
                        <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Passée le {date}</p>
                </div>
                <div className="ml-auto">
                    <button disabled className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed hover:bg-gray-50 transition-colors">
                        <Download size={16} className="mr-2" />
                        Facture
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Content & Status */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Items Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-heading font-medium text-lg mb-6">Articles</h2>
                        <div className="flex gap-6">
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                {order.artwork.imageUrl && (
                                    <Image
                                        src={order.artwork.imageUrl}
                                        alt={order.artwork.title}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>
                            <div>
                                <Link href={`/galerie/${order.artworkId}`} className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors block mb-1">
                                    {order.artwork.title}
                                </Link>
                                <p className="text-gray-500 mb-2">Artiste : {order.artist.name}</p>
                                <p className="font-medium text-gray-900">{amount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tracking / Fulfillment */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-heading font-medium text-lg mb-6">Suivi de livraison</h2>

                        {/* Simple Timeline */}
                        <div className="space-y-6 relative ml-2">
                            {/* Line */}
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100 -z-10"></div>

                            {/* Step 1: Confirmed */}
                            <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center border-2 border-white ring-2 ring-gray-50">
                                    <CheckCircle size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Commande confirmée</p>
                                    <p className="text-xs text-gray-500">{date}</p>
                                </div>
                            </div>

                            {/* Step 2: Shipping (Dynamic) */}
                            <div className="flex gap-4">
                                <div className={
                                    order.fulfillmentStatus === 'shipped'
                                        ? "w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-white ring-2 ring-gray-50"
                                        : "w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border-2 border-white ring-2 ring-gray-50 bg-white border-gray-200"
                                }>
                                    <Truck size={14} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${order.fulfillmentStatus === 'shipped' ? 'text-gray-900' : 'text-gray-400'}`}>
                                        Expédition
                                    </p>
                                    {order.fulfillmentStatus === 'shipped' ? (
                                        <p className="text-xs text-gray-500">Votre œuvre est en route.</p>
                                    ) : (
                                        <p className="text-xs text-gray-400">En attente d'expédition par l'artiste.</p>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Delivered (Placeholder logic) */}
                            <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border-2 border-white ring-2 ring-gray-50 bg-white border-gray-200">
                                    <Package size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Livraison</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Info Sidebar */}
                <div className="space-y-6">

                    {/* Shipping Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                            <MapPin size={16} className="mr-2 text-gray-400" /> Adresse de livraison
                        </h3>
                        {shippingAddress ? (
                            <div className="text-sm text-gray-600 leading-relaxed">
                                <p className="font-medium text-gray-900">{shippingAddress.name}</p>
                                <p>{shippingAddress.line1}</p>
                                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                                <p>{shippingAddress.postalCode} {shippingAddress.city}</p>
                                <p>{shippingAddress.country}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Adresse non disponible (Produit digital ou erreur)</p>
                        )}
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                            <CreditCard size={16} className="mr-2 text-gray-400" /> Paiement
                        </h3>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Sous-total</span>
                            <span className="text-gray-900">{amount}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-4">
                            <span className="text-gray-500">Livraison</span>
                            <span className="text-green-600 font-medium">Offerte</span>
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex justify-between font-medium">
                            <span>Total payé</span>
                            <span>{amount}</span>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="text-sm font-medium text-blue-900 flex items-center mb-2">
                            <HelpCircle size={16} className="mr-2" /> Besoin d'aide ?
                        </h3>
                        <p className="text-xs text-blue-700 mb-4">
                            Un problème avec votre commande ? Notre équipe est là pour vous aider.
                        </p>
                        <Link href="/contact" className="text-sm font-medium text-blue-600 hover:underline">
                            Contacter le support
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
