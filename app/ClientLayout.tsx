"use client";

import { ReactNode } from "react";
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import CookieBanner from "@/components/shared/CookieBanner";
import type { Session } from "next-auth";
import type { CategorySummary } from "@/lib/data/categories";
import Preloader from '@/components/shared/Preloader';
import LayoutCanvas from "@/components/canvas/LayoutCanvas";
// import AuthButton from "../components/AuthButton"; // Import retiré, car probablement utilisé dans Navbar

interface ClientLayoutProps {
    children: ReactNode;
    categories: CategorySummary[];
    initialSession: Session | null;
}

export default function ClientLayout({ children, categories, initialSession }: ClientLayoutProps) {
    const pathname = usePathname();

    // Logic for Dashboard/Admin routes to hide chrome
    const isFullScreenEditor = pathname?.startsWith('/dashboard-artist/customization');
    const isAdminRoute = pathname?.startsWith('/admin');
    // const isDashboardRoute = isFullScreenEditor || isAdminRoute || pathname?.startsWith('/dashboard-artist');

    // Logic for Homepage - Full Immersion
    const isHomePage = pathname === '/';

    // Logic for Gallery page - has its own integrated nav
    const isGalleryPage = pathname === '/galerie' || pathname?.startsWith('/galerie?');

    // Determine what to render
    const shouldRenderSiteChrome = !isFullScreenEditor && !isAdminRoute;
    // Navbar hidden on Homepage and Gallery (has its own nav)
    const shouldRenderNavbar = shouldRenderSiteChrome && !isHomePage && !isGalleryPage;

    const shouldRenderPreloader = false; // !isDashboardRoute && pathname === '/';

    return (
        <>
            {shouldRenderPreloader && <Preloader />}

            {/* Persistent Canvas for 3D Scenes */}
            <LayoutCanvas />

            {/* Skip link pour accéder directement au contenu principal */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only absolute top-2 left-2 bg-white text-black dark:bg-gray-800 dark:text-white px-2 py-1 rounded z-50"
            >
                Passer au contenu
            </a>
            {/* Barre de navigation (supposée fixe et h-14) */}
            {shouldRenderNavbar && <Navbar categories={categories} initialSession={initialSession} />}

            {/* Contenu principal avec animation de transition */}
            <main
                id="main"
                role="main"
                aria-label="Contenu principal"
                className="flex-grow"
            >
                {children}
            </main>

            {/* Pied de page */}
            {/* Ne pas afficher le footer sur la page d'accueil (la home a son propre wrapper) */}
            {shouldRenderSiteChrome && pathname !== '/' && <Footer />}
        </>
    );
}
