'use client';

import { Canvas } from '@react-three/fiber';
import { View, Preload } from '@react-three/drei';
import { SceneTunnel } from './SceneTunnel';
import { Suspense } from 'react';
import * as THREE from 'three';

export default function LayoutCanvas() {
    return (
        <div className="fixed inset-0 z-0 h-screen w-full pointer-events-none">
            <Canvas
                shadows
                camera={{ position: [0, 0, 5], fov: 75 }}
                style={{ pointerEvents: 'none' }}
                eventSource={typeof window !== 'undefined' ? document.body : undefined}
                eventPrefix="client"
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                }}
            >
                {/* Global Scene Elements if any */}

                {/* Tunnel Outlet for Page Specific Content */}
                <SceneTunnel.Out />

                <Preload all />
            </Canvas>
        </div>
    );
}
