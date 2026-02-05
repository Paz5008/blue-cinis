"use client";

import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

type ClientFormState = {
  name: string;
  email: string;
  phone: string;
  project: string;
};

type ReCAPTCHAHandle = {
  reset: () => void;
};

const INITIAL_STATE: ClientFormState = {
  name: "",
  email: "",
  phone: "",
  project: "",
};

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RegistrationClientForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState<ClientFormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(!recaptchaSiteKey);
  const [manualHumanCheck, setManualHumanCheck] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState("");
  const captchaRef = useRef<ReCAPTCHAHandle | null>(null);

  const handleChange = (field: keyof ClientFormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (honeypotValue.trim().length > 0) {
        setSuccess("Merci, nous avons bien reçu votre message.");
        setLoading(false);
        return;
      }
      const captchaBypassed = showManualFallback && manualHumanCheck;
      if (recaptchaSiteKey && !captchaValue && !captchaBypassed) {
        setError("Merci de confirmer que vous n'êtes pas un robot.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/registration-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client",
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.project,
          recaptchaToken: captchaValue ?? undefined,
          manualHumanCheck: captchaBypassed || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "registration_failed");
      }
      setSuccess("Votre demande a bien été transmise. Un conseiller vous répondra dans la journée.");
      setForm(INITIAL_STATE);
      setCaptchaValue(null);
      setManualHumanCheck(false);
      setShowManualFallback(!recaptchaSiteKey);
      setHoneypotValue("");
      if (recaptchaSiteKey) {
        captchaRef.current?.reset();
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="customer-company">Ne pas remplir ce champ</label>
        <input
          id="customer-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValue}
          onChange={(e) => setHoneypotValue(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom complet</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name")(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email")(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Téléphone (optionnel)</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone")(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Projet ou besoin</label>
        <textarea
          value={form.project}
          onChange={(e) => handleChange("project")(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          rows={4}
          placeholder="Visite privée, commande spécifique, assurance, etc."
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
        {recaptchaSiteKey ? (
          <>
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={recaptchaSiteKey}
              onChange={(value: string | null) => setCaptchaValue(value)}
              onErrored={() => setShowManualFallback(true)}
            />
            {!showManualFallback ? (
              <button
                type="button"
                onClick={() => setShowManualFallback(true)}
                className="text-xs font-medium text-blue-600 underline"
              >
                reCAPTCHA ne se charge pas ? Activer le plan B.
              </button>
            ) : null}
          </>
        ) : (
          <p>
            Aucun reCAPTCHA n’est chargé, mais un contrôle manuel reste actif pour bloquer les robots.
          </p>
        )}
        {showManualFallback && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={manualHumanCheck}
              onChange={(e) => setManualHumanCheck(e.target.checked)}
            />
            <span>Je confirme envoyer cette demande sans automatisation.</span>
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded border border-[#91B2FD] px-4 py-2 text-[#91B2FD] transition hover:bg-white/80 disabled:opacity-60"
      >
        {loading ? "Envoi en cours..." : "Envoyer ma demande"}
      </button>
    </form>
  );
}
