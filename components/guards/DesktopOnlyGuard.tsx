"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Monitor } from 'lucide-react';

export default function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        // Check immediately
        checkSize();

        // Add listener
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Prevent hydration mismatch or flash by rendering nothing until check completes
    if (isMobile === null) {
        return (
            <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                    <Monitor className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
                </div>
                <h1 className="mb-3 text-2xl font-bold text-slate-900">
                    Expérience optimisée pour ordinateur
                </h1>
                <p className="mb-8 max-w-md text-slate-600 leading-relaxed">
                    L'Atelier de Création nécessite un écran d'ordinateur pour une précision optimale.
                    Retrouvez-nous sur votre Mac ou PC.
                </p>
                <Link
                    href="/dashboard-artist"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:-translate-y-0.5"
                >
                    <LayoutDashboard size={18} />
                    Retour au Tableau de Bord
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
