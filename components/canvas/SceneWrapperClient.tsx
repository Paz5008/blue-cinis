"use client";

import dynamic from 'next/dynamic';

// Lazy load the entire 3D scene to reduce initial bundle (~300-400KB)
const SceneWrapper = dynamic(
    () => import("@/components/canvas/SceneWrapper"),
    {
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-[#030303]" />
    }
);

interface SceneWrapperClientProps {
    items: any[];
    totalDepth: number;
}

export default function SceneWrapperClient({ items, totalDepth }: SceneWrapperClientProps) {
    return <SceneWrapper items={items} totalDepth={totalDepth} />;
}
