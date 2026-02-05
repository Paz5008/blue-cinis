"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function ArtistPostersSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Animation parallax douce pour le texte
  const yText = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} className="relative min-h-[50vh] z-20 flex items-center">

      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

        {/* Colonne Gauche : Titre */}
        <div className="md:col-span-5 relative mix-blend-difference pointer-events-auto">
          <m.div style={{ y: yText }}>
            <span className="text-blue-500 font-mono text-xs tracking-[0.4em] uppercase mb-6 block">
              Limited Editions
            </span>
            <h2 className="text-5xl md:text-7xl font-grand-slang text-white leading-tight mb-8">
              Affiches<br />
              <span className="italic text-white/50">Signature</span>
            </h2>
            <div className="h-[1px] w-32 bg-white/20 mb-8" />
            <p className="text-white/80 text-lg font-light leading-relaxed max-w-sm">
              Des créations graphiques réalisées dans le studio Blue Cinis pour soutenir leurs expositions et collaborations.
            </p>
          </m.div>
        </div>

        {/* Espace Central laissé vide pour les POSTERS 3D qui flottent ici */}
        <div className="md:col-span-4 h-[50vh] pointer-events-none"></div>

        {/* Colonne Droite : Détails Techniques */}
        <div className="md:col-span-3 flex flex-col justify-end h-full mix-blend-difference pointer-events-auto">
          <div className="glass-panel-dark p-8 rounded-xl border border-white/10 bg-black/60 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <span className="font-mono text-xs text-white">01</span>
              </div>
              <div className="text-xs font-mono text-white/50 uppercase tracking-widest">
                Série<br />Numérotée
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Chaque affiche est imprimée en petite série, numérotée et disponible lors des rendez-vous atelier.
            </p>
            <Link href="/galerie" className="mt-8 text-xs font-mono text-white border-b border-blue-500 pb-1 hover:text-blue-400 transition-colors inline-block">
              VOIR LE CATALOGUE →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
