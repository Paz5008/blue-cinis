"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { m, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FeaturedArtwork } from "@/lib/data/artworks";
import { buildArtworkPath } from "@/lib/artworkSlug";
import { Eye, X } from "lucide-react";

// Format price for display
function formatPrice(price: number | null | undefined, currency: string = "EUR"): string {
  if (!price) return "";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / 100);
}

// Quick View Modal
function QuickViewModal({
  artwork,
  isOpen,
  onClose
}: {
  artwork: FeaturedArtwork | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!artwork) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view: ${artwork.title}`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

          {/* Content */}
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative max-w-4xl w-full max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close quick view"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="relative aspect-square md:aspect-auto md:w-1/2 md:h-[70vh]">
                <Image
                  src={artwork.imageUrl || "/placeholder.jpg"}
                  alt={artwork.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Info */}
              <div className="p-8 md:w-1/2 flex flex-col justify-between">
                <div>
                  <span className="text-blue-400 font-mono text-xs tracking-widest uppercase">
                    {artwork.artistName}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-grand-slang text-white mt-2 mb-4">
                    {artwork.title}
                  </h2>
                  {artwork.description && (
                    <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
                      {artwork.description}
                    </p>
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  {/* Price */}
                  {artwork.price && (
                    <div className="text-2xl font-grand-slang text-white">
                      {formatPrice(artwork.price)}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={buildArtworkPath({
                      id: artwork.id,
                      title: artwork.title
                    })}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black font-medium text-sm rounded-full hover:bg-white/90 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    View Full Details
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default function ArtworksSectionClient({ artworks }: { artworks: FeaturedArtwork[] }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [quickViewArtwork, setQuickViewArtwork] = useState<FeaturedArtwork | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  // Smooth spring physics for luxurious feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Horizontal movement
  const x = useTransform(smoothProgress, [0, 1], ["15%", "-85%"]);

  // Parallax title movement
  const titleX = useTransform(smoothProgress, [0, 0.5], ["0%", "-20%"]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.15, 0.8, 1], [0, 1, 1, 0]);

  const handleQuickView = useCallback((artwork: FeaturedArtwork, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewArtwork(artwork);
  }, []);

  return (
    <>
      <section ref={targetRef} className="relative h-[280vh] z-20 bg-[#030303]" aria-label="Featured artworks">

        {/* Ambient glow effects */}
        <div className="fixed top-1/2 left-1/4 w-[600px] h-[600px] bg-blue-900/5 blur-[200px] rounded-full pointer-events-none" aria-hidden="true" />
        <div className="fixed top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-900/5 blur-[150px] rounded-full pointer-events-none" aria-hidden="true" />

        {/* Sticky viewport */}
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">

          {/* Floating section title */}
          <m.div
            className="absolute top-16 left-8 md:left-16 z-30 pointer-events-none"
            style={prefersReducedMotion ? {} : { x: titleX, opacity: titleOpacity }}
          >
            <span className="text-blue-400 font-mono text-xs tracking-[0.4em] uppercase block mb-3">
              Collection
            </span>
            <h2 className="font-grand-slang text-5xl md:text-7xl text-white/90 leading-[0.9]">
              MASTER
              <br />
              <span className="text-white/40">PIECES</span>
            </h2>
            <div className="h-[2px] w-16 bg-gradient-to-r from-blue-500 to-transparent mt-6" />
          </m.div>

          {/* Progress indicator */}
          <div className="absolute bottom-16 left-8 md:left-16 z-30 flex items-center gap-4">
            <m.div
              className="h-[2px] bg-white/40 origin-left"
              style={{
                width: 120,
                scaleX: smoothProgress
              }}
            />
            <span className="text-white/40 font-mono text-xs">
              scroll →
            </span>
          </div>

          {/* Horizontal rail */}
          <m.div
            style={prefersReducedMotion ? {} : { x }}
            className="flex gap-8 md:gap-16 pl-32 md:pl-64 items-center"
          >
            {artworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                index={index}
                total={artworks.length}
                onQuickView={handleQuickView}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}

            {/* Archive CTA card with glow border */}
            <Link
              href="/galerie"
              className="group relative h-[55vh] w-[35vh] md:h-[65vh] md:w-[40vh] flex flex-col items-center justify-center rounded-lg transition-all duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="View full gallery archive"
            >
              {/* Glow border effect */}
              <div className="absolute inset-0 rounded-lg border border-white/10 group-hover:border-blue-500/50 transition-colors duration-500" />
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]" />

              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <span className="font-grand-slang text-3xl md:text-4xl text-white/30 group-hover:text-white/60 transition-colors duration-500 text-center leading-tight">
                VIEW
                <br />
                <span className="text-5xl md:text-6xl">ARCHIVE</span>
              </span>
              <m.div
                className="absolute bottom-12 w-12 h-12 border border-white/20 rounded-full flex items-center justify-center group-hover:border-blue-500/50 group-hover:scale-110 transition-all duration-500"
                whileHover={prefersReducedMotion ? {} : { rotate: 45 }}
              >
                <span className="text-white/50 text-2xl group-hover:text-white transition-colors">→</span>
              </m.div>
            </Link>
          </m.div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        artwork={quickViewArtwork}
        isOpen={!!quickViewArtwork}
        onClose={() => setQuickViewArtwork(null)}
      />
    </>
  );
}

function ArtworkCard({
  artwork,
  index,
  total,
  onQuickView,
  prefersReducedMotion
}: {
  artwork: FeaturedArtwork;
  index: number;
  total: number;
  onQuickView: (artwork: FeaturedArtwork, e: React.MouseEvent) => void;
  prefersReducedMotion: boolean;
}) {
  const formattedIndex = String(index + 1).padStart(2, '0');
  const artworkPath = buildArtworkPath({
    id: artwork.id,
    title: artwork.title
  });

  return (
    <div className="group relative block">
      {/* Card container */}
      <Link href={artworkPath} className="block relative h-[55vh] w-[38vh] md:h-[68vh] md:w-[48vh] overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">

        {/* Index number - large decorative */}
        <div className="absolute -top-4 -left-4 z-20 pointer-events-none" aria-hidden="true">
          <span className="font-mono text-8xl md:text-9xl font-bold text-white/[0.03] group-hover:text-white/[0.08] transition-colors duration-700">
            {formattedIndex}
          </span>
        </div>

        {/* Main image container with clip animation */}
        <div className="absolute inset-4 md:inset-6 overflow-hidden bg-neutral-900 rounded-lg">
          <m.div
            className="absolute inset-0"
            whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          >
            <Image
              src={artwork.imageUrl || "/placeholder.jpg"}
              alt={artwork.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80vw, 50vh"
              loading="lazy"
            />
            {/* Cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </m.div>

          {/* Hover reveal border */}
          <m.div
            className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-colors duration-500 rounded-lg"
            initial={false}
          />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-8 left-8 right-8 z-10">
          {/* Artist tag */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-[1px] w-8 bg-blue-400" />
            <span className="text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
              {artwork.artistName}
            </span>
          </div>

          {/* Title with reveal animation */}
          <h3 className="font-grand-slang text-2xl md:text-3xl text-white leading-tight mb-2 group-hover:translate-x-2 transition-transform duration-500">
            {artwork.title}
          </h3>

          {/* Price - shown on hover */}
          {artwork.price && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white/80 font-mono text-lg">
                {formatPrice(artwork.price)}
              </span>
            </div>
          )}

          {/* CTA line */}
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 mt-3">
            <span className="text-white/60 text-sm tracking-wide">Explore</span>
            <m.div
              className="h-[1px] bg-white/40 origin-left"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              style={{ width: 40 }}
            />
            <span className="text-white text-lg">→</span>
          </div>
        </div>

        {/* Index indicator bottom right */}
        <div className="absolute bottom-8 right-8 font-mono text-xs text-white/30">
          {formattedIndex}/{String(total).padStart(2, '0')}
        </div>
      </Link>

      {/* Quick View Button */}
      <button
        onClick={(e) => onQuickView(artwork, e)}
        className="absolute top-8 right-8 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-white/20 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white"
        aria-label={`Quick view: ${artwork.title}`}
      >
        <Eye className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
