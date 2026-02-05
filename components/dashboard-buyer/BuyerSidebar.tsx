'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
    Package,
    Heart,
    Users,
    Settings,
    LogOut,
    LayoutDashboard,
    ShoppingBag
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
    { label: 'Tableau de bord', href: '/compte', icon: LayoutDashboard },
    { label: 'Mes Commandes', href: '/compte/commandes', icon: ShoppingBag },
    { label: 'Ma Collection', href: '/compte/favoris', icon: Heart },
    { label: 'Artistes Suivis', href: '/compte/artistes', icon: Users },
    { label: 'Paramètres', href: '/compte/parametres', icon: Settings },
];

export default function BuyerSidebar({ userEmail, userName }: { userEmail?: string | null, userName?: string | null }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex h-screen sticky top-0">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-gray-50">
                <Link href="/" className="text-xl font-heading font-bold tracking-tight">
                    BLUE CINIS
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                                isActive
                                    ? "bg-gray-50 text-black"
                                    : "text-gray-500 hover:text-black hover:bg-gray-50/50"
                            )}
                        >
                            <Icon size={18} className={clsx("mr-3", isActive ? "text-black" : "text-gray-400 group-hover:text-black")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-gray-50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {(userName?.[0] || userEmail?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {userName || 'Collectionneur'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {userEmail}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                >
                    <LogOut size={16} className="mr-3" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}
