"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { Loader2 } from "lucide-react";

type Frequency = "instant" | "daily" | "weekly";

type ChannelPreference = {
  email: boolean;
  sms: boolean;
  frequency: Frequency;
};

type NotificationPreferences = {
  sales: ChannelPreference;
  leads: ChannelPreference;
};

const defaultPreferences: NotificationPreferences = {
  sales: { email: true, sms: false, frequency: "instant" },
  leads: { email: true, sms: false, frequency: "daily" },
};

const frequencyLabels: Record<Frequency, string> = {
  instant: "En temps réel",
  daily: "Résumé quotidien",
  weekly: "Résumé hebdomadaire",
};

export default function NotificationsSettingsCard() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/artist/notifications", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setPreferences({
          sales: {
            email: !!data?.sales?.email,
            sms: !!data?.sales?.sms,
            frequency: (data?.sales?.frequency as Frequency) || "instant",
          },
          leads: {
            email: !!data?.leads?.email,
            sms: !!data?.leads?.sms,
            frequency: (data?.leads?.frequency as Frequency) || "daily",
          },
        });
      } catch (error: any) {
        addToast(error?.message || "Impossible de charger vos notifications", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch("/api/artist/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      addToast("Notifications mises à jour", "success");
    } catch (error: any) {
      addToast(error?.message || "Erreur lors de l’enregistrement", "error");
    } finally {
      setSaving(false);
    }
  }

  const updateChannel = (channel: keyof NotificationPreferences, field: keyof ChannelPreference, value: boolean | Frequency) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--cms-border)] bg-[var(--cms-surface)] px-4 py-3 text-sm text-[var(--cms-text-secondary)] italic">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Chargement des préférences…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(
        [
          {
            id: "sales" as const,
            title: "Ventes confirmées",
            description: "Soyez alerté dès qu’une vente est payée depuis votre boutique.",
          },
          {
            id: "leads" as const,
            title: "Nouveaux leads",
            description: "Recevez une notification lorsqu’un client laisse ses coordonnées.",
          },
        ] satisfies Array<{ id: keyof NotificationPreferences; title: string; description: string }>
      ).map(({ id, title, description }) => (
        <div key={id} className="rounded-xl border border-[var(--cms-border)] bg-[var(--cms-surface)] p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-base font-medium text-[var(--cms-text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--cms-text-secondary)] mt-1 max-w-md">{description}</p>
            </div>
            <div className="flex gap-3 text-xs">
              <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-medium transition cursor-pointer ${preferences[id].email ? "bg-[var(--cms-surface-hover)] text-[var(--cms-text-primary)] border-[var(--cms-border-active)]" : "bg-[var(--cms-bg)] text-[var(--cms-text-muted)] border-[var(--cms-border)] hover:border-[var(--cms-border-active)] hover:text-[var(--cms-text-secondary)]"
                }`}>
                <input
                  type="checkbox"
                  checked={preferences[id].email}
                  onChange={(event) => updateChannel(id, "email", event.target.checked)}
                  className="rounded border-[var(--cms-border-strong)] bg-white text-[var(--cms-accent-color)] focus:ring-[var(--cms-accent-color)]"
                />
                Email
              </label>
              <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-medium transition cursor-pointer ${preferences[id].sms ? "bg-[var(--cms-surface-hover)] text-[var(--cms-text-primary)] border-[var(--cms-border-active)]" : "bg-[var(--cms-bg)] text-[var(--cms-text-muted)] border-[var(--cms-border)] hover:border-[var(--cms-border-active)] hover:text-[var(--cms-text-secondary)]"
                }`}>
                <input
                  type="checkbox"
                  checked={preferences[id].sms}
                  onChange={(event) => updateChannel(id, "sms", event.target.checked)}
                  className="rounded border-[var(--cms-border-strong)] bg-white text-[var(--cms-accent-color)] focus:ring-[var(--cms-accent-color)]"
                />
                SMS
              </label>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-wide text-[var(--cms-text-secondary)] font-semibold mb-2">Fréquence des alertes</p>
            <div className="grid gap-2 text-xs md:grid-cols-4">
              {(Object.keys(frequencyLabels) as Frequency[]).map((freq) => {
                const active = preferences[id].frequency === freq;
                return (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => updateChannel(id, "frequency", freq)}
                    className={`rounded-lg border px-3 py-2 text-left font-medium transition ${active
                      ? "border-[var(--cms-accent-color)] bg-[var(--cms-surface-hover)] text-[var(--cms-accent-color)]"
                      : "border-[var(--cms-border)] bg-[var(--cms-bg)] text-[var(--cms-text-muted)] hover:border-[var(--cms-border-active)] hover:text-[var(--cms-text-secondary)]"
                      }`}
                  >
                    {frequencyLabels[freq]}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      ))}

      <div className="flex items-center justify-between text-xs pt-4 border-t border-[var(--cms-border)]">
        <button
          type="button"
          onClick={() => setPreferences(defaultPreferences)}
          className="text-[var(--cms-text-secondary)] hover:text-[var(--cms-text-primary)] underline decoration-[var(--cms-text-muted)] transition-colors"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--cms-text-primary)] px-6 py-2.5 font-medium text-[var(--cms-bg)] hover:opacity-90 disabled:opacity-60 transition-colors"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
