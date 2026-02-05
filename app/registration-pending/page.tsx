import Link from "next/link";
import React from "react";

export default function RegistrationPendingPage() {
    return (
        <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl">
                    ⏳
                </div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">
                    Candidature Reçue
                </h1>
                <p className="text-slate-600">
                    Merci pour votre intérêt. Votre dossier d'artiste a bien été transmis à notre équipe de curation.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 text-left space-y-2">
                    <p><strong>Prochaines étapes :</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>Examen du portfolio sous 72h ouvrées</li>
                        <li>Validation de votre statut Artiste</li>
                        <li>Accès débloqué au Dashboard</li>
                    </ul>
                </div>
                <p className="text-sm text-slate-500">
                    Vous recevrez un email de confirmation dès que votre compte sera actif.
                </p>
                <div className="pt-4">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
