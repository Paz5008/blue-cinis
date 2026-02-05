"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import React from "react";
import Link from "next/link";
// Boutons Stripe déplacés vers la page Paramètres

interface DashboardArtistLayoutProps {
    children: React.ReactNode;
    initialLeadCount?: number;
}

import {
    LayoutDashboard,
    User,
    Image as ImageIcon,
    ShoppingBag,
    MessageSquare,
    PlusCircle,
    Palette,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { signOut } from "next-auth/react";

interface UserWithRole {
    role?: string;
}

export default function DashboardArtistClientLayout({ children, initialLeadCount = 0 }: DashboardArtistLayoutProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const hasRedirected = useRef(false);

    // Use initial count from server, optionally revalidate if needed but likely sufficient
    // We can keep it simple as a prop
    const leadCount = initialLeadCount;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Close mobile menu on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const showSidebar = !pathname.startsWith('/dashboard-artist/customization');

    useEffect(() => {
        if (hasRedirected.current) return;
        if (status === "loading") return;
        const user = session?.user as UserWithRole | undefined;
        if (!user || user.role !== "artist") {
            hasRedirected.current = true;
            router.push("/");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <div className="h-4 w-4 animate-pulse rounded-full bg-white/20" />
            </div>
        );
    }

    const navLinks = [
        { href: "/dashboard-artist", label: "Aperçu", icon: LayoutDashboard },
        { href: "/dashboard-artist/artworks", label: "Mes Œuvres", icon: ImageIcon },
        { href: "/dashboard-artist/leads", label: "Demandes", icon: MessageSquare, badge: leadCount > 0 ? leadCount : null },
        { href: "/dashboard-artist/orders", label: "Commandes", icon: ShoppingBag },
        { href: "/dashboard-artist/profile", label: "Profil", icon: User },
        { href: "/dashboard-artist/customization", label: "Personnalisation", icon: Palette },
    ];

    const secondaryLinks = [
        { href: "/dashboard-artist/parametres", label: "Paramètres", icon: Settings },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard-artist' && pathname === '/dashboard-artist') return true;
        if (path !== '/dashboard-artist' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="artist-dashboard-base flex min-h-screen bg-[var(--dash-bg)] text-[var(--dash-text)] font-sans selection:bg-[var(--dash-accent-bg)] selection:text-[var(--dash-accent-text)]">
            {/* Mobile Header */}
            {showSidebar && (
                <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[var(--dash-sidebar-border)] bg-[var(--dash-sidebar-bg)] p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-serif tracking-tight">Loire<span className="opacity-40">.Gallery</span></h2>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 opacity-80 hover:opacity-100"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            )}

            {showSidebar && (
                <>
                    {/* Overlay for mobile */}
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}

                    <aside className={`fixed left-0 top-0 h-screen w-64 border-r border-[var(--dash-sidebar-border)] bg-[var(--dash-sidebar-bg)] p-6 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        } ${!showSidebar ? 'hidden' : ''}`}>
                        <div>
                            <div className="mb-10 px-2 hidden lg:block">
                                <h2 className="text-xl font-serif tracking-tight">Loire<span className="opacity-40">.Gallery</span></h2>
                                <p className="text-xs opacity-40 mt-1 uppercase tracking-widest">Espace Artiste</p>
                            </div>
                            {/* Mobile Logo inside Sidebar */}
                            <div className="mb-8 px-2 lg:hidden">
                                <h2 className="text-xl font-serif tracking-tight">Menu</h2>
                            </div>

                            <nav className="space-y-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 ${isActive(link.href)
                                            ? 'bg-[var(--dash-accent-bg)] text-[var(--dash-accent-text)] font-medium'
                                            : 'text-[var(--dash-sidebar-text-muted)] hover:text-[var(--dash-sidebar-text)] hover:bg-[var(--dash-sidebar-hover)]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <link.icon size={16} className={isActive(link.href) ? 'text-current' : 'opacity-40 group-hover:opacity-100'} />
                                            <span>{link.label}</span>
                                        </div>
                                        {link.badge ? (
                                            <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive(link.href) ? 'bg-[var(--dash-accent-text)] text-[var(--dash-accent-bg)]' : 'bg-[var(--dash-accent-bg)] text-[var(--dash-accent-text)]'
                                                }`}>
                                                {link.badge}
                                            </span>
                                        ) : null}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-8 pt-8 border-t border-[var(--dash-sidebar-border)]">
                                <nav className="space-y-1">
                                    {secondaryLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${isActive(link.href)
                                                ? 'bg-[var(--dash-accent-bg)] text-[var(--dash-accent-text)] font-medium'
                                                : 'text-[var(--dash-sidebar-text-muted)] hover:text-[var(--dash-sidebar-text)] hover:bg-[var(--dash-sidebar-hover)]'
                                                }`}
                                        >
                                            <link.icon size={16} className={isActive(link.href) ? 'text-current' : 'opacity-40 group-hover:opacity-100'} />
                                            <span>{link.label}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--dash-sidebar-border)]">
                            <Link
                                href="/dashboard-artist/artworks/add"
                                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--dash-sidebar-hover)] border border-[var(--dash-sidebar-border)] px-4 py-2.5 text-sm font-medium text-[var(--dash-sidebar-text)] transition-all hover:bg-[var(--dash-accent-bg)] hover:text-[var(--dash-accent-text)]"
                            >
                                <PlusCircle size={16} />
                                <span className={isMobileMenuOpen ? "hidden" : "" /* Petit fix visuel si menu ouvert */}>Ajouter une œuvre</span>
                            </Link>

                            <button
                                onClick={() => signOut()}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400/80 transition-colors hover:bg-red-400/10 hover:text-red-400"
                            >
                                <LogOut size={16} />
                                <span>Déconnexion</span>
                            </button>
                        </div>
                    </aside>
                </>
            )}

            <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'pt-16 lg:pt-0 lg:pl-64' : ''}`}>
                <div className={`${showSidebar ? 'min-h-full p-4 lg:p-12 max-w-7xl mx-auto' : 'h-full w-full'}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
