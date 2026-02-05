"use client";
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plug, XCircle } from 'lucide-react';

type Status = {
  connected?: boolean;
  stripeApiAvailable?: boolean;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  requirements?: { disabled_reason?: string | null; current_deadline?: number | null; currently_due_count?: number; eventually_due_count?: number };
};

export default function StripeStatusPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/artist/stripe/status', { cache: 'no-store' });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.error || 'Erreur');
        setStatus(data);
      } catch (e: any) {
        setError(e?.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Chargement du statut…</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!status) return null;

  const conn = !!status.connected;
  const active = conn && status.charges_enabled && status.payouts_enabled;
  const incomplete = conn && !active;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
      {(!conn) && (
        <div>
          <div className="flex items-center gap-2 font-medium text-amber-400">
            <Plug className="h-4 w-4" aria-hidden="true" />
            Stripe non connecté
          </div>
          <p className="text-neutral-400">Connectez votre compte Stripe pour recevoir les paiements.</p>
        </div>
      )}
      {(conn && incomplete) && (
        <div>
          <div className="flex items-center gap-2 font-medium text-amber-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Configuration incomplète
          </div>
          <ul className="mt-1 space-y-1 text-neutral-300">
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Terminez l’onboarding Stripe si nécessaire.
            </li>
            {!status.charges_enabled && (
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                Les paiements ne sont pas encore activés (charges_enabled = false).
              </li>
            )}
            {!status.payouts_enabled && (
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                Les virements ne sont pas encore activés (payouts_enabled = false).
              </li>
            )}
          </ul>
        </div>
      )}
      {(active) && (
        <div>
          <div className="flex items-center gap-2 font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Stripe actif
          </div>
          <p className="text-neutral-400">Votre compte Stripe est prêt pour encaisser et recevoir des virements.</p>
        </div>
      )}
    </div>
  );
}
