import Link from "next/link";
import { Mail, Palette, ShoppingBag, Users, ArrowUpRight, ServerCog } from "lucide-react";
import { requireAdminSessionOrRedirect } from "@/lib/adminGuard";

const QUICK_LINKS = [
  {
    label: "Artistes",
    description: "Activer les profils, mettre en avant les talents et accéder aux fiches détaillées.",
    href: "/admin/artists",
    icon: Users,
    accent: "bg-blue-100 text-blue-700",
  },
  {
    label: "Œuvres",
    description: "Contrôler le catalogue, visualiser les visuels et accéder aux variantes.",
    href: "/admin/artworks",
    icon: Palette,
    accent: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    label: "Leads",
    description: "Identifier les prospects chauds, suivre les demandes et exporter les contacts.",
    href: "/admin/leads",
    icon: Mail,
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    label: "Commandes",
    description: "Superviser les paiements, mettre à jour le fulfilment et gérer les expéditions.",
    href: "/admin/orders",
    icon: ShoppingBag,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Admin technique",
    description: "Scripts de purge, exports lourds et procédures d’exploitation centralisées.",
    href: "/admin/tech",
    icon: ServerCog,
    accent: "bg-slate-100 text-slate-700",
  },
];

export default async function AdminPage() {
  await requireAdminSessionOrRedirect('/admin');
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-900">Bienvenue dans votre espace de pilotage</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Retrouvez en un coup d’œil tout ce dont vous avez besoin pour administrer la galerie :
            validation des artistes, mise à jour du catalogue, suivi des leads et contrôle des commandes.
            Les sections ci-dessous vous permettent d’agir rapidement.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Accès rapide</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-base font-semibold text-slate-900">{link.label}</span>
                </div>
                <p className="mt-4 text-sm text-slate-600">{link.description}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition group-hover:text-slate-800">
                  Ouvrir la section
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
