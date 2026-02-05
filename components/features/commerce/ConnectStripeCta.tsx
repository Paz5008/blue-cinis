"use client";
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';

export default function ConnectStripeCta() {
  const { addToast } = useToast();
  const [needsConnect, setNeedsConnect] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/artist/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const artist = await res.json();
        if (!mounted) return;
        const has = !!artist?.stripeAccountId;
        setNeedsConnect(!has);
      } catch {}
    }
    check();
    return () => { mounted = false; };
  }, []);

  const startOnboarding = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/artist/stripe/account-link', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Impossible de créer le lien Connect');
      if (data?.url) window.location.href = data.url as string; else throw new Error('URL indisponible');
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
      addToast(e?.message || 'Impossible d’ouvrir l’onboarding Stripe', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!needsConnect) {
    return (
      <div className="mt-4 p-3 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm">
        <span className="font-semibold">Stripe connecté</span>
        <span className="ml-2">Votre compte est prêt à recevoir les paiements.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded border border-amber-300 bg-amber-50 text-amber-900">
      <div className="font-semibold mb-1">Finaliser vos paiements</div>
      <p className="text-sm mb-2">Connectez votre compte Stripe pour recevoir vos paiements (commission 7% appliquée automatiquement).</p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex items-center gap-2">
        <button onClick={startOnboarding} disabled={loading}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Ouverture…' : 'Connecter mon compte Stripe'}
        </button>
        <a href="https://stripe.com/connect" target="_blank" rel="noreferrer" className="text-sm underline">En savoir plus</a>
      </div>
    </div>
  );
}
