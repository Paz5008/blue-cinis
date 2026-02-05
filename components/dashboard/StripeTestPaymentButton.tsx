"use client";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function StripeTestPaymentButton() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/artist/stripe/test-session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Impossible de créer la session de test");
      if (data?.url) {
        window.open(data.url as string, "_blank", "noopener");
        addToast("Session test ouverte dans un nouvel onglet", "info");
      } else {
        throw new Error("URL de session introuvable");
      }
    } catch (error: any) {
      addToast(error?.message || "Erreur lors de la création de la session test", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
      {loading ? "Création de la session…" : "Tester un paiement"}
    </button>
  );
}
