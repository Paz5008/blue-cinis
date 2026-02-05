export const metadata = {
    title: "Mentions Légales",
    description: "Mentions légales, éditeur et hébergeur de la marketplace Blue Cinis.",
};

export default function MentionsLegalesPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 font-inter">
            <div className="max-w-3xl mx-auto space-y-12">
                <h1 className="text-4xl md:text-5xl font-grand-slang mb-12">Mentions Légales</h1>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">1. Éditeur du Site</h2>
                    <p className="text-white/60 leading-relaxed">
                        Le site <strong>Blue Cinis</strong> (ci-après &quot;le Site&quot;) est édité par :<br />
                        <strong>[Nom de la Société / Entrepreneur]</strong><br />
                        Forme juridique : [SAS / Auto-entreprise]<br />
                        Adresse du siège social : [Adresse, Ville, Code Postal]<br />
                        SIREN : [Numéro SIREN]<br />
                        Numéro de TVA intracommunautaire : [Numéro TVA]<br />
                        Email de contact : contact@blue-cinis.com<br />
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">2. Directeur de la Publication</h2>
                    <p className="text-white/60 leading-relaxed">
                        Directeur de la publication : <strong>[Nom du Responsable]</strong>
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">3. Hébergement</h2>
                    <p className="text-white/60 leading-relaxed">
                        Ce site est hébergé par :<br />
                        <strong>Vercel Inc.</strong><br />
                        Adresse : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.<br />
                        Site web : https://vercel.com
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-medium uppercase tracking-widest text-white/80">4. Propriété Intellectuelle</h2>
                    <p className="text-white/60 leading-relaxed">
                        La structure générale du Site, ainsi que les textes, graphiques, images, sons et vidéos la composant, sont la propriété de l&apos;éditeur ou de ses partenaires. Toute représentation et/ou reproduction et/ou exploitation partielle ou totale des contenus et services proposés par le site, par quelque procédé que ce soit, sans l&apos;autorisation préalable et par écrit de [Nom de la Société] est strictement interdite et serait susceptible de constituer une contrefaçon au sens des articles L 335-2 et suivants du Code de la propriété intellectuelle.
                        <br /><br />
                        Concernant les <strong>œuvres d&apos;art</strong> présentées sur la Marketplace, elles demeurent la propriété intellectuelle exclusive des Artistes. Toute reproduction non autorisée est interdite.
                    </p>
                </section>
            </div>
        </div>
    );
}
