"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type Health = {
  ok: boolean;
  issues?: string[];
  warnings?: string[];
  env?: string;
};

export default function SystemStatusBadge({ className }: { className?: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json();
        if (mounted) setHealth(data);
      } catch {
        if (mounted) setHealth({ ok: false, issues: ["Health endpoint unreachable"] });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const ok = !!health?.ok;
  const hasWarnings = (health?.warnings?.length || 0) > 0;
  const statusLabel = loading
    ? "Vérification du système..."
    : ok
      ? hasWarnings
        ? `Système opérationnel avec avertissements : ${(health?.warnings || []).join(', ')}`
        : "Système opérationnel"
      : `Problèmes détectés : ${(health?.issues || []).join(', ')}`;

  if (!loading && ok && !hasWarnings) {
    return null;
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-full bg-white/50 px-2.5 py-1 text-xs text-gray-700 shadow-sm backdrop-blur-sm",
        "dark:bg-slate-900/50 dark:text-slate-100",
        className
      )}
      title={statusLabel}
      aria-live="polite"
    >
      <span className="sr-only">Statut système</span>
      <span
        className={clsx(
          "inline-block h-2.5 w-2.5 rounded-full",
          loading && "bg-gray-300 animate-pulse",
          !loading && ok && hasWarnings && "bg-amber-400",
          !loading && !ok && "bg-red-500"
        )}
        aria-label={loading ? "Vérification du système" : ok ? "Système avec avertissements" : "Système avec problèmes"}
      />
      <span>
        {loading ? "Vérification" : ok ? "Avertissements" : "Problèmes"}
      </span>
    </div>
  );
}
