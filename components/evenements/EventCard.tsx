"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

export interface EventCardProps {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    location: string | null;
    imageUrl: string | null;
    index?: number;
    prefersReducedMotion?: boolean;
    locale?: string;
}

function formatEventDate(date: Date | string, locale: string = "fr"): string {
    try {
        const d = new Date(date);
        return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(d);
    } catch {
        return "Date non spécifiée";
    }
}

function formatShortDate(date: Date | string): { day: string; month: string } {
    try {
        const d = new Date(date);
        return {
            day: d.getDate().toString().padStart(2, "0"),
            month: new Intl.DateTimeFormat("fr-FR", { month: "short" })
                .format(d)
                .toUpperCase()
                .replace(".", ""),
        };
    } catch {
        return { day: "--", month: "---" };
    }
}

function truncate(text: string | null, n: number): string {
    if (!text) return "";
    return text.length > n ? text.substring(0, n - 1) + "…" : text;
}

export function EventCard({
    id,
    title,
    description,
    date,
    location,
    imageUrl,
    index = 0,
    prefersReducedMotion = false,
    locale = "fr",
}: EventCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);
    const eventUrl = `/evenements/${id}`;
    const shortDate = formatShortDate(date);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const showImage = imageUrl && !imageError;

    return (
        <m.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            role="listitem"
        >
            <Link
                href={eventUrl}
                className="group relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
            >
                {/* Image or Fallback */}
                <m.div
                    className="relative aspect-[16/10] overflow-hidden"
                    animate={{
                        scale: isHovered && !prefersReducedMotion ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                >
                    {showImage ? (
                        <Image
                            src={imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading="lazy"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-800 to-slate-900 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white/15" strokeWidth={1} />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    {/* Hover Overlay */}
                    <m.div
                        className="absolute inset-0 bg-indigo-900/30"
                        animate={{ opacity: isHovered ? 0.4 : 0 }}
                        transition={{ duration: 0.3 }}
                    />

                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/20">
                        <span className="block text-2xl font-bold text-white leading-none">
                            {shortDate.day}
                        </span>
                        <span className="block text-xs font-mono text-white/70 tracking-wider">
                            {shortDate.month}
                        </span>
                    </div>
                </m.div>

                {/* Content */}
                <div className="relative bg-white/5 backdrop-blur-sm p-5 border-t border-white/10">
                    {/* Title */}
                    <h3 className="text-xl font-grand-slang text-white leading-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                        {title}
                    </h3>

                    {/* Description */}
                    {description && (
                        <p className="text-white/50 text-sm line-clamp-2 mb-3">
                            {truncate(description, 100)}
                        </p>
                    )}

                    {/* Location */}
                    {location && (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{location}</span>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                            {formatEventDate(date, locale)}
                        </span>
                        <span className="text-sm font-semibold text-blue-400 group-hover:translate-x-1 transition-transform duration-300">
                            Voir plus →
                        </span>
                    </div>
                </div>

                {/* Border glow on hover */}
                <m.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                        boxShadow: isHovered
                            ? "inset 0 0 0 1px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.15)"
                            : "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
                    }}
                    transition={{ duration: 0.3 }}
                />
            </Link>
        </m.article>
    );
}

export default EventCard;
