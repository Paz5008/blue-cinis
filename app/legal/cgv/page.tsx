export const metadata = {
    title: "Conditions Générales de Vente",
    description: "Conditions générales de vente (CGV) de la marketplace Blue Cinis.",
};

export default function CGVPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 font-inter">
            <div className="max-w-3xl mx-auto space-y-12">
                <h1 className="text-4xl md:text-5xl font-grand-slang mb-12">Conditions Générales de Vente (CGV)</h1>

                <div className="space-y-4 text-white/60 leading-relaxed">
                    <p>
                        Les présentes Conditions Générales de Vente (ci-après &quot;CGV&quot;) régissent l&apos;ensemble des transactions effectuées sur le site <strong>Blue Cinis</strong>.
                        En passant commande sur le Site, le Client accepte sans réserve les présentes CGV.
                    </p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">1. Rôle de Blue Cinis (Marketplace)</h2>
                    <p className="text-white/60 leading-relaxed">
                        Le Service proposé par Blue Cinis est une plateforme de mise en relation (Marketplace) entre des <strong>Acheteurs</strong> et des <strong>Artistes Vendeurs</strong>.
                        <br /><br />
                        <strong>Blue Cinis intervient en tant qu&apos;intermédiaire technique et tiers de confiance.</strong>
                        En conséquence, le contrat de vente de l&apos;œuvre d&apos;art est conclu exclusivement et directement entre l&apos;Acheteur et l&apos;Artiste. Blue Cinis n&apos;est pas le vendeur des œuvres proposées (sauf mention expresse contraire) et ne saurait être tenu responsable des défauts ou non-conformités des produits vendus par les Artistes.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">2. Prix et Paiement</h2>
                    <p className="text-white/60 leading-relaxed">
                        Les prix des œuvres sont indiqués en Euros (€) et sont fixés librement par les Artistes. Ils s&apos;entendent hors frais de livraison, lesquels sont précisés avant la validation finale de la commande.
                        <br /><br />
                        Le règlement des achats s&apos;effectue via le système de paiement sécurisé <strong>Stripe</strong>. Le débit est effectué au moment de la commande. Les fonds sont séquestrés le temps de la validation de la commande par l&apos;Artiste, puis reversés à ce dernier.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">3. Expédition et Livraison</h2>
                    <p className="text-white/60 leading-relaxed">
                        L&apos;expédition des œuvres est assurée directement par l&apos;Artiste.
                        <br /><br />
                        L&apos;Artiste s&apos;engage à expédier les œuvres dans le délai indiqué sur la fiche produit (généralement sous 3 à 7 jours ouvrés) et à les emballer avec le plus grand soin.
                        L&apos;Acheteur est informé par email de l&apos;expédition de sa commande. En cas de retard ou de problème de livraison, l&apos;Acheteur doit contacter le service client de Blue Cinis qui fera l&apos;intermédiaire avec l&apos;Artiste.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">4. Droit de Rétractation</h2>
                    <p className="text-white/60 leading-relaxed">
                        Conformément à l&apos;article L.221-18 du Code de la Consommation, l&apos;Acheteur (s&apos;il réside dans l&apos;Espace Économique Européen) dispose d&apos;un délai de <strong>14 jours</strong> à compter de la réception de l&apos;œuvre pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités.
                        <br /><br />
                        <strong>Modalités de retour :</strong>
                        L&apos;Acheteur doit notifier sa décision de rétractation à Blue Cinis par email. L&apos;œuvre doit être retournée à l&apos;Artiste, dans son emballage d&apos;origine et en parfait état.
                        Sauf mention contraire ou défaut de conformité avéré, <strong>les frais de retour sont à la charge de l&apos;Acheteur.</strong>
                        Le remboursement sera effectué après réception et vérification de l&apos;œuvre par l&apos;Artiste.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">5. Garanties et Responsabilités</h2>
                    <p className="text-white/60 leading-relaxed">
                        Les Artistes sont tenus des garanties légales de conformité et des vices cachés pour les œuvres qu&apos;ils vendent.
                        Blue Cinis, en sa qualité d&apos;intermédiaire, ne saurait voir sa responsabilité engagée pour l&apos;inexécution du contrat conclu entre l&apos;Acheteur et l&apos;Artiste, notamment en cas de force majeure.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">6. Droit Applicable</h2>
                    <p className="text-white/60 leading-relaxed">
                        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
                    </p>
                </section>
            </div>
        </div>
    );
}
