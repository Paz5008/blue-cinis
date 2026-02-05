"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, m } from "framer-motion";

const SERVICE_STEPS = [
  {
    id: "01",
    title: "STRATÉGIE & VISION",
    tag: "RENCONTRE",
    description: "Tout commence par une vision. Blue Cinis audite vos espaces et définit une ligne directrice cohérente pour transformer vos murs en actifs culturels."
  },
  {
    id: "02",
    title: "DIALOGUE ARTISTIQUE",
    tag: "SOURCING",
    description: "Faire dialoguer vos espaces avec des artistes émergents ou confirmés. Nous sélectionnons des œuvres qui résonnent avec votre identité, loin des catalogues standardisés."
  },
  {
    id: "03",
    title: "L'ART DE L'ACCROCHAGE",
    tag: "INSTALLATION",
    description: "De la logistique à la lumière, nous orchestrons un parcours fluide jusqu'au point final : l'installation parfaite qui révèle la puissance de l'œuvre."
  }
];

export default function ServicesSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[300vh] w-full z-20">

      {/* Conteneur Sticky - Fond Sombre pour Lisibilité Maximale */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center p-4 md:p-24 bg-transparent">

        <div className="relative w-full max-w-7xl flex flex-col lg:flex-row gap-16 items-start">

          {/* Bloc Titre Fixe (Gauche) */}
          <div className="lg:w-1/3 relative z-10">
            <div className="glass-panel-dark p-10 rounded-2xl border border-white/10 bg-[#050505]/90 backdrop-blur-2xl shadow-2xl">
              <span className="text-xs font-mono text-blue-500 tracking-[0.3em] uppercase mb-6 block">
                Pour Collectionneurs & Entreprises
              </span>
              <h2 className="text-5xl md:text-6xl font-grand-slang text-white leading-none mb-4">
                BLUE<br />CINIS
              </h2>
              <div className="h-[1px] w-24 bg-blue-500 mt-6 mb-6 box-shadow-[0_0_10px_blue]"></div>
              <p className="text-white/60 text-lg font-light leading-relaxed">
                "De la première rencontre à l’accrochage, nous orchestrons un parcours fluide pour faire dialoguer vos espaces."
              </p>
            </div>
          </div>

          {/* Liste Défilante (Droite) */}
          <div className="lg:w-2/3 flex flex-col gap-[40vh] pt-12 lg:pt-0">
            {SERVICE_STEPS.map((step, index) => (
              <ServiceStepItem
                key={step.id}
                step={step}
                index={index}
                total={SERVICE_STEPS.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function ServiceStepItem({
  step,
  index,
  total,
  scrollYProgress
}: {
  step: typeof SERVICE_STEPS[0],
  index: number,
  total: number,
  scrollYProgress: any
}) {
  // Effet d'apparition au scroll ("Lampe Torche")
  const start = index / total;
  const end = (index + 1) / total;
  const mid = (start + end) / 2;

  const opacity = useTransform(scrollYProgress,
    [start, mid, end],
    [0.1, 1, 0.1]
  );

  const x = useTransform(scrollYProgress,
    [start, mid, end],
    [50, 0, -50]
  );

  return (
    <m.div
      style={{ opacity, x }}
      className="flex flex-col gap-4 pl-8 border-l-2 border-white/10 relative"
    >
      {/* Barre active lumineuse */}
      <m.div
        style={{ opacity }}
        className="absolute left-[-2px] top-0 h-full w-[2px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"
      />

      <div className="flex items-center gap-4">
        <span className="font-mono text-blue-400 text-sm tracking-widest">
          {step.id} — {step.tag}
        </span>
      </div>

      <h3 className="text-4xl md:text-6xl font-grand-slang text-white">
        {step.title}
      </h3>

      <p className="text-xl text-gray-300 font-light leading-relaxed max-w-xl">
        {step.description}
      </p>
    </m.div>
  );
}
