// components/EventCard.tsx
"use client";

import Image from "next/image";
import CTA from "@/components/shared/CTA";
import Link from "next/link";
import { m } from "framer-motion";
import { useI18n } from "@/i18n/provider";
import { Calendar, MapPin, ChevronRight } from "lucide-react";

interface EventCardProps {
  event: {
    id: string | number; // Allow number IDs too
    title: string;
    image?: string; // Make image optional
    date: Date | string; // Allow string dates
    location: string;
  };
  formatDate: (date: Date | string) => string; // Adjust signature if needed
  // Inherit animation variants from parent if needed, otherwise use default fade-up
  variants?: any;
  className?: string;
}

export default function EventCard({ event, formatDate, variants, className }: EventCardProps) {
  const { t } = useI18n();
  const { id, title, image, date, location } = event;
  const imageUrl = image || "/images/placeholder-event.jpg";
  const eventDate = typeof date === "string" ? new Date(date) : date;
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString("fr-FR", { month: "short" }).toUpperCase();

  const defaultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <m.div
      className={`group h-full overflow-hidden rounded-3xl border border-[color:var(--surface-border-soft)] bg-white/80 shadow-[0_18px_42px_rgba(31,25,20,0.08)] transition-transform duration-300 ease-out hover:-translate-y-1.5 dark:bg-[rgba(16,24,38,0.9)] ${className || ""}`}
      variants={variants || defaultVariants}
      layout
    >
      <div className="flex h-full flex-col">
        <Link href={`/evenements/${id}`} className="relative block" aria-label={`${t("common.view_details")} – ${title}`}>
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={`Image pour l'événement ${title}`}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNjQwJyBoZWlnaHQ9JzM2MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJy8+"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,16,17,0.45)] via-transparent to-transparent opacity-50" />
            <div className="absolute top-3 left-3 z-10 rounded-xl border border-[color:var(--surface-border-soft)] bg-white/85 px-2 py-1 text-center shadow-sm backdrop-blur-sm dark:bg-[rgba(16,24,38,0.85)]">
              <div className="text-sm font-semibold text-[color:var(--accent)]">{day}</div>
              <div className="text-xs uppercase tracking-widest text-[color:var(--accent)]">{month}</div>
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-col px-6 py-5">
          <div className="flex items-center text-sm font-medium text-[color:var(--accent)]">
            <Calendar size={14} className="mr-1.5 flex-shrink-0" />
            <span>{formatDate(date)}</span>
          </div>

          <Link
            href={`/evenements/${id}`}
            aria-label={`${t("common.view_details")} – ${title}`}
            className="mt-2 block"
          >
            <h3 className="text-lg font-semibold leading-snug text-heading transition-colors hover:text-[color:var(--accent)]">
              {title}
            </h3>
          </Link>

          <div className="mt-auto flex items-center gap-2 text-sm text-body-subtle">
            <MapPin size={14} className="flex-shrink-0 text-[color:var(--icon-subtle)]" />
            <span>{location}</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <CTA
            href={`/evenements/${id}`}
            variant="secondary"
            size="sm"
            className="inline-flex items-center gap-1 rounded-full"
          >
            {t("common.view_details")} <ChevronRight size={14} className="flex-shrink-0" />
          </CTA>
        </div>
      </div>
    </m.div>
  );
}
