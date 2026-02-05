import { auth } from "@/auth";
import Link from 'next/link';
import { User, Mail, MapPin, Shield, Lock, Trash2 } from 'lucide-react';
import { redirect } from "next/navigation";

export default async function BuyerSettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin");
    }

    const user = session.user;

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-heading font-medium text-gray-900">Paramètres</h1>

            {/* Profil Public */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                    <User size={20} className="text-gray-400" /> Profil
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nom complet</label>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                                {user.name || "Non renseigné"}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Email</label>
                            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500 border border-gray-200 flex items-center justify-between" title="Non modifiable">
                                {user.email}
                                <Lock size={14} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Pour modifier ces informations, veuillez contacter le support ou utiliser le bouton de connexion si géré par un tiers (Google, etc.).
                    </p>
                </div>
            </div>

            {/* Adresses */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-gray-400" /> Adresses
                </h2>
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm mb-2">Vos adresses sont enregistrées automatiquement lors de vos commandes.</p>
                    <Link href="/compte/commandes" className="text-blue-600 hover:underline text-sm font-medium">
                        Voir mes dernières livraisons
                    </Link>
                </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-gray-400" /> Sécurité
                </h2>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">Mot de passe</h3>
                        <p className="text-xs text-gray-500">Vous avez oublié votre mot de passe ?</p>
                    </div>
                    <Link
                        href="/reset-password"
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Réinitialiser
                    </Link>
                </div>
            </div>

            {/* Zone de danger */}
            <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6">
                <h2 className="text-lg font-medium text-red-900 mb-2 flex items-center gap-2">
                    <Trash2 size={20} className="text-red-400" /> Zone de danger
                </h2>
                <p className="text-sm text-red-700 mb-4">
                    La suppression de compte est irrémédiable. Toutes vos données seront effacées.
                </p>
                <button
                    disabled
                    className="text-sm text-red-600 font-medium hover:underline opacity-50 cursor-not-allowed"
                    title="Veuillez contacter le support pour supprimer votre compte."
                >
                    Supprimer mon compte
                </button>
            </div>

        </div>
    );
}
