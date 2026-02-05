"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m } from 'framer-motion';

type Artist = { id: string; name: string; slug: string | null; photoUrl?: string | null; biography?: string | null };

type BannerCta = { label: string | null; href: string | null } | null | undefined;

export default function FeaturedBanner({ limit = 1 }: { limit?: number }) {
  const [items, setItems] = useState<{ artist: Artist; banner: any; cta?: BannerCta }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/artist/featured/banner?limit=${limit}`);
        if (!res.ok) throw new Error('Erreur API');
        const data = await res.json();
        if (mounted) setItems(data || []);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Erreur');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [limit]);

  if (loading) return null;
  if (error) return null;
  if (!items || items.length === 0) return null;

  return (
    <section className="py-10 bg-white/50 dark:bg-black/30 backdrop-blur supports-[backdrop-filter]:bg-white/40 border-b relative overflow-hidden">
      {/* Subtle mesh gradient background to stay on brand */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply bg-[radial-gradient(60%_80%_at_10%_10%,rgba(184,206,228,0.35),transparent),radial-gradient(60%_60%_at_90%_10%,rgba(212,162,90,0.25),transparent),radial-gradient(50%_60%_at_40%_90%,rgba(165,195,109,0.2),transparent)]" />
      <div className="container mx-auto px-4 relative">
        {items.map(({ artist, banner, cta }) => {
          const fallbackHref = artist.slug ? `/artistes/${artist.slug}` : `/artistes/${artist.id}`;
          const rawCtaLabel = cta && typeof cta === "object" ? cta.label ?? null : null;
          const rawCtaHref = cta && typeof cta === "object" ? cta.href ?? null : null;
          const resolvedCtaLabel = rawCtaLabel && rawCtaLabel.trim().length > 0 ? rawCtaLabel.trim() : "Voir le profil";
          const resolvedHref = rawCtaHref && rawCtaHref.trim().length > 0 ? rawCtaHref.trim() : fallbackHref;
          const isExternal = /^https?:\/\//i.test(resolvedHref);

          return (
          <m.div
            key={artist.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-2xl shadow-md border border-border-subtle mb-6 group"
          >
            {/* Background image (blurred) */}
            {artist.photoUrl && (
              <div className="absolute inset-0 -z-10">
                <Image
                  src={artist.photoUrl}
                  alt={artist.name}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover opacity-70 blur-sm scale-105"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNjQwJyBoZWlnaHQ9JzMyMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJy8+"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
              </div>
            )}

            {/* Gradient border glow */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-white/10" />
            </div>

            <div className="p-6 md:p-8 text-center md:text-left relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur text-xs uppercase tracking-wider text-text-body-subtle border border-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Artiste en vedette
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 text-heading">
                {artist.name}
              </h2>
              {/* Texte issu de la bannière personnalisée si présent */}
              {banner?.blocks?.length ? (
                <div className="max-w-3xl md:max-w-2xl lg:max-w-3xl text-body mx-auto md:mx-0 mt-3">
                  {banner.blocks.slice(0, 2).map((b: any) => {
                    if (b.type === 'text') return <div key={b.id} dangerouslySetInnerHTML={{ __html: b.content }} />;
                    if (b.type === 'artistPhoto' && artist.photoUrl)
                      return (
                        <div key={b.id} className="mx-auto md:mx-0 w-28 h-28 relative rounded-lg overflow-hidden border border-white/40 shadow-sm mt-3">
                          <Image src={artist.photoUrl} alt={artist.name} fill className="object-cover" placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNjQnIGhlaWdodD0nNjQnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycvPi" />
                        </div>
                      );
                    if (b.type === 'artistName') return <div key={b.id} className="text-lg font-semibold">{artist.name}</div>;
                    return null;
                  })}
                </div>
              ) : (
                <p className="text-text-body-subtle max-w-2xl mx-auto md:mx-0 mt-3">
                  {artist.biography || "Découvrez l'univers de cet artiste."}
                </p>
              )}
              <div className="mt-5">
                {isExternal ? (
                  <a
                    href={resolvedHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-primary shadow-md hover:shadow-lg transition-transform duration-normal hover:-translate-y-0.5"
                  >
                    {resolvedCtaLabel} ↗
                  </a>
                ) : (
                  <Link
                    href={resolvedHref}
                    className="btn btn-primary shadow-md hover:shadow-lg transition-transform duration-normal hover:-translate-y-0.5"
                  >
                    {resolvedCtaLabel} →
                  </Link>
                )}
              </div>
            </div>
          </m.div>
        );
        })}
      </div>
    </section>
  );
}
