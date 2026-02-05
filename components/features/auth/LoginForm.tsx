"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { m, AnimatePresence } from "framer-motion";
import { Mail, Lock, LoaderCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link'; // Importer Link pour "Mot de passe oublié"

// --- Theme & Colors (Synchroniser avec Navbar/global) ---
const primaryColor = '#8baeff';
const primaryColorHover = '#6f98ff';
const textColorSubtle = '#6b7280'; // gray-500
const inputBorderColor = '#D1D5DB'; // gray-300
const inputFocusRingColor = 'rgba(139, 174, 255, 0.3)'; // Light primary color for ring
const errorColor = '#EF4444'; // red-500
const errorBgColor = '#FEF2F2'; // red-50

// --- Props Interface ---
interface LoginFormProps {
    onSuccess?: () => void; // Callback pour fermer le modal
}

// --- Animation Variants ---
const errorVariants: any = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.3, ease: [0.17, 0.55, 0.55, 1] } },
    exit: { opacity: 0, y: -5, height: 0, transition: { duration: 0.2, ease: [0.42, 0, 1, 1] } }
};


export default function LoginForm({ onSuccess }: LoginFormProps) {
    // Renommer 'identifier' en 'email' pour clarifier l'usage avec signIn
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return; // Empêcher double soumission

        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false, // Important: on gère le résultat ici
                email: email, // Passer l'email
                password,
            });

            if (res?.ok && !res?.error) {
                // Succès ! Appeler le callback pour fermer le modal
                if (onSuccess) {
                    onSuccess();
                }
                // Vous pourriez vouloir rafraîchir ou rediriger ici aussi si nécessaire,
                // mais le modal se fermera.
            } else {
                // Gestion des erreurs de signIn
                // res.error peut contenir des messages spécifiques, sinon message générique
                setError(res?.error || "L'adresse e-mail ou le mot de passe est incorrect.");
            }
        } catch (err) {
            // Erreur réseau ou autre
            console.error("Login Error:", err);
            setError("Une erreur s'est produite. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const errorId = "login-error-message";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Email */}
            <div className="relative">
                <label htmlFor="email-login" className="sr-only">
                    Adresse e-mail
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5" style={{ color: textColorSubtle }} />
                </div>
                <input
                    id="email-login"
                    type="email" // Type email pour validation navigateur
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm transition duration-150 ease-in-out text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                        borderColor: error ? errorColor : inputBorderColor,
                        '--tw-ring-color': inputFocusRingColor, // Pour le focus ring de Tailwind
                        // Optionnel: background légèrement différent
                        // backgroundColor: '#F9FAFB' // gray-50
                    } as any}
                    placeholder="votreadresse@email.com"
                    required
                    disabled={loading}
                    aria-invalid={!!error} // Indicateur d'erreur pour l'accessibilité
                    aria-describedby={error ? errorId : undefined}
                />
            </div>

            {/* Champ Mot de passe */}
            <div className="relative">
                <label htmlFor="password-login" className="sr-only">
                    Mot de passe
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5" style={{ color: textColorSubtle }} />
                </div>
                <input
                    id="password-login"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border rounded-lg shadow-sm transition duration-150 ease-in-out text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                        borderColor: error ? errorColor : inputBorderColor,
                        '--tw-ring-color': inputFocusRingColor,
                    } as any}
                    placeholder="Votre mot de passe"
                    required
                    disabled={loading}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                />
            </div>

            {/* Affichage de l'erreur */}
            <AnimatePresence>
                {error && (
                    <m.div
                        id={errorId} // ID pour aria-describedby
                        className="flex items-center p-3 rounded-md text-sm"
                        style={{ backgroundColor: errorBgColor, color: errorColor }}
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="alert" // Rôle pour l'accessibilité
                    >
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Bouton de connexion */}
            <m.button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: primaryColor,
                    '--tw-ring-color': inputFocusRingColor, // Focus ring color
                } as any}
                whileHover={{ scale: loading ? 1 : 1.03, backgroundColor: loading ? primaryColor : primaryColorHover }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Connexion...
                    </>
                ) : (
                    "Se connecter"
                )}
            </m.button>

            {/* Lien Mot de passe oublié */}
            <div className="text-center text-sm mt-4">
                <Link
                    href="/reset-password"
                    className="font-medium transition-colors duration-200"
                    style={{ color: textColorSubtle }}
                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColorHover}
                    onMouseLeave={(e) => e.currentTarget.style.color = textColorSubtle}
                >
                    Mot de passe oublié ?
                </Link>
            </div>

            {/* Liens d'inscription supprimés (déplacés à l'extérieur du modal) */}
            {/* <div className="flex justify-end space-x-4 text-sm mt-4"> ... </div> */}
        </form>
    );
}
