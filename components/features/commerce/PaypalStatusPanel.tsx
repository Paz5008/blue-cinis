"use client";
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Wallet } from 'lucide-react';

type PaypalStatus = {
  configured?: boolean;
  env?: 'sandbox' | 'live' | 'unknown';
  error?: string;
};

export default function PaypalStatusPanel() {
  const [status, setStatus] = useState<PaypalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/payments/paypal/status', { cache: 'no-store' });
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

  if (loading) return <div className="text-sm text-neutral-500">Chargement PayPal…</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!status) return null;

  const configured = !!status.configured;
  const env = status.env || 'unknown';

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="h-4 w-4 text-neutral-300" aria-hidden="true" />
        <span className="font-medium text-white">PayPal</span>
      </div>
      {configured ? (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Activé côté plateforme ({env === 'live' ? 'production' : 'sandbox'})
        </div>
      ) : (
        <div className="flex items-center gap-2 text-neutral-400">
          <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
          Non configuré côté plateforme
        </div>
      )}
      {!configured && (
        <div className="mt-1 flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Lecture seule: aucun paramétrage requis par l’artiste
        </div>
      )}
    </div>
  );
}
