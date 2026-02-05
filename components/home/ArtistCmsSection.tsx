"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { Layers, Image as ImageIcon, Type, Grid3X3, Palette, CheckCircle2 } from "lucide-react";

// Sparkle particle component for success state
function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <m.div
      className="absolute w-1 h-1 bg-green-400 rounded-full"
      style={{ left: `${50 + x}%`, top: `${50 + y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        y: [0, y * 2],
        x: [0, x * 0.5],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
      }}
    />
  );
}

// Pre-computed sparkle positions (deterministic for SSR)
const SPARKLE_POSITIONS = [
  { x: -20, y: -30, delay: 0 },
  { x: 25, y: -25, delay: 0.2 },
  { x: -35, y: 10, delay: 0.4 },
  { x: 30, y: 15, delay: 0.1 },
  { x: -10, y: -40, delay: 0.3 },
  { x: 40, y: -10, delay: 0.5 },
  { x: -25, y: 25, delay: 0.15 },
  { x: 15, y: 35, delay: 0.25 },
];

export default function ArtistCmsSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // ============================================
  // PHASE 1: Sidebar Entry (0-25%)
  // ============================================
  const sidebarX = useTransform(scrollYProgress, [0.05, 0.2], [-80, 0]);
  const sidebarOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);

  // Staggered tool icons
  const tool1Opacity = useTransform(scrollYProgress, [0.1, 0.15], [0, 1]);
  const tool2Opacity = useTransform(scrollYProgress, [0.13, 0.18], [0, 1]);
  const tool3Opacity = useTransform(scrollYProgress, [0.16, 0.21], [0, 1]);
  const paletteOpacity = useTransform(scrollYProgress, [0.19, 0.24], [0, 1]);

  // ============================================
  // PHASE 2: Block Placement (25-55%)
  // ============================================

  // Image Block - flies from sidebar to hero section
  const imageBlockX = useTransform(scrollYProgress, [0.25, 0.4], [-60, 0]);
  const imageBlockY = useTransform(scrollYProgress, [0.25, 0.4], [50, 0]);
  const imageBlockScale = useTransform(scrollYProgress, [0.25, 0.4], [0.6, 1]);
  const imageBlockOpacity = useTransform(scrollYProgress, [0.25, 0.35], [0, 1]);

  // Text Block - appears below image with typing effect
  const textBlockY = useTransform(scrollYProgress, [0.35, 0.48], [30, 0]);
  const textBlockOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);
  const typingProgress = useTransform(scrollYProgress, [0.4, 0.55], [0, 100]);

  // Gallery Block - grid appears on the side
  const galleryScale = useTransform(scrollYProgress, [0.45, 0.55], [0.8, 1]);
  const galleryOpacity = useTransform(scrollYProgress, [0.45, 0.52], [0, 1]);

  // ============================================
  // PHASE 3: Color Theme Transition (55-75%)
  // ============================================
  const paletteGlow = useTransform(scrollYProgress, [0.55, 0.6], [0, 1]);
  const colorTransition = useTransform(scrollYProgress, [0.58, 0.72], [0, 1]);

  // ============================================
  // PHASE 4: Sync Progress (75-90%)
  // ============================================
  const progressBarWidth = useTransform(scrollYProgress, [0.72, 0.88], [0, 100]);
  const syncTextOpacity = useTransform(scrollYProgress, [0.72, 0.78], [0, 1]);

  // ============================================
  // PHASE 5: Success State (90-100%)
  // ============================================
  const successOverlayOpacity = useTransform(scrollYProgress, [0.88, 0.92], [0, 1]);
  const successScale = useTransform(scrollYProgress, [0.9, 0.96], [0.8, 1]);
  const sparklesOpacity = useTransform(scrollYProgress, [0.92, 0.95], [0, 1]);

  return (
    <section ref={containerRef} className="relative h-[250vh] w-full z-20 bg-[#080808]">

      {/* Container Sticky */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-16 md:gap-24">

          {/* COLONNE GAUCHE : Texte Manifesto */}
          <div className="md:w-1/2 relative z-10 mix-blend-difference">
            <span className="text-blue-500 font-mono text-xs tracking-[0.3em] uppercase mb-6 block">
              Digital Atelier
            </span>
            <h2 className="text-5xl md:text-7xl font-grand-slang text-white leading-[1.1] mb-8">
              Sculptez<br />
              Votre Univers
            </h2>
            <p className="text-white/70 text-lg font-light leading-relaxed max-w-md">
              Paramétrez votre page artiste en quelques minutes, sans code.
              Des modules prêts à publier conçus pour l'art.
            </p>

            <div className="mt-12 flex flex-col gap-4">
              {['Glissez vos visuels', 'Choisissez vos blocs', 'Personnalisez vos couleurs', 'Synchronisez en temps réel'].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="font-mono text-sm uppercase tracking-wider">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COLONNE DROITE : L'Interface Abstraite (Le "Builder") */}
          <div className="md:w-1/2 w-full h-[65vh] relative">

            {/* 1. LA TOILE (CANVAS) */}
            <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">

              {/* Header Fake Browser */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
                <div className="ml-auto flex items-center gap-3">
                  <m.div
                    style={{ opacity: syncTextOpacity }}
                    className="text-[10px] font-mono text-blue-400 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    SYNCING...
                  </m.div>
                  <div className="text-[10px] font-mono text-white/20">EDIT MODE</div>
                </div>
              </div>

              <div className="p-6 flex h-full">

                {/* 2. LA SIDEBAR (Outils) avec stagger */}
                <m.div
                  style={{ x: sidebarX, opacity: sidebarOpacity }}
                  className="w-14 border-r border-white/5 flex flex-col gap-4 items-center pt-4 pr-2"
                >
                  <m.div style={{ opacity: tool1Opacity }} className="p-2 rounded-lg bg-blue-500/20 text-blue-400 transition-all hover:bg-blue-500/30">
                    <ImageIcon size={18} />
                  </m.div>
                  <m.div style={{ opacity: tool2Opacity }} className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition-all">
                    <Type size={18} />
                  </m.div>
                  <m.div style={{ opacity: tool3Opacity }} className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition-all">
                    <Grid3X3 size={18} />
                  </m.div>
                  <m.div style={{ opacity: tool3Opacity }} className="p-2 rounded-lg hover:bg-white/5 text-white/40 transition-all">
                    <Layers size={18} />
                  </m.div>

                  {/* Separator */}
                  <div className="w-6 h-px bg-white/10 my-2" />

                  {/* Color Palette Selector */}
                  <m.div
                    style={{ opacity: paletteOpacity }}
                    className="relative"
                  >
                    <m.div
                      style={{ opacity: paletteGlow }}
                      className="absolute -inset-2 bg-purple-500/30 rounded-xl blur-md"
                    />
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 relative">
                      <Palette size={18} />
                    </div>
                  </m.div>

                  {/* Mini color swatches */}
                  <m.div
                    style={{ opacity: paletteOpacity }}
                    className="flex flex-col gap-1.5 mt-2"
                  >
                    <m.div
                      style={{ scale: useTransform(colorTransition, [0, 1], [1, 1.3]) }}
                      className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border border-white/20"
                    />
                    <div className="w-4 h-4 rounded-full bg-white/20 border border-white/10" />
                    <div className="w-4 h-4 rounded-full bg-amber-500/50 border border-white/10" />
                  </m.div>
                </m.div>

                {/* 3. ZONE DE CONTENU (Drop Zone) */}
                <div className="flex-1 pl-6 relative">

                  {/* HERO SECTION - Image Block */}
                  <m.div
                    style={{
                      x: imageBlockX,
                      y: imageBlockY,
                      scale: imageBlockScale,
                      opacity: imageBlockOpacity,
                    }}
                    className="relative"
                  >
                    <m.div
                      style={{
                        borderColor: useTransform(colorTransition, [0, 1], ["rgba(255,255,255,0.1)", "rgba(139,92,246,0.5)"]),
                        backgroundColor: useTransform(colorTransition, [0, 1], ["rgba(255,255,255,0.03)", "rgba(139,92,246,0.1)"]),
                      }}
                      className="w-full h-28 rounded-lg border-2 flex items-center justify-center overflow-hidden"
                    >
                      {/* Fake image preview */}
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                        <m.div
                          style={{ opacity: useTransform(colorTransition, [0, 1], [0.3, 1]) }}
                        >
                          <ImageIcon className="text-white/40" size={32} />
                        </m.div>
                        <m.span
                          style={{ opacity: colorTransition }}
                          className="absolute text-white/60 font-mono text-xs"
                        >
                          hero-image.webp
                        </m.span>
                      </div>
                    </m.div>
                  </m.div>

                  {/* TEXT BLOCK with typing effect */}
                  <m.div
                    style={{ y: textBlockY, opacity: textBlockOpacity }}
                    className="mt-4"
                  >
                    <m.div
                      style={{
                        borderColor: useTransform(colorTransition, [0, 1], ["rgba(255,255,255,0.05)", "rgba(59,130,246,0.3)"]),
                      }}
                      className="p-4 rounded-lg border bg-white/[0.02]"
                    >
                      <m.div
                        style={{ width: useTransform(typingProgress, (v) => `${Math.min(v, 80)}%`) }}
                        className="h-3 bg-white/20 rounded mb-2 overflow-hidden"
                      />
                      <m.div
                        style={{ width: useTransform(typingProgress, (v) => `${Math.min(v * 0.6, 50)}%`) }}
                        className="h-2 bg-white/10 rounded"
                      />
                    </m.div>
                  </m.div>

                  {/* GALLERY GRID */}
                  <m.div
                    style={{ scale: galleryScale, opacity: galleryOpacity }}
                    className="mt-4 grid grid-cols-3 gap-2"
                  >
                    <m.div
                      style={{
                        backgroundColor: useTransform(colorTransition, [0, 1], ["rgba(255,255,255,0.05)", "rgba(139,92,246,0.1)"]),
                      }}
                      className="h-16 rounded-lg border border-white/5"
                    />
                    <m.div
                      style={{
                        backgroundColor: useTransform(colorTransition, [0, 1], ["rgba(255,255,255,0.05)", "rgba(139,92,246,0.15)"]),
                      }}
                      className="h-16 rounded-lg border border-white/5"
                    />
                    <m.div
                      style={{
                        backgroundColor: useTransform(colorTransition, [0, 1], ["rgba(255,255,255,0.05)", "rgba(139,92,246,0.2)"]),
                      }}
                      className="h-16 rounded-lg border border-white/5"
                    />
                  </m.div>

                  {/* PROGRESS BAR */}
                  <m.div
                    style={{ opacity: syncTextOpacity }}
                    className="absolute bottom-4 left-0 right-0"
                  >
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <m.div
                        style={{ width: useTransform(progressBarWidth, (v) => `${v}%`) }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </m.div>

                  {/* 5. OVERLAY DE SUCCÈS */}
                  <m.div
                    style={{ opacity: successOverlayOpacity }}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg"
                  >
                    {/* Sparkles */}
                    <m.div style={{ opacity: sparklesOpacity }} className="absolute inset-0">
                      {SPARKLE_POSITIONS.map((sparkle, i) => (
                        <Sparkle key={i} {...sparkle} />
                      ))}
                    </m.div>

                    <m.div
                      style={{ scale: successScale }}
                      className="flex flex-col items-center gap-4 relative z-10"
                    >
                      <m.div
                        className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50"
                        style={{
                          boxShadow: useTransform(sparklesOpacity, (v) => `0 0 ${40 * v}px rgba(34,197,94,${0.4 * v})`),
                        }}
                      >
                        <CheckCircle2 className="text-green-400" size={32} />
                      </m.div>
                      <div className="text-center">
                        <h3 className="text-white font-grand-slang text-2xl">Published</h3>
                        <p className="text-white/40 font-mono text-xs mt-1">SYNC COMPLETE</p>
                      </div>
                    </m.div>
                  </m.div>

                </div>
              </div>
            </div>

            {/* Arrière-plan décoratif (Effet Glow Design) */}
            <m.div
              style={{ opacity: useTransform(colorTransition, [0, 1], [0.15, 0.35]) }}
              className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-2xl -z-10"
            />

          </div>

        </div>
      </div>
    </section>
  );
}
