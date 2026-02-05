"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SceneTunnel } from "./SceneTunnel";

// Import dynamique pour éviter les erreurs SSR (Server Side Rendering)
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function SceneWrapper(props: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <SceneTunnel.In>
            <Scene {...props} />
        </SceneTunnel.In>
    );
}
