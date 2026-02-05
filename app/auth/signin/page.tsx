"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

function SignInContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError("Email ou mot de passe incorrect.");
                setLoading(false);
            } else {
                router.push(callbackUrl);
            }
        } catch (err) {
            setError("Une erreur est survenue.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex justify-center mb-6">
                    <Image
                        src="/logo_blue_cinis.png"
                        alt="Blue Cinis"
                        width={200}
                        height={60}
                        className="opacity-80 hover:opacity-100 transition-opacity"
                    />
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-grand-slang">
                    Connexion
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Accédez à votre espace personnel
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Adresse email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Mot de passe
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Se connecter"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Pas encore de compte ?</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            {/* Note: Registration usually handled via Modal on Home. 
                   Here we could redirect to home or offer a link. 
                   For now, linking to Home with a query param could trigger the modal, 
                   but let's just link to Home. */}
                            <Link
                                href="/"
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" /></div>}>
            <SignInContent />
        </Suspense>
    );
}
