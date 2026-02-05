"use client";

import { useRef, useEffect, useState } from "react";

const TESTIMONIALS = [
  {
    id: 1,
    role: "COLLECTIONNEUR",
    text: "Une approche qui transcende la simple acquisition. Avec Blue Cinis, j'ai redécouvert ma propre collection.",
    author: "Alexandre V.",
    location: "Paris, France"
  },
  {
    id: 2,
    role: "ARTISTE PARTENAIRE",
    text: "Rarement une galerie n'a pris autant soin de la narration autour de l'œuvre. Elle transmet des fragments d'âme.",
    author: "Elena R.",
    location: "Berlin, Allemagne"
  },
  {
    id: 3,
    role: "ENTREPRISE",
    text: "L'installation dans notre siège social a changé la dynamique de nos équipes. C'est le cœur de notre identité.",
    author: "Groupe Kering",
    location: "Département Innovation"
  },
  {
    id: 4,
    role: "COLLECTIONNEUR",
    text: "La logistique 'Gants Blancs' n'est pas un vain mot. De la sélection à l'accrochage, la rigueur est absolue.",
    author: "Marcus T.",
    location: "Londres, UK"
  },
  {
    id: 5,
    role: "CURATEUR",
    text: "Une sélection d'une précision chirurgicale. Chaque œuvre raconte une histoire qui résonne avec l'espace.",
    author: "Sarah L.",
    location: "New York, USA"
  }
];

export default function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Double the list for infinite loop
  const infiniteTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  // CSS animation duration in seconds (slower for reading text)
  const animationDuration = infiniteTestimonials.length * 8;

  return (
    <section className="relative w-full z-20 py-32 bg-transparent overflow-hidden">

      {/* Header */}
      <div className="container mx-auto px-6 mb-20 text-center">
        <h2 className="font-grand-slang text-5xl md:text-7xl text-white mb-6">
          Echos
        </h2>
        <p className="text-white/60 font-mono text-sm tracking-wide max-w-lg mx-auto leading-relaxed uppercase">
          La résonance de nos collaborations
        </p>
      </div>

      {/* Marquee Track - Pure CSS Animation */}
      <div
        className="w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-8 w-max px-6"
          style={{
            animation: `marquee ${animationDuration}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {infiniteTestimonials.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative w-[80vw] md:w-[400px] h-[300px] md:h-[350px] flex-shrink-0 p-8 rounded-xl border border-white/10 bg-[#050505]/80 backdrop-blur-md flex flex-col justify-between group hover:border-white/30 transition-colors"
            >
              {/* Top: Role */}
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" />
                <span className="text-blue-500/80 font-mono text-xs tracking-widest uppercase">
                  {item.role}
                </span>
              </div>

              {/* Middle: Quote */}
              <blockquote className="font-grand-slang text-2xl text-white/90 leading-relaxed">
                "{item.text}"
              </blockquote>

              {/* Bottom: Author */}
              <div className="border-t border-white/10 pt-6 mt-4">
                <cite className="text-white font-medium not-italic text-base block">
                  {item.author}
                </cite>
                <span className="text-white/40 font-mono text-xs uppercase tracking-wider block mt-1">
                  {item.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[400px] bg-blue-900/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* CSS Keyframes for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

    </section>
  );
}
