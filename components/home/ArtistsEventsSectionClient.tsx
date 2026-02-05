"use client";

import Link from "next/link";
import Image from "next/image";
import { m } from "framer-motion";
import type { Variants } from "framer-motion";
import { ExternalLink, Facebook, Instagram, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useI18n } from "@/i18n/provider";
import { BodyText } from "../typography";
import type { FeaturedArtist } from "@/lib/data/artists";
import type { UpcomingEvent } from "@/lib/data/events";
import HomeSectionHeader from "./HomeSectionHeader.client";
import { buildArtworkPath } from "@/lib/artworkSlug";

type ArtistsEventsSectionProps = {
  artists: FeaturedArtist[];
  events: UpcomingEvent[];
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut", delay: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function ArtistsEventsSection({ artists, events }: ArtistsEventsSectionProps) {
  const { t, locale } = useI18n();
  const translate = (key: string, fallbackValue: string) => {
    const value = t(key);
    return value === key ? fallbackValue : value;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return t("common.date_unspecified");
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: locale === "en" ? enUS : fr });
    } catch {
      return t("common.date_invalid");
    }
  };

  const highlightedArtists = artists.slice(0, 6);
  const highlightedEvents = events.slice(0, 3);

  return (
    <>
      <section className="home-section mb-12 last:mb-0">
        <div className="section-container space-y-5">
          <m.div
            className="flex flex-col"
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
          >
            <HomeSectionHeader
              badge={t("home.artists.featured_badge")}
              badgeVariant="accent"
              divider
              title={t("home.artists.title")}
              subtitle={t("home.artists.subtitle")}
              alignment="center"
              dividerAlign="start"
              className="mx-auto max-w-3xl md:items-start md:text-left"
              titleClassName="text-[color:var(--color-text-heading)]"
              subtitleClassName="md:max-w-xl text-[color:var(--color-text-body)]"
            />
          </m.div>

        <m.div
          className="space-y-5"
            variants={columnVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
              <BodyText as="p" className="max-w-xl text-[color:var(--color-text-body)]">
                {t("home.reassure.support.description")}
              </BodyText>
              <Link
                href="/artistes"
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--color-accent)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-accent-contrast)]"
                aria-label={t("home.artists.all_link") ?? undefined}
              >
                {t("home.artists.all_link")}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {highlightedArtists.length ? (
                highlightedArtists.map((artist) => {
                  const profileHref = artist.slug ? `/artistes/${artist.slug}` : `/artistes/${artist.id}`;
                  const instagramLabel = artist.name
                    ? locale === "en"
                      ? `Instagram of ${artist.name}`
                      : `Instagram de ${artist.name}`
                    : "Instagram";
                  const facebookLabel = artist.name
                    ? locale === "en"
                      ? `Facebook of ${artist.name}`
                      : `Facebook de ${artist.name}`
                    : "Facebook";

                  return (
                  <m.article
                      key={artist.id}
                      variants={cardVariants}
                      className="group relative grid gap-5 overflow-hidden rounded-[24px] border border-white/25 bg-white/80 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1.5 hover:border-[color:var(--color-accent)]/55 hover:shadow-[0_28px_80px_rgba(15,23,42,0.24)] md:grid-cols-[minmax(0,0.4fr)_1fr] dark:border-white/10 dark:bg-[rgba(13,21,38,0.82)]"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_65%)] opacity-90 transition duration-500 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <Link
                        href={profileHref}
                        className="group/portrait relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/50 bg-white/50 transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] md:aspect-[3/4]"
                        aria-label={
                          artist.name
                            ? `${artist.name} — ${t("home.artists.discover_artist")}`
                            : t("home.artists.discover_artist")
                        }
                      >
                        {artist.photoUrl ? (
                          <Image
                            src={artist.photoUrl}
                            alt={artist.name ? `Portrait de ${artist.name}` : "Portrait artiste"}
                            fill
                            sizes="(max-width: 768px) 80vw, 320px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--color-text-body-subtle)]">
                            {t("common.image_not_available_short")}
                          </div>
                        )}
                        {artist.artStyle ? (
                          <span className="absolute bottom-3 left-3 rounded-full border border-white/50 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-heading)] shadow-sm dark:border-white/20 dark:bg-[rgba(59,130,246,0.28)] dark:text-white">
                            {artist.artStyle}
                          </span>
                        ) : null}
                      </Link>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          <div className="space-y-2">
                            <Link href={profileHref} className="group/name inline-flex items-baseline gap-2 text-left">
                              <h3 className="text-lg font-semibold text-[color:var(--color-text-heading)] transition group-hover/name:text-[color:var(--color-accent)] md:text-xl">
                                {artist.name || t("home.artists.unknown_name")}
                              </h3>
                            </Link>
                            <p className="text-sm leading-relaxed text-[color:var(--color-text-body)] line-clamp-3">
                              {artist.biography || t("home.artists.bio_missing")}
                            </p>
                          </div>
                          {(artist.instagramUrl || artist.facebookUrl) && (
                            <div className="flex items-center gap-2">
                              {artist.instagramUrl ? (
                                <a
                                  href={artist.instagramUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--surface-border-soft)] text-[color:var(--color-text-body-subtle)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                                  aria-label={instagramLabel}
                                >
                                  <Instagram className="h-4 w-4" aria-hidden="true" />
                                </a>
                              ) : null}
                              {artist.facebookUrl ? (
                                <a
                                  href={artist.facebookUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--surface-border-soft)] text-[color:var(--color-text-body-subtle)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                                  aria-label={facebookLabel}
                                >
                                  <Facebook className="h-4 w-4" aria-hidden="true" />
                                </a>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {artist.portfolio ? (
                          <a
                            href={artist.portfolio}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent)] transition hover:text-[color:var(--color-accent-hover)]"
                            aria-label={artist.name ? `${artist.name} — ${t("home.artists.portfolio")}` : t("home.artists.portfolio")}
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            <span>{t("home.artists.portfolio")}</span>
                          </a>
                        ) : null}

                        {artist.artworks && artist.artworks.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {artist.artworks.slice(0, 3).map((artwork) => (
                              <div key={artwork.id} className="group/artwork relative h-16 w-16">
                                {artwork.imageUrl ? (
                                  <Link
                                    href={buildArtworkPath({ id: artwork.id, title: artwork.title })}
                                    className="block h-full w-full overflow-hidden rounded-xl border border-white/40 bg-white/75 transition hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] dark:border-white/10 dark:bg-[linear-gradient(188deg,rgba(22,32,52,0.88),rgba(15,25,44,0.95))]"
                                  >
                                    <Image
                                      src={artwork.imageUrl}
                                      alt={artwork.title || t("common.artwork_alt")}
                                      fill
                                      sizes="(max-width: 768px) 40vw, 160px"
                                      className="object-cover"
                                    />
                                  </Link>
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[color:var(--surface-border-soft)] text-[10px] text-[color:var(--color-text-body-subtle)] dark:border-[color:var(--night-surface-border)]/70">
                                    {t("common.image_not_available_short")}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[color:var(--color-text-body-subtle)]">
                            {t("home.artists.no_artworks")}
                          </p>
                        )}
                        <Link
                          href={profileHref}
                          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[color:var(--color-accent)] transition hover:text-[color:var(--color-accent-hover)]"
                        >
                          {t("home.artists.discover_artist")}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </m.article>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-[color:var(--surface-border-soft)] bg-white/80 p-10 text-center text-[color:var(--color-text-body-subtle)] dark:border-[color:var(--night-surface-border)]/70 dark:bg-[linear-gradient(188deg,rgba(22,32,52,0.86),rgba(15,25,44,0.94))]">
              <h4 className="text-base font-semibold text-[color:var(--color-text-heading)]">
                {translate("home.artists.none_title", "Aucun profil à afficher pour le moment")}
              </h4>
              <p className="mt-2 text-sm">
                {translate(
                  "home.artists.none_sub",
                  "Notre équipe peut vous guider vers des artistes compatibles avec votre projet."
                )}
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--color-accent)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-accent-contrast)]"
              >
                {translate("home.artists.none_cta", "Contacter la galerie")}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
            </div>
          </m.div>
        </div>
      </section>

      <section className="home-section mb-12 last:mb-0">
        <div className="section-container space-y-5">
          <m.div
            className="flex flex-col"
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <HomeSectionHeader
              badgeVariant="accent"
              divider
              title={t("home.events.title")}
              subtitle={t("home.events.subtitle")}
              alignment="start"
              dividerAlign="start"
              className="max-w-3xl"
              titleClassName="text-[color:var(--color-text-heading)]"
              subtitleClassName="text-[color:var(--color-text-body)]"
            />
          </m.div>

          <m.div
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            variants={columnVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {highlightedEvents.length ? (
              highlightedEvents.map((event) => (
                <m.article
                  key={event.id}
                  variants={cardVariants}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-white/25 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1.5 hover:border-[color:var(--color-accent)]/55 hover:shadow-[0_30px_85px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[rgba(13,21,38,0.82)]"
                >
                  <span
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_70%)] opacity-90 transition duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <Link href={`/evenements/${event.id}`} className="relative flex h-full flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.title || ""}
                          fill
                          sizes="(min-width: 1024px) 30vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm text-[color:var(--color-text-body-subtle)]">
                          {t("common.image_not_available_short")}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" aria-hidden="true" />
                    </div>

                    <div className="relative flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-text-body-subtle)]">
                        {formatDate(event.date)}
                      </span>
                      <h4 className="line-clamp-2 text-lg font-semibold text-[color:var(--color-text-heading)]">
                        {event.title || t("home.events.loading_error")}
                      </h4>
                      <p className="text-sm text-[color:var(--color-text-body)]">
                        {event.location || t("common.date_unspecified")}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--color-accent)]">
                        {t("common.view_details")} <span aria-hidden="true">↗</span>
                      </span>
                    </div>
                  </Link>
                </m.article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[color:var(--surface-border-soft)] bg-white/80 p-10 text-center text-[color:var(--color-text-body-subtle)] dark:border-[color:var(--night-surface-border)]/70 dark:bg-[linear-gradient(188deg,rgba(22,32,52,0.86),rgba(15,25,44,0.94))] md:col-span-2 lg:col-span-3">
                <h4 className="text-base font-semibold text-[color:var(--color-text-heading)]">
                  {t("home.events.none_title")}
                </h4>
                <p className="mt-2 text-sm">{t("home.events.none_sub")}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/evenements"
                    className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--color-accent)] transition hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-accent-contrast)]"
                  >
                    {t("home.events.all_link")}
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-md border border-[color:var(--surface-border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-heading)] transition hover:bg-[color:var(--color-text-heading)] hover:text-white"
                  >
                    {translate("home.events.contact_cta", "Parler à un conseiller")}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            )}
          </m.div>

          <div className="flex justify-center border-t border-[color:var(--surface-border-soft)] pt-6">
            <Link
              href="/evenements"
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-text-heading)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-heading)] transition hover:bg-[color:var(--color-text-heading)] hover:text-white"
            >
              {t("home.events.all_link")}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
