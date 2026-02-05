import React from 'react';
import DesktopOnlyGuard from '@/components/dashboard/DesktopOnlyGuard';

export default function CustomizationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DesktopOnlyGuard>
            {children}
        </DesktopOnlyGuard>
    );
}
