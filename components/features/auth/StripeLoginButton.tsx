"use client";
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

export default function StripeLoginButton() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/artist/stripe/login-link', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de créer le lien Stripe');
      }
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        throw new Error('Lien non disponible');
      }
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
      addToast(e?.message || 'Connexion Stripe indisponible', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button onClick={handleClick} disabled={loading}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60">
        {loading ? 'Connexion Stripe…' : 'Se connecter à Stripe'}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
