"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { FeaturedArtwork } from "@/lib/data/artworks";
import { cn } from "@/lib/utils";

type HeroProps = {
  artworks: FeaturedArtwork[];
};

const AUTOPLAY_INTERVAL = 6000;

export default function Hero({ artworks }: HeroProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedArtwork = artworks[selectedIndex];

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % artworks.length);
  }, [artworks.length]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + artworks.length) % artworks.length);
  }, [artworks.length]);

  useEffect(() => {
    timerRef.current = setInterval(handleNext, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleNext]);

  // Auto-scroll carousel to keep selected item in view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedButton = container.children[selectedIndex] as HTMLElement;

      if (selectedButton) {
        const containerWidth = container.offsetWidth;
        const buttonLeft = selectedButton.offsetLeft;
        const buttonWidth = selectedButton.offsetWidth;

        // Calculate scroll position to center the button
        const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  if (!artworks || artworks.length === 0) return null;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-night text-white">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[40%_60%]">
        {/* Left Column */}
        <div className="relative flex flex-col justify-between p-8 lg:p-12 xl:p-16 z-10 bg-night/95 lg:bg-night">
          {/* Navigation */}
          <nav className="flex gap-6 text-sm font-medium uppercase tracking-wider text-white/60">
            <Link href="/" className="text-white hover:text-accent transition-colors">Home</Link>
            <Link href="/galerie" className="hover:text-white transition-colors">Products</Link>
            <Link href="/a-propos" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>

          {/* Content */}
          <div className="flex flex-col gap-8 mt-auto mb-auto">
            {/* Miniatures Carousel */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide mask-linear-fade"
            >
              {artworks.map((artwork, index) => (
                <button
                  key={artwork.id}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-500 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent",
                    selectedIndex === index ? "ring-2 ring-accent scale-105 shadow-lg opacity-100" : "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                  )}
                  aria-label={`View ${artwork.title}`}
                  aria-current={selectedIndex === index}
                >
                  <Image
                    src={artwork.imageUrl || "/placeholder.jpg"}
                    alt={artwork.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {selectedIndex === index && (
                    <m.div
                      className="absolute bottom-0 left-0 h-1 bg-accent z-10"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4 min-h-[200px]">
              <AnimatePresence mode="wait">
                <m.div
                  key={selectedArtwork?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <h1 className="font-grand-slang text-5xl lg:text-7xl leading-tight">
                    <span className="block text-white/40 text-3xl lg:text-4xl mb-2">Blue Cinis</span>
                    {selectedArtwork?.title}
                  </h1>
                  <p className="max-w-md text-lg text-white/70 mt-4">
                    {selectedArtwork?.description || `Discover the unique work of ${selectedArtwork?.artistName}.`}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedArtwork?.artistName && (
                      <span className="px-3 py-1 rounded-full border border-white/20 text-xs uppercase tracking-widest text-white/60">
                        {selectedArtwork.artistName}
                      </span>
                    )}
                    {selectedArtwork?.year && (
                      <span className="px-3 py-1 rounded-full border border-white/20 text-xs uppercase tracking-widest text-white/60">
                        {selectedArtwork.year}
                      </span>
                    )}
                  </div>
                </m.div>
              </AnimatePresence>
            </div>

            <Link
              href={`/galerie/${selectedArtwork?.id}`}
              className="group inline-flex items-center gap-2 text-accent hover:text-white transition-colors uppercase tracking-widest font-semibold mt-4"
            >
              Voir l'œuvre
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>
        </div>

        {/* Right Column - Main Visual */}
        <div className="relative h-[50vh] lg:h-full w-full overflow-hidden bg-night-light">
          <AnimatePresence mode="wait">
            <m.div
              key={selectedArtwork?.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 0.9, 0.39, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={selectedArtwork?.imageUrl || "/placeholder.jpg"}
                alt={selectedArtwork?.title || "Artwork"}
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
            </m.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="absolute bottom-8 right-8 flex gap-2 z-20">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors text-white"
              aria-label="Previous artwork"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors text-white"
              aria-label="Next artwork"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile/Tablet Overlay Info (optional, if needed for smaller screens where left col is hidden or stacked) */}
          <div className="absolute bottom-8 left-8 lg:hidden z-20">
            <p className="text-white font-grand-slang text-2xl">{selectedArtwork?.title}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

