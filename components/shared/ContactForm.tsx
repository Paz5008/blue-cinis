"use client";

import { useState } from 'react';
import { m } from 'framer-motion';
import CTA from './CTA';
import { useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { useToast } from '@/context/ToastContext';
import type ReCAPTCHAType from 'react-google-recaptcha';

// Lazy load ReCAPTCHA pour réduire le bundle initial
const ReCAPTCHA = dynamic<React.ComponentProps<typeof ReCAPTCHAType>>(
    () => import('react-google-recaptcha').then(mod => mod.default as any),
    {
        ssr: false,
        loading: () => <div className="h-[78px] w-[304px] bg-white/5 rounded animate-pulse" />
    }
);

type FormData = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export interface ContactFormProps {
    variant?: 'default' | 'minimal' | 'boxed' | 'floating' | 'dark';
    submitLabel?: string;
    showSubject?: boolean;
    className?: string;
}

export default function ContactForm({
    variant = 'default',
    submitLabel = "Envoyer le message",
    showSubject = true,
    className
}: ContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [captchaValue, setCaptchaValue] = useState<string | null>(null);
    const [captchaKey, setCaptchaKey] = useState(0); // Pour forcer le remontage du ReCAPTCHA
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showManualFallback, setShowManualFallback] = useState(!recaptchaSiteKey);
    const [manualHumanCheck, setManualHumanCheck] = useState(false);
    const [honeypotValue, setHoneypotValue] = useState("");
    const { addToast } = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FormData>();

    // VARIANT STYLES CONFIGURATION
    const getStyles = () => {
        const baseInput = "input w-full transition duration-200";

        switch (variant) {
            case 'minimal':
                return {
                    container: "max-w-xl mx-auto",
                    input: `${baseInput} border-b-2 border-gray-200 bg-transparent py-3 px-0 focus:border-black rounded-none placeholder:text-gray-400`,
                    label: "block text-xs uppercase tracking-widest font-bold text-gray-500 mb-2",
                    button: "btn btn-outline w-full rounded-none tracking-widest text-xs py-4 font-bold",
                    error: "text-red-500 text-xs mt-1"
                };
            case 'boxed':
                return {
                    container: "bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-xl mx-auto",
                    input: `${baseInput} px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`,
                    label: "block text-sm font-semibold text-gray-700 mb-1.5",
                    button: "btn btn-primary w-full rounded-lg shadow-lg shadow-blue-600/20",
                    error: "text-red-500 text-xs mt-1 ml-1"
                };
            case 'floating':
                return {
                    container: "max-w-xl mx-auto bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-sm", // Slight transparency
                    input: `${baseInput} px-4 pt-6 pb-2 rounded-lg border border-gray-300 bg-white/80 focus:ring-2 focus:ring-black/5 focus:border-black peer placeholder-transparent`,
                    label: "absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-black",
                    button: "btn w-full bg-black text-white hover:bg-gray-800 rounded-lg",
                    error: "text-red-500 text-xs mt-1 pl-4"
                };
            case 'default':
            default:
                return {
                    container: "max-w-2xl mx-auto",
                    input: `${baseInput} input-bordered focus:input-primary bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white`,
                    label: "block text-gray-700 font-medium mb-1 dark:text-gray-300",
                    button: "", // Uses standard CTA component style
                    error: "text-red-500 text-sm mt-1"
                };
            case 'dark':
                return {
                    container: "max-w-xl mx-auto",
                    input: `${baseInput} px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 focus:bg-white/[0.05]`,
                    label: "block text-sm font-medium text-white/70 mb-2",
                    button: "w-full py-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
                    error: "text-red-400 text-xs mt-1.5 pl-1"
                };
        }
    };

    const styles = getStyles();

    const onSubmit = async (data: FormData) => {
        setStatusMessage(null);
        if (honeypotValue.trim().length > 0) {
            addToast("Merci, votre message a déjà été envoyé.", 'error');
            return;
        }
        const captchaBypassed = showManualFallback && manualHumanCheck;
        if (!captchaValue && !captchaBypassed && recaptchaSiteKey) {
            addToast("Veuillez valider le captcha", 'error');
            setStatusMessage({ type: 'error', text: "Veuillez valider le captcha ou utiliser le fallback manuel." });
            return;
        }
        setIsSubmitting(true);

        try {
            const payload = {
                name: data.name,
                email: data.email,
                message: data.subject ? `[${data.subject}] ${data.message}` : data.message,
                recaptchaToken: captchaValue || undefined,
                manualHumanCheck: captchaBypassed || undefined,
            };
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body?.error || "Erreur lors de l'envoi du formulaire");
            }

            addToast("Message envoyé avec succès !", 'success');
            setStatusMessage({ type: 'success', text: "Merci pour votre message, nous revenons vers vous rapidement." });
            reset();
            setCaptchaValue(null);
            setCaptchaKey(k => k + 1); // Force le remontage du ReCAPTCHA
            setManualHumanCheck(false);
            setShowManualFallback(!recaptchaSiteKey);
            setHoneypotValue("");
        } catch (error) {
            addToast("Une erreur est survenue. Veuillez réessayer.", 'error');
            console.error("Erreur d'envoi du formulaire:", error);
            setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : "Une erreur est survenue." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`${styles.container} ${className || ''}`}
        >
            <form
                onSubmit={handleSubmit(onSubmit)}
                className={`relative ${variant === 'minimal' ? 'space-y-8' : 'space-y-6'}`}
            >
                {/* Honeypot */}
                <div className="absolute -left-[9999px] top-auto">
                    <label htmlFor="company" aria-hidden="true">Ne pas remplir ce champ</label>
                    <input
                        id="company"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypotValue}
                        onChange={(e) => setHoneypotValue(e.target.value)}
                        className="border border-gray-200 px-2 py-1"
                    />
                </div>

                {/* Name & Email Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className={variant === 'floating' ? 'relative' : ''}>
                        {variant !== 'floating' && <label htmlFor="name" className={styles.label}>Nom complet</label>}
                        <input
                            id="name"
                            type="text"
                            className={`${styles.input} ${errors.name ? (variant === 'dark' ? "border-red-500/50" : "border-red-500") : ""}`}
                            placeholder={variant === 'floating' ? "Votre nom" : (variant === 'dark' ? "Votre nom" : "Votre nom complet")}
                            {...register("name", { required: "Ce champ est requis" })}
                        />
                        {variant === 'floating' && <label htmlFor="name" className={styles.label}>Nom complet</label>}
                        {errors.name && <p className={styles.error}>{errors.name.message}</p>}
                    </div>

                    <div className={variant === 'floating' ? 'relative' : ''}>
                        {variant !== 'floating' && <label htmlFor="email" className={styles.label}>Email</label>}
                        <input
                            id="email"
                            type="email"
                            className={`${styles.input} ${errors.email ? (variant === 'dark' ? "border-red-500/50" : "border-red-500") : ""}`}
                            placeholder="votre@email.com"
                            {...register("email", {
                                required: "Ce champ est requis",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Email invalide"
                                }
                            })}
                        />
                        {variant === 'floating' && <label htmlFor="email" className={styles.label}>Email</label>}
                        {errors.email && <p className={styles.error}>{errors.email.message}</p>}
                    </div>
                </div>

                {/* Subject (Conditional) */}
                {showSubject && (
                    <div className={variant === 'floating' ? 'relative' : ''}>
                        {variant !== 'floating' && <label htmlFor="subject" className={styles.label}>Sujet</label>}
                        <input
                            id="subject"
                            type="text"
                            className={`${styles.input} ${errors.subject ? (variant === 'dark' ? "border-red-500/50" : "border-red-500") : ""}`}
                            placeholder={variant === 'floating' ? "Le sujet de votre message" : (variant === 'dark' ? "Sujet de votre message" : "Sujet de votre message")}
                            {...register("subject", { required: "Ce champ est requis" })}
                        />
                        {variant === 'floating' && <label htmlFor="subject" className={styles.label}>Sujet</label>}
                        {errors.subject && <p className={styles.error}>{errors.subject.message}</p>}
                    </div>
                )}

                {/* Message */}
                <div className={variant === 'floating' ? 'relative' : ''}>
                    {variant !== 'floating' && <label htmlFor="message" className={styles.label}>Message</label>}
                    <textarea
                        id="message"
                        rows={variant === 'minimal' ? 1 : 5}
                        className={`${styles.input} min-h-[100px] resize-y`}
                        placeholder={variant === 'floating' ? "Message..." : "Votre message..."}
                        {...register("message", { required: "Ce champ est requis" })}
                    // Auto-expand for minimal could be added here
                    ></textarea>
                    {variant === 'floating' && <label htmlFor="message" className={styles.label}>Message</label>}
                    {errors.message && <p className={styles.error}>{errors.message.message}</p>}
                </div>

                {/* Anti-Spam & Status */}
                <div className="space-y-2">
                    {recaptchaSiteKey ? (
                        <>
                            <div className="transform scale-90 origin-left">
                                <ReCAPTCHA
                                    key={captchaKey}
                                    sitekey={recaptchaSiteKey}
                                    onChange={(value: string | null) => setCaptchaValue(value)}
                                    onErrored={() => setShowManualFallback(true)}
                                />
                            </div>
                            {!showManualFallback && (
                                <button
                                    type="button"
                                    onClick={() => setShowManualFallback(true)}
                                    className="text-xs text-blue-600 underline hover:text-blue-500"
                                >
                                    Problème d'affichage ? Vérification manuelle.
                                </button>
                            )}
                        </>
                    ) : null}
                    {/* Manual Checkbox omitted for brevity in minimal UI unless needed */}
                    {showManualFallback && (
                        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-900 transition-colors">
                            <input
                                type="checkbox"
                                checked={manualHumanCheck}
                                onChange={(e) => setManualHumanCheck(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span>Je confirme être un humain.</span>
                        </label>
                    )}
                </div>

                {statusMessage ? (
                    <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-4 rounded-xl text-sm ${statusMessage.type === 'success'
                            ? (variant === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700')
                            : (variant === 'dark' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600')
                            }`}
                    >
                        {statusMessage.text}
                    </m.div>
                ) : null}

                {/* Submit Button */}
                <div className={variant === 'minimal' ? '' : 'flex justify-end'}>
                    {variant === 'default' ? (
                        <m.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <CTA
                                type="submit"
                                variant="primary"
                                size="md"
                                className={isSubmitting ? 'opacity-70 pointer-events-none' : ''}
                            >
                                {isSubmitting ? "Envoi..." : submitLabel}
                            </CTA>
                        </m.div>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${styles.button} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? "Envoi en cours..." : submitLabel}
                        </button>
                    )}
                </div>
            </form>
        </m.div>
    );
}
