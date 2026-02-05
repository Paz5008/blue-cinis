export const revalidate = 3600

import { SectionTitle, BodyText } from "../../components/typography";

export default function PrivacyPage() {
  return (
    <section className="py-16 max-w-3xl mx-auto px-4">
      <SectionTitle as="h1" className="mb-4">Politique de confidentialité</SectionTitle>
      <BodyText as="p" className="mb-3">Nous collectons des données dans le cadre de l’utilisation du site, notamment : compte utilisateur, demandes de contact/achat (leads), commandes. Ces données sont utilisées pour vous fournir le service (gestion de compte, traitement des commandes, échanges avec les artistes/administrateurs).</BodyText>
      <SectionTitle as="h2" className="mt-6 mb-2">Données collectées</SectionTitle>
      <ul className="list-disc pl-6 space-y-1">
        <li>Informations de compte (email, nom, mot de passe chiffré)</li>
        <li>Leads (nom, email, téléphone, message, œuvre ciblée)</li>
        <li>Commandes (coordonnées, adresses, montant, statut)</li>
      </ul>
      <SectionTitle as="h2" className="mt-6 mb-2">Durées de conservation</SectionTitle>
      <BodyText as="p" className="mb-3">Les données sont conservées pour la durée nécessaire au service et conformément aux obligations légales. Les tokens d’activation et de réinitialisation ont une durée de validité limitée.</BodyText>
      <SectionTitle as="h2" className="mt-6 mb-2">Partage et destinataires</SectionTitle>
      <BodyText as="p" className="mb-3">Les données nécessaires au traitement (ex. commandes) peuvent être partagées avec l’artiste/administrateur; des prestataires techniques (hébergement, email, paiement) traitent certaines données en sous-traitance.</BodyText>
      <SectionTitle as="h2" className="mt-6 mb-2">Vos droits</SectionTitle>
      <BodyText as="p" className="mb-3">Vous pouvez demander l’accès, la rectification, la suppression de vos données. Contactez-nous via la page Contact pour toute demande. Une preuve d’identité peut être requise.</BodyText>
      <SectionTitle as="h2" className="mt-6 mb-2">Cookies et mesure d’audience</SectionTitle>
      <BodyText as="p" className="mb-3">Des cookies peuvent être utilisés à des fins techniques (authentification) et d’audience (Plausible/Umami). Vous pouvez limiter ces traceurs via votre navigateur. Une bannière de consentement peut être ajoutée si nécessaire.</BodyText>
    </section>
  )
}
