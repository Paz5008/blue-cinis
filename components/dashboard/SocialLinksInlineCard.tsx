"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Facebook, Globe, Instagram, Loader2, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

type Profile = {
  name: string;
  portfolio?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
};

type LinkRow = {
  id: "portfolio" | "instagram" | "facebook";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
};

export default function SocialLinksInlineCard() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ portfolio: "", instagramUrl: "", facebookUrl: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/artist/profile", { cache: "no-store" });
        const data: Profile = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error((data as any)?.error || "Erreur");
        setProfile(data);
        setForm({
          portfolio: data.portfolio || "",
          instagramUrl: data.instagramUrl || "",
          facebookUrl: data.facebookUrl || "",
        });
      } catch (error: any) {
        addToast(error?.message || "Impossible de charger vos liens", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  const rows: LinkRow[] = useMemo(() => {
    const base: LinkRow[] = [
      { id: "portfolio", label: "Portfolio ou site", icon: Globe, value: form.portfolio.trim() },
      { id: "instagram", label: "Instagram", icon: Instagram, value: form.instagramUrl.trim() },
      { id: "facebook", label: "Facebook", icon: Facebook, value: form.facebookUrl.trim() },
    ];
    return base;
  }, [form.facebookUrl, form.instagramUrl, form.portfolio]);

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setForm({
        portfolio: profile.portfolio || "",
        instagramUrl: profile.instagramUrl || "",
        facebookUrl: profile.facebookUrl || "",
      });
    }
  };

  const handleSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        setSaving(true);
        const fd = new FormData();
        fd.set("name", profile?.name || "Artiste");
        if (form.portfolio.trim()) fd.set("portfolio", form.portfolio.trim());
        if (form.instagramUrl.trim()) fd.set("instagramUrl", form.instagramUrl.trim());
        if (form.facebookUrl.trim()) fd.set("facebookUrl", form.facebookUrl.trim());
        if (!form.portfolio.trim()) fd.set("portfolio", "");
        if (!form.instagramUrl.trim()) fd.set("instagramUrl", "");
        if (!form.facebookUrl.trim()) fd.set("facebookUrl", "");
        const res = await fetch("/api/artist/profile", { method: "PUT", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Sauvegarde impossible");
        setProfile((prev) => ({
          ...(prev || { name: "Artiste" }),
          portfolio: form.portfolio.trim() || null,
          instagramUrl: form.instagramUrl.trim() || null,
          facebookUrl: form.facebookUrl.trim() || null,
        }));
        addToast("Liens sociaux mis à jour", "success");
        setEditing(false);
      } catch (error: any) {
        addToast(error?.message || "Erreur lors de la sauvegarde", "error");
      } finally {
        setSaving(false);
      }
    },
    [addToast, form.facebookUrl, form.instagramUrl, form.portfolio, profile?.name]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Chargement de vos réseaux…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-white">Réseaux & visibilité</h3>
          <p className="text-xs text-neutral-400">Ajoutez vos liens pour afficher vos réseaux sur votre page publique.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          {editing ? (
            <>
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Annuler
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Modifier
            </>
          )}
        </button>
      </header>

      {!editing && (
        <ul className="divide-y divide-white/5 text-sm">
          {rows.map(({ id, label, icon: Icon, value }) => (
            <li key={id} className="flex items-center gap-3 px-4 py-3">
              <Icon className="h-4 w-4 text-neutral-500" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium text-neutral-200">{label}</p>
                <p className="text-xs text-neutral-500">
                  {value
                    ? value
                    : "Non défini – ajoutez un lien pour renforcer la confiance."}
                </p>
              </div>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${value ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-neutral-500"
                  }`}
              >
                {value ? "OK" : "…"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-4 px-4 py-4 text-sm">
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Portfolio ou site</span>
              <input
                type="url"
                value={form.portfolio}
                onChange={(event) => setForm((prev) => ({ ...prev, portfolio: event.target.value }))}
                placeholder="https://votresite.com"
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Instagram</span>
              <input
                type="url"
                value={form.instagramUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, instagramUrl: event.target.value }))}
                placeholder="https://instagram.com/votreprofil"
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Facebook</span>
              <input
                type="url"
                value={form.facebookUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, facebookUrl: event.target.value }))}
                placeholder="https://facebook.com/votrepage"
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-white/10 px-3 py-2 font-medium text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1 rounded bg-white px-3 py-2 font-semibold text-black hover:bg-neutral-200 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
