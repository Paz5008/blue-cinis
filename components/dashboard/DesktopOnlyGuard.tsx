'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

export default function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkSize = () => {
            setIsMobile(window.innerWidth < 768); // 768px breakpoint
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    if (!mounted) return <>{children}</>;

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white/10 p-4 rounded-full mb-6">
                    <Monitor className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl font-serif mb-4">Version Bureau Requise / Desktop Required</h1>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                    L'éditeur de personnalisation est optimisé pour les écrans larges afin de garantir la précision de vos designs.
                    <br /><br />
                    Veuillez accéder à cette page depuis un ordinateur.
                </p>
                <div className="flex gap-2 text-sm text-gray-500">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile non supporté</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
