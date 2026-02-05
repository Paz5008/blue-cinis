import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowLeft, Clock } from "lucide-react";
import ShareButton from "@/components/evenements/ShareButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatEventDate(date: Date | string, locale: string = "fr"): string {
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "Date non spécifiée";
  }
}

function formatTime(date: Date | string): string {
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function getShortDate(date: Date | string): { day: string; month: string; year: string } {
  try {
    const d = new Date(date);
    return {
      day: d.getDate().toString().padStart(2, "0"),
      month: new Intl.DateTimeFormat("fr-FR", { month: "short" })
        .format(d)
        .toUpperCase()
        .replace(".", ""),
      year: d.getFullYear().toString(),
    };
  } catch {
    return { day: "--", month: "---", year: "----" };
  }
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) {
    return { title: "Événement introuvable | Blue Cinis" };
  }

  return {
    title: `${event.title} | Blue Cinis`,
    description: event.description?.slice(0, 150) || "Découvrez cet événement sur Blue Cinis.",
    openGraph: {
      title: event.title,
      description: event.description || undefined,
      images: event.imageUrl ? [{ url: event.imageUrl }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  const shortDate = getShortDate(event.date);
  const fullDate = formatEventDate(event.date);
  const time = formatTime(event.date);

  return (
    <main className="min-h-screen bg-[#030303]">
      {/* Hero Section */}
      <section className="relative">
        {/* Background Image or Fallback */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-800 to-slate-900 flex items-center justify-center">
              <Calendar className="w-32 h-32 text-white/10" strokeWidth={0.5} />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/50 to-transparent" />

          {/* Back Button */}
          <Link
            href="/evenements"
            className="absolute top-6 left-6 z-10 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/80 text-sm font-medium border border-white/10 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          {/* Date Badge */}
          <div className="absolute bottom-8 left-6 md:left-12 bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 text-center border border-white/20">
            <span className="block text-4xl font-bold text-white leading-none">
              {shortDate.day}
            </span>
            <span className="block text-sm font-mono text-white/70 tracking-wider mt-1">
              {shortDate.month} {shortDate.year}
            </span>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative z-10 -mt-12">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Main Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-8 md:p-12">
              {/* Category Badge */}
              <span className="inline-flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-[0.3em] uppercase mb-4">
                <span className="w-8 h-[1px] bg-indigo-400" />
                Évènement
              </span>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-grand-slang text-white leading-tight mb-6">
                {event.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-3 text-white/60">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/40">Date</p>
                    <p className="text-white capitalize">{fullDate}</p>
                  </div>
                </div>

                {time && (
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/40">Heure</p>
                      <p className="text-white">{time}</p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/40">Lieu</p>
                      <p className="text-white">{event.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/70 text-lg leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-8 md:px-12 py-6 bg-white/[0.02] border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/evenements"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Tous les évènements
              </Link>

              <ShareButton title={event.title} />
            </div>
          </div>

          {/* CTA Card */}
          <div className="mt-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/20 p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Vous souhaitez organiser un évènement ?
            </h2>
            <p className="text-white/60 mb-6">
              Contactez-nous pour discuter de votre projet artistique.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
            >
              Nous contacter
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-20" />
    </main>
  );
}
