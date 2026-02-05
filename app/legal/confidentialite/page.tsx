export const metadata = {
    title: "Politique de Confidentialité",
    description: "Politique de confidentialité et protection des données personnelles sur Blue Cinis.",
};

export default function ConfidentialitePage() {
    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 font-inter">
            <div className="max-w-3xl mx-auto space-y-12">
                <h1 className="text-4xl md:text-5xl font-grand-slang mb-12">Politique de Confidentialité</h1>

                <div className="space-y-4 text-white/60 leading-relaxed">
                    <p>
                        La présente politique de confidentialité définit et vous informe de la manière dont <strong>Blue Cinis</strong> utilise et protège les informations que vous nous transmettez, le cas échéant, lorsque vous utilisez le présent site accessible à partir de l&apos;URL suivante : www.blue-cinis.com (ci-après le &quot;Site&quot;).
                    </p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">1. Responsable du Traitement</h2>
                    <p className="text-white/60 leading-relaxed">
                        Le responsable du traitement des données personnelles collectées sur le site est :<br />
                        <strong>[Nom de la Société]</strong><br />
                        Adresse : [Adresse du siège]<br />
                        Email : contact@blue-cinis.com
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">2. Données Collectées</h2>
                    <p className="text-white/60 leading-relaxed">
                        Dans le cadre de l&apos;utilisation du Site, nous sommes amenés à collecter et traiter les données suivantes :
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-white/60 leading-relaxed">
                        <li><strong>Identité et Coordonnées :</strong> Nom, prénom, adresse email, adresse postale (livraison et facturation), numéro de téléphone.</li>
                        <li><strong>Données de Paiement :</strong> Les transactions sont gérées intégralement par notre prestataire de paiement sécurisé <strong>Stripe</strong>. Nous ne stockons pas vos numéros de carte bancaire, mais conservons un historique des transactions.</li>
                        <li><strong>Données de Connexion :</strong> Adresse IP, logs de connexion, type de navigateur (via nos outils de sécurité et d&apos;analyse).</li>
                        <li><strong>Pour les Artistes :</strong> Informations professionnelles, portfolio, biographie, RIB/IBAN (via Stripe Connect) pour les versements.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">3. Finalités du Traitement</h2>
                    <p className="text-white/60 leading-relaxed">
                        Vos données sont collectées pour les finalités suivantes :
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-white/60 leading-relaxed">
                        <li><strong>Gestion des Commandes :</strong> Traitement, paiement, et expédition des œuvres.</li>
                        <li><strong>Relation Client :</strong> Suivi des commandes, gestion des réclamations et support.</li>
                        <li><strong>Reversement Artistes :</strong> Calcul et versement des montants dus aux artistes vendeurs.</li>
                        <li><strong>Sécurité :</strong> Détection des fraudes, sécurisation des accès (via Google reCAPTCHA notamment).</li>
                        <li><strong>Amélioration du Service :</strong> Analyse statistique anonyme de la fréquentation du site.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">4. Destinataires des Données</h2>
                    <p className="text-white/60 leading-relaxed">
                        Seul Blue Cinis est destinataire de vos Informations Personnelles. Celles-ci, que ce soit sous forme individuelle ou agrégée, ne sont jamais transmises à un tiers, nonobstant les sous-traitants auxquels Blue Cinis fait appel.
                        <br /><br />
                        <strong>Important pour la Marketplace :</strong> Dans le cadre d&apos;une commande, les coordonnées de l&apos;Acheteur (Nom, Adresse de livraison, Téléphone) sont transmises à l&apos;<strong>Artiste vendeur</strong> aux seules fins de l&apos;expédition de l&apos;œuvre.
                        <br /><br />
                        Nos sous-traitants principaux sont :
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-white/60 leading-relaxed">
                        <li><strong>Vercel (USA) :</strong> Hébergement du site.</li>
                        <li><strong>Stripe (USA) :</strong> Gestion des paiements sécurisés.</li>
                        <li><strong>Cloudinary (USA) :</strong> Hébergement des images.</li>
                        <li><strong>Sentry (USA) :</strong> Monitoring technique et gestion des erreurs.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">5. Durée de Conservation</h2>
                    <ul className="list-disc pl-5 mt-2 space-y-2 text-white/60 leading-relaxed">
                        <li><strong>Données de commande :</strong> 10 ans (obligation légale comptable).</li>
                        <li><strong>Compte inactif :</strong> 3 ans à compter de la dernière activité.</li>
                        <li><strong>Données marketing :</strong> 3 ans à compter du dernier contact.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">6. Vos Droits</h2>
                    <p className="text-white/60 leading-relaxed">
                        Conformément à la réglementation (RGPD), vous disposez des droits suivants concernant vos Informations Personnelles : droit d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement, de portabilité.
                        <br /><br />
                        Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse suivante : <strong>contact@blue-cinis.com</strong>.
                    </p>
                </section>
            </div>
        </div>
    );
}
