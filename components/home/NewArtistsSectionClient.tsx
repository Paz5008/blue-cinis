"use client";

import { useState, useRef, useEffect } from "react";
import { m, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface NewArtist {
  id: string;
  name: string;
  slug: string | null;
  portrait: string | null;
  type: string;
  location: string;
  bio: string;
  artworkCount: number;
  works: string[];
}

interface NewArtistsSectionClientProps {
  artists: NewArtist[];
}

export default function NewArtistsSectionClient({ artists }: NewArtistsSectionClientProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [followedArtists, setFollowedArtists] = useState<Set<string>>(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const handleFollow = async (artistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle follow state optimistically
    setFollowedArtists(prev => {
      const next = new Set(prev);
      if (next.has(artistId)) {
        next.delete(artistId);
      } else {
        next.add(artistId);
      }
      return next;
    });

    // TODO: Integrate with alerts API
    // await fetch('/api/alerts', { method: 'POST', body: JSON.stringify({ artistId }) });
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen py-32 z-20 overflow-hidden pointer-events-auto">

      {/* Background gradient */}
      <m.div
        className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#080808] to-[#030303]"
        style={prefersReducedMotion ? {} : { y: bgY }}
        aria-hidden="true"
      />

      {/* Section header */}
      <div className="container mx-auto px-6 relative z-10 mb-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <m.span
              className="inline-flex items-center gap-3 text-blue-400 font-mono text-xs tracking-[0.4em] uppercase mb-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="w-12 h-[1px] bg-blue-400" aria-hidden="true" />
              Emerging Talents
            </m.span>

            <m.h2
              className="text-5xl md:text-7xl font-grand-slang text-white leading-[0.95]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              NEW
              <br />
              <span className="text-white/30">ARTISTS</span>
            </m.h2>
          </div>

          <m.p
            className="text-white/50 max-w-md text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Découvrez les talents émergents qui redéfinissent l'art contemporain
          </m.p>
        </div>
      </div>

      {/* Artists Grid */}
      <div
        className="container mx-auto px-6 relative z-10"
        role="list"
        aria-label="Artistes émergents"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {artists.map((artist, index) => {
            const isHovered = hoveredId === artist.id;
            const isFollowed = followedArtists.has(artist.id);
            const artistUrl = artist.slug ? `/artistes/${artist.slug}` : `/artistes/${artist.id}`;

            return (
              <m.article
                key={artist.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1 }}
                role="listitem"
              >
                <Link
                  href={artistUrl}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onMouseEnter={() => setHoveredId(artist.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(artist.id)}
                  onBlur={() => setHoveredId(null)}
                >
                  {/* Background - Artist Portrait */}
                  <m.div
                    className="absolute inset-0"
                    animate={{
                      scale: isHovered && !prefersReducedMotion ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <Image
                      src={artist.portrait || "/uploads/artwork-portrait-01.png"}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      loading="lazy"
                    />
                  </m.div>

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <m.div
                    className="absolute inset-0 bg-blue-900/30"
                    animate={{ opacity: isHovered ? 0.4 : 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Follow Button */}
                  <button
                    onClick={(e) => handleFollow(artist.id, e)}
                    className={`absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300
                                            ${isFollowed
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20'
                      }
                                            focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
                                            opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100`}
                    aria-label={isFollowed ? `Ne plus suivre ${artist.name}` : `Suivre ${artist.name}`}
                    aria-pressed={isFollowed}
                  >
                    {isFollowed ? "Suivi ✓" : "Suivre"}
                  </button>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Type badge */}
                    <span className="inline-block text-blue-400 text-xs font-mono tracking-widest uppercase mb-3">
                      {artist.type}
                    </span>

                    {/* Name */}
                    <h3 className="text-2xl md:text-3xl font-grand-slang text-white leading-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {artist.name}
                    </h3>

                    {/* Artwork Count (replacing fake followers) */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-white/60 text-sm font-mono">
                        {artist.artworkCount} œuvre{artist.artworkCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-white/40 text-sm">{artist.location}</span>
                    </div>

                    {/* Bio preview */}
                    <AnimatePresence>
                      {isHovered && artist.bio && (
                        <m.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.2 }}
                          className="text-white/50 text-sm line-clamp-2 mb-4"
                        >
                          {artist.bio}
                        </m.p>
                      )}
                    </AnimatePresence>

                    {/* Portfolio preview - show artwork thumbnails */}
                    <AnimatePresence>
                      {isHovered && artist.works.length > 0 && (
                        <m.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                          className="flex gap-2"
                          aria-label="Aperçu des œuvres"
                        >
                          {artist.works.slice(0, 3).map((work, i) => (
                            <m.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10"
                            >
                              <Image
                                src={work}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            </m.div>
                          ))}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Border glow on hover */}
                  <m.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      boxShadow: isHovered
                        ? "inset 0 0 0 1px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.15)"
                        : "inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </m.article>
            );
          })}
        </div>

        {/* View All CTA */}
        <m.div
          className="flex justify-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/artistes"
            className="group inline-flex items-center gap-4 text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
          >
            <span className="text-sm tracking-wider uppercase">Découvrir tous les artistes</span>
            <m.div
              className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all"
              whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 45 }}
            >
              <span className="text-lg">→</span>
            </m.div>
          </Link>
        </m.div>
      </div>
    </section>
  );
}
