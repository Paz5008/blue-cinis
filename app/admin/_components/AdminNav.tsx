"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Palette,
  ShoppingBag,
  Users,
  Webhook,
  ExternalLink,
  Shield,
  CalendarDays,
  ServerCog,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard, accent: "from-slate-500" },
  { label: "Artistes", href: "/admin/artists", icon: Users, accent: "from-blue-500" },
  { label: "Œuvres", href: "/admin/artworks", icon: Palette, accent: "from-fuchsia-500" },
  { label: "Évènements", href: "/admin/events", icon: CalendarDays, accent: "from-orange-500" },
  { label: "Leads", href: "/admin/leads", icon: Mail, accent: "from-indigo-500" },
  { label: "Commandes", href: "/admin/orders", icon: ShoppingBag, accent: "from-emerald-500" },
  { label: "Webhooks", href: "/admin/webhooks", icon: Webhook, accent: "from-amber-500" },
  { label: "Audit", href: "/admin/audit", icon: Shield, accent: "from-slate-800" },
  { label: "Admin technique", href: "/admin/tech", icon: ServerCog, accent: "from-slate-700" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Blue Cinis
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Console d&apos;administration</h1>
          <p className="text-sm text-slate-500">
            Gérez les artistes, les œuvres, les leads et le suivi des commandes depuis un seul endroit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Voir le site
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex min-w-[140px] flex-1 items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${isActive
                  ? "bg-gradient-to-br from-white via-white to-slate-50 text-slate-900 shadow-inner"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
            >
              <span
                className={`pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-lg bg-gradient-to-b ${item.accent} via-transparent to-transparent opacity-0 transition group-hover:opacity-60 ${isActive ? "opacity-100" : ""
                  }`}
              />
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition group-hover:bg-slate-200 group-hover:text-slate-700">
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
