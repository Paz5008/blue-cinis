"use client";

import { useRef, useEffect, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import ContactForm from "@/components/shared/ContactForm";
import { MapPin, Phone, Mail, MessageCircle, Clock, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ContactCopy } from "./copy";

const ICON_MAP: Record<string, LucideIcon> = {
  location: MapPin,
  phone: Phone,
  email: Mail,
  chat: MessageCircle,
};

// Theme-aware colors using CSS custom properties
const FLOATING_SHAPES = [
  { size: "w-[600px] h-[600px]", color: "bg-[hsl(220,60%,20%,0.2)]", position: "top-[-10%] left-[-10%]", delay: 0 },
  { size: "w-[400px] h-[400px]", color: "bg-[hsl(270,50%,25%,0.15)]", position: "bottom-[20%] right-[-5%]", delay: 2 },
  { size: "w-[300px] h-[300px]", color: "bg-[hsl(35,60%,25%,0.1)]", position: "top-[60%] left-[10%]", delay: 4 },
] as const;

function FloatingShape({
  className,
  delay = 0,
  prefersReducedMotion = false
}: {
  className?: string;
  delay?: number;
  prefersReducedMotion?: boolean;
}) {
  // Skip animations entirely when reduced motion is preferred
  if (prefersReducedMotion) {
    return (
      <div
        className={`absolute rounded-full blur-3xl pointer-events-none opacity-60 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <m.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        y: [0, -15, 0], // Reduced amplitude
        scale: [1, 1.03, 1], // More subtle scaling
      }}
      transition={{
        duration: 10, // Slower, more elegant
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    />
  );
}

export default function ContactPageClient({ copy }: { copy: ContactCopy }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  // Reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lazy load map with IntersectionObserver
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.3]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen text-white overflow-hidden"
      style={{ backgroundColor: "var(--background, #030303)" }}
    >
      {/* Ambient Background Effects - Respects reduced motion */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        {FLOATING_SHAPES.map((shape, i) => (
          <FloatingShape
            key={i}
            className={`${shape.size} ${shape.color} ${shape.position}`}
            delay={shape.delay}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* Hero Section */}
      <m.section
        style={prefersReducedMotion ? {} : { opacity: heroOpacity, y: heroY }}
        className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 pt-32 pb-16"
      >
        {/* Decorative line */}
        <m.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
          aria-hidden="true"
        />

        <m.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-3 text-blue-400 font-mono text-xs tracking-[0.4em] uppercase mb-8"
        >
          <span className="w-8 h-[1px] bg-blue-400" aria-hidden="true" />
          Blue Cinis
          <span className="w-8 h-[1px] bg-blue-400" aria-hidden="true" />
        </m.span>

        <m.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-grand-slang text-center leading-[0.95] mb-6"
        >
          {copy.heroTitle}
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl text-center max-w-xl"
        >
          {copy.heroSubtitle}
        </m.p>

        {/* Scroll indicator */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs font-mono tracking-widest uppercase">Scroll</span>
          <m.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </m.div>
        </m.div>
      </m.section>

      {/* Main Content Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-16">
          {/* Contact Info Column */}
          <m.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 space-y-8"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-grand-slang mb-4">
                {copy.infoTitle}
              </h2>
              <p className="text-white/60 leading-relaxed">
                {copy.infoBody}
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
              {copy.infoBlocks.map((block, index) => {
                const IconComponent = ICON_MAP[block.icon] || Mail;
                return (
                  <m.div
                    key={block.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-1">
                          {block.title}
                        </h3>
                        {block.lines.map((line) => (
                          <p key={line} className="text-white/60 text-sm">
                            {line}
                          </p>
                        ))}
                        {block.helper && (
                          <p className="text-white/40 text-xs mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {block.helper}
                          </p>
                        )}
                        {block.link && (
                          <a
                            href={block.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors group/link"
                          >
                            {block.link.label}
                            <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                          </a>
                        )}
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>

            {/* Opening Hours Card */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-mono text-white/60 uppercase tracking-wider">
                  Ouvert maintenant
                </span>
              </div>
              <p className="text-white/80 text-sm">
                Du mardi au samedi, 10h – 19h
              </p>
            </m.div>
          </m.div>

          {/* Form Column */}
          <m.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="relative">
              {/* Form glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-50" aria-hidden="true" />

              <div className="relative p-8 md:p-12 rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/10">
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-grand-slang mb-3">
                    {copy.formTitle}
                  </h2>
                  <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                </div>

                <ContactForm variant="dark" />
              </div>
            </div>
          </m.div>
        </div>

        {/* Map Section */}
        <m.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <span className="text-blue-400 font-mono text-xs tracking-[0.3em] uppercase mb-4 block">
              Location
            </span>
            <h2 className="text-3xl md:text-5xl font-grand-slang">
              {copy.mapTitle}
            </h2>
          </div>

          <div ref={mapRef} className="relative rounded-3xl overflow-hidden border border-white/10 min-h-[450px]">
            {/* Map overlay gradient - uses theme background token */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-40"
              style={{ background: "linear-gradient(to top, var(--background, #030303), transparent)" }}
              aria-hidden="true"
            />

            {mapVisible ? (
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2709.6597541533844!2d-1.5578378!3d47.2126599!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4805efc89f05b161%3A0xca59d1530a340cc8!2sQuai%20de%20la%20Loire%2C%2044200%20Nantes!5e0!3m2!1sfr!2sfr!4v1654781648750!5m2!1sfr!2sfr"
                width="100%"
                height="450"
                style={{ border: 0, filter: "grayscale(100%) invert(92%) contrast(83%)" }}
                title="Localisation de Blue Cinis sur Google Maps"
                aria-label="Carte interactive montrant l'emplacement de la galerie Blue Cinis à Nantes"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="w-full h-[450px] bg-white/[0.02] flex items-center justify-center">
                <div className="text-white/30 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 animate-pulse" />
                  Chargement de la carte...
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <a
              href="https://www.google.com/maps/dir//Quai+de+la+Loire,+44200+Nantes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all group"
            >
              <MapPin className="w-4 h-4" />
              Obtenir l'itinéraire
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </m.div>
      </section>
    </div>
  );
}
