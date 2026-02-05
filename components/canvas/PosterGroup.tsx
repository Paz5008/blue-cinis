"use client";

import Poster from "./Poster";

const POSTERS = [
    "/uploads/artwork-portrait-01.png",
    "/uploads/artwork-portrait-02.png",
    "/uploads/artwork-landscape-01.png"
];

export default function PosterGroup({ startZ }: { startZ: number }) {
    return (
        <group position={[0, 0, startZ]}>
            <Poster url={POSTERS[0]} position={[-2.5, 0, 0]} rotation={[0, 0.2, 0]} />
            <Poster url={POSTERS[1]} position={[0, 0.5, -2]} rotation={[0, 0, 0.05]} scale={[1.2, 1.6, 1]} />
            <Poster url={POSTERS[2]} position={[2.5, -0.5, -1]} rotation={[0, -0.2, -0.05]} />
        </group>
    );
}
