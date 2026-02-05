import { Suspense } from "react";
import CinematicOverlay from "@/components/home/CinematicOverlay";
import SectionObserver from "@/components/ui/SectionObserver";
import GrainOverlay from "@/components/ui/GrainOverlay";

// Client component wrapper for lazy-loaded 3D scene (~300-400KB code-split)
import SceneWrapperClient from "@/components/canvas/SceneWrapperClient";

import ExhibitionLoop from "@/components/home/ExhibitionLoop";
import SocialProofSection from "@/components/home/SocialProofSection";

import ArtworksSectionClient from "@/components/home/ArtworksSectionClient";
import CategoriesSection from "@/components/home/CategoriesSection";
import NewArtistsSection from "@/components/home/NewArtistsSection";
import ArtistCmsSection from "@/components/home/ArtistCmsSection";
import ArtistPostersSection from "@/components/home/ArtistPostersSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import Footer from "@/components/layout/Footer";
import NewsAgendaSection from "@/components/home/NewsAgendaSection";
import HighlightsSection from "@/components/home/HighlightsSection";
import { getFeaturedArtworks } from "@/lib/data/artworks";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function SectionFallback({ sectionId }: { sectionId?: string }) {
  return (
    <div id={sectionId} className="w-full h-96 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default async function HomePage() {
  const { items } = await getFeaturedArtworks(12);
  const totalDepth = items.length * 5;

  // --- UNIFIED SECTION SPACING SYSTEM ---
  // Using CSS custom properties for fluid, responsive vertical rhythm
  const SPACING = {
    cinematic: { paddingBlock: 'var(--section-py-lg)' },  // 80px → 128px: Immersive sections
    standard: { paddingBlock: 'var(--section-py-md)' },   // 56px → 88px: Standard content
    compact: { paddingBlock: 'var(--section-py-sm)' },    // 40px → 64px: Transition zones
    none: {},                                               // Sticky/scroll sections manage internally
  } as const;

  return (
    <main className="relative w-full">

      {/* 1. SCENE 3D (FIXED BACKGROUND) */}
      <div className="fixed inset-0 z-0 h-screen w-full pointer-events-none">
        <SceneWrapperClient items={items} totalDepth={totalDepth} />
      </div>

      {/* 2. UI HERO (FIXED OVERLAY) */}
      <CinematicOverlay />

      {/* GRAIN OVERLAY (Awwwards-level texture) */}
      <GrainOverlay opacity={0.04} />

      {/* 3. SCROLLABLE CONTENT */}
      {/* 
          - Spacer: 100vh transparent to "reveal" the hero for the first screen 
          - Gallery & Content: z-10 and bg-black to slide over the hero
      */}
      <div className="relative w-full z-10">

        {/* SPACER for Hero Visibility */}
        <div className="h-screen w-full pointer-events-none" />

        {/* --- CONTENT START (Overlapping) --- */}
        <div className="relative z-10 w-full bg-[#030303] text-white">

          {/* 1. GALLERY LOOP */}
          <SectionObserver title="GALLERY">
            <div className="pt-24 md:pt-40">
              <ExhibitionLoop />
            </div>
          </SectionObserver>

          {/* 2. SOCIAL PROOF - Trust signals */}
          <div style={SPACING.compact}>
            <SocialProofSection />
          </div>

          {/* 2. HIGHLIGHTS */}
          <div style={SPACING.cinematic}>
            <SectionObserver title="COVENANT">
              <HighlightsSection />
            </SectionObserver>
          </div>

          {/* 3. MASTERPIECES */}
          <div className="bg-black/90">
            <SectionObserver title="MASTERPIECES">
              <Suspense fallback={<SectionFallback sectionId="home-artworks" />}>
                <ArtworksSectionClient artworks={items.slice(0, 8)} />
              </Suspense>
            </SectionObserver>
          </div>

          {/* 4. COLLECTIONS */}
          <div style={SPACING.cinematic}>
            <SectionObserver title="COLLECTIONS">
              <CategoriesSection />
            </SectionObserver>
          </div>

          {/* 5. AGENDA */}
          <div style={SPACING.standard}>
            <SectionObserver title="AGENDA">
              <NewsAgendaSection />
            </SectionObserver>
          </div>

          {/* 6. TALENTS */}
          <div style={SPACING.standard}>
            <SectionObserver title="TALENTS">
              <Suspense fallback={<SectionFallback sectionId="home-new-artists" />}>
                <NewArtistsSection />
              </Suspense>
            </SectionObserver>
          </div>

          {/* 7. STUDIO */}
          <div className="bg-[#080808]">
            <SectionObserver title="STUDIO">
              <ArtistCmsSection />
            </SectionObserver>
          </div>

          {/* 8. EDITIONS */}
          <div style={SPACING.standard}>
            <SectionObserver title="EDITIONS">
              <ArtistPostersSection />
            </SectionObserver>
          </div>

          {/* 9. CONTACT */}
          <div style={{ ...SPACING.compact, paddingBottom: 0 }} className="bg-black">
            <SectionObserver title="CONTACT">
              <NewsletterSection />
            </SectionObserver>
          </div>

          {/* 10. FOOTER */}
          <div className="bg-black">
            <Footer />
          </div>

        </div>
      </div>
    </main>
  );
}
