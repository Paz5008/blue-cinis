"use client";

import { m } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-screen overflow-hidden bg-[#050505] text-[#e0e0e0]">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-[#050505] opacity-80 z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-[15vw] md:text-[200px] leading-none font-serif font-bold tracking-tighter text-[#d4a25a] opacity-90 select-none"
        >
          404
        </m.h1>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-4"
        >
          <p className="text-lg md:text-xl font-light tracking-[0.2em] uppercase opacity-70 mb-8">
            Page introuvable
          </p>

          <Link href="/" className="inline-block">
            <m.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border border-white/20 rounded-full hover:border-[#d4a25a] hover:text-[#d4a25a] transition-colors duration-300 tracking-widest uppercase text-sm"
            >
              Retour à l'accueil
            </m.button>
          </Link>
        </m.div>
      </div>
    </div>
  );
}
