"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { BadgeCheck, ArrowDown } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { getAboutCopy } from "@/i18n/content/about";
import { cn } from "@/lib/utils";

export default function AProposPage() {
  const { locale } = useI18n();
  const copy = getAboutCopy(locale);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
    })
  };

  return (
    <div className="bg-black min-h-screen text-white selection:bg-white/20 selection:text-white">

      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Noise/Texture */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        </div>

        <div className="relative z-10 px-6 max-w-5xl mx-auto text-center">
          <m.span
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeIn}
            className="inline-block mb-6 font-mono text-xs tracking-[0.3em] text-white/40 uppercase"
          >
            The Covenant
          </m.span>
          <m.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeIn}
            className="font-grand-slang text-6xl md:text-8xl lg:text-9xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 mb-8"
          >
            {copy.hero.title}
          </m.h1>
          <m.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeIn}
            className="font-light text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            {copy.hero.description}
          </m.p>
        </div>

        {/* Scroll Indicator */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        >
          <ArrowDown className="text-white/30 animate-bounce" size={24} />
        </m.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5" />

      {/* 2. HISTORY SECTION (Editoral Layout) */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

            {/* Heading Column */}
            <div className="lg:col-span-4">
              <m.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                custom={0}
                variants={fadeIn}
                className="sticky top-32"
              >
                <h2 className="font-grand-slang text-4xl md:text-5xl mb-6">{copy.history.heading}</h2>
                <div className="w-12 h-[1px] bg-white/30 mb-6"></div>

                {/* Highlights in sidebar */}
                <div className="space-y-6 mt-12 hidden lg:block">
                  {copy.history.highlights.map((item, i) => (
                    <div key={i} className="border-l border-white/10 pl-6 py-2">
                      <p className="text-white/40 font-mono text-xs uppercase tracking-wider mb-2">{item.label}</p>
                      <p className="text-2xl font-grand-slang">{item.value}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-8 space-y-12">
              <m.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={1}
                variants={fadeIn}
                className="prose prose-invert prose-lg text-white/70 max-w-none text-justify"
              >
                {copy.history.paragraphs.map((paragraph, index) => (
                  <p key={index} className="first-letter:text-5xl first-letter:font-grand-slang first-letter:float-left first-letter:mr-3 first-letter:mt-[-5px]">
                    {paragraph}
                  </p>
                ))}
              </m.div>

              {/* Mobile Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {copy.history.highlights.map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-sm">
                    <p className="text-white/40 font-mono text-xs uppercase tracking-wider mb-2">{item.label}</p>
                    <p className="text-2xl font-grand-slang">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Decorative Image */}
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative h-[400px] md:h-[500px] w-full mt-12 overflow-hidden grayscale hover:grayscale-0 transition-all duration-700"
              >
                <Image
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop" // Fallback aesthetic image
                  alt="Gallery History"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6 font-mono text-xs text-white/50">{`EST. ${new Date().getFullYear()}`}</div>
              </m.div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MISSION (Grid Cards) */}
      <section className="py-24 bg-zinc-950/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <h2 className="font-grand-slang text-4xl md:text-5xl mb-4">{copy.mission.heading}</h2>
            <div className="w-px h-16 bg-white/20 mx-auto"></div>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {copy.mission.pillars.map((pillar, i) => (
              <m.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeIn}
                className="group p-8 border border-white/5 hover:border-white/20 bg-white/0 hover:bg-white-[0.02] transition-colors duration-500 rounded-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                  <BadgeCheck size={32} className="text-white font-thin" strokeWidth={1} />
                </div>
                <h3 className="font-grand-slang text-2xl mb-4">{pillar.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{pillar.body}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VALUES (Minimal List) */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-grand-slang text-4xl mb-12">{copy.values.heading}</h2>
              <div className="space-y-12">
                {copy.values.items.map((value, i) => (
                  <m.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={i}
                    variants={fadeIn}
                  >
                    <h3 className="text-xl font-medium mb-2 flex items-center gap-4">
                      <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                      {value.title}
                    </h3>
                    <p className="pl-8 text-white/50 font-light border-l border-white/10 ml-1.5 py-1">
                      {value.body}
                    </p>
                  </m.div>
                ))}
              </div>
            </div>
            {/* Visual */}
            <div className="h-full min-h-[500px] relative border border-white/10 p-2">
              <div className="relative w-full h-full grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <Image
                  src="https://images.unsplash.com/photo-1547476547-82f7fbe9988f?q=80&w=2670&auto=format&fit=crop"
                  alt="Values"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5" />

      {/* 5. TEAM */}
      <section className="py-24 mb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-16">
          <h2 className="font-grand-slang text-4xl md:text-5xl mb-6">{copy.team.heading}</h2>
          <p className="text-white/50 max-w-2xl mx-auto">{copy.team.description}</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {copy.team.members.map((member, i) => (
              <m.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeIn}
                className="group text-center"
              >
                <div className="relative w-full aspect-[3/4] mb-6 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                </div>
                <h3 className="font-grand-slang text-xl mb-1">{member.name}</h3>
                <p className="font-mono text-xs text-white/40 uppercase tracking-widest">{member.role}</p>
                <p className="mt-4 text-xs text-white/60 leading-relaxed max-w-[80%] mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {member.bio}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
