"use client";

import { useState, useRef, useEffect } from "react";
import { m, useScroll, useTransform } from "framer-motion";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitState = "idle" | "loading" | "success" | "error";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [50, 0, 0, -30]);

  // Inline validation
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setValidationError("");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setValidationError("Adresse email invalide");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Only show validation after user has typed enough
    if (value.length > 3) {
      validateEmail(value);
    } else {
      setValidationError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate before submit
    if (!validateEmail(email)) {
      inputRef.current?.focus();
      return;
    }

    setSubmitState("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitState("error");
        setErrorMessage(data.error || "Une erreur est survenue");
        return;
      }

      setSubmitState("success");
      setEmail("");
    } catch (error) {
      setSubmitState("error");
      setErrorMessage("Connexion impossible. Veuillez réessayer.");
    }
  };

  const isDisabled = submitState === "loading" || submitState === "success";

  return (
    <section
      ref={sectionRef}
      className="relative z-20 overflow-hidden"
      aria-label="Newsletter subscription"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#0a0a0a] to-black" aria-hidden="true" />

      {/* Decorative elements - respect reduced motion */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
        {!prefersReducedMotion ? (
          <>
            <m.div
              className="w-[600px] h-[600px] border border-white/[0.03] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <m.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/10 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            />
          </>
        ) : (
          <>
            <div className="w-[600px] h-[600px] border border-white/[0.03] rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/10 rounded-full" />
          </>
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-900/20 blur-[100px] rounded-full" />
      </div>

      <m.div
        className="container mx-auto px-6 max-w-3xl text-center relative z-10"
        style={prefersReducedMotion ? {} : { opacity, y }}
      >

        {/* Label */}
        <m.span
          className="inline-flex items-center gap-3 text-blue-400 font-mono text-xs tracking-[0.4em] uppercase mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
        >
          <span className="w-8 h-[1px] bg-blue-400" aria-hidden="true" />
          Stay connected
          <span className="w-8 h-[1px] bg-blue-400" aria-hidden="true" />
        </m.span>

        {/* Headline */}
        <m.h2
          className="text-4xl md:text-6xl lg:text-7xl font-grand-slang text-white mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
        >
          Join our
          <br />
          <span className="text-white/40">inner circle</span>
        </m.h2>

        {/* Subhead */}
        <m.p
          className="text-white/60 text-lg md:text-xl mb-16 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
        >
          Exclusive previews, private viewings, and first access to new collections.
        </m.p>

        {/* Form */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
        >
          {submitState !== "success" ? (
            <form
              onSubmit={handleSubmit}
              className="relative max-w-xl mx-auto"
              noValidate
            >
              <div
                className={`relative flex items-center border-b-2 transition-colors duration-300 ${validationError
                  ? 'border-red-500/50'
                  : isFocused
                    ? 'border-white/30'
                    : 'border-white/10'
                  }`}
              >
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="votre@email.com"
                  disabled={isDisabled}
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? "email-error" : undefined}
                  className="w-full bg-transparent py-6 text-xl md:text-2xl text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={isDisabled || !email}
                  className="absolute right-0 flex items-center gap-3 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  aria-label="S'inscrire à la newsletter"
                >
                  {submitState === "loading" ? (
                    <span className="animate-pulse">Envoi...</span>
                  ) : (
                    <>
                      <span className="hidden md:inline text-sm tracking-wide group-hover:translate-x-[-5px] transition-transform">
                        Subscribe
                      </span>
                      <m.div
                        className="w-12 h-12 border border-current rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all"
                        whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                      >
                        →
                      </m.div>
                    </>
                  )}
                </button>
              </div>

              {/* Validation error */}
              {validationError && (
                <p
                  id="email-error"
                  className="text-red-400 text-sm mt-3 text-left"
                  role="alert"
                >
                  {validationError}
                </p>
              )}

              {/* API error */}
              {submitState === "error" && errorMessage && (
                <p className="text-red-400 text-sm mt-3" role="alert">
                  {errorMessage}
                </p>
              )}

              {/* Privacy note */}
              <p className="text-white/30 text-xs mt-6">
                En vous inscrivant, vous acceptez notre{" "}
                <a href="/legal/confidentialite" className="underline hover:text-white/50 transition-colors">
                  politique de confidentialité
                </a>
                .
              </p>
            </form>
          ) : (
            /* Success state */
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-4xl"
                >
                  ✓
                </m.span>
              </div>
              <h3 className="text-2xl md:text-3xl font-grand-slang text-white mb-4">
                Bienvenue dans le cercle !
              </h3>
              <p className="text-white/50">
                Vous recevrez bientôt nos dernières actualités.
              </p>
            </m.div>
          )}
        </m.div>
      </m.div>
    </section>
  );
}
