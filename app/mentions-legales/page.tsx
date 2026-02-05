import { SectionTitle, BodyText } from "../../components/typography";
import { resolveLocale } from "@/lib/i18n/server";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

const LEGAL_COPY: Record<"fr" | "en", { title: string; intro: string; sections: LegalSection[] }> = {
  fr: {
    title: "Mentions légales",
    intro: "Informations communiquées conformément aux articles 6-III et 19 de la loi n°2004-575 pour la confiance dans l'économie numérique.",
    sections: [
      {
        title: "Éditeur du site",
        paragraphs: [
          "Blue Cinis SAS — au capital social de 50 000 €",
          "Siège social : 42 Quai de Loire, 44000 Nantes, France",
          "Immatriculée au RCS de Nantes sous le numéro 902 456 781",
          "Directeur de la publication : Jules François, Président",
          "Contact : contact@blue-cinis.com – +33 (0)2 40 89 32 17",
        ],
      },
      {
        title: "Hébergement",
        paragraphs: [
          "Vercel Inc.",
          "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
          "https://vercel.com – support@vercel.com",
        ],
      },
      {
        title: "Propriété intellectuelle",
        paragraphs: [
          "L’ensemble des contenus (textes, photographies, illustrations, vidéos) présents sur ce site sont protégés par le droit d’auteur et demeurent la propriété exclusive de Blue Cinis ou des artistes représentés.",
          "Toute reproduction ou représentation, intégrale ou partielle, sans autorisation écrite préalable est strictement interdite.",
        ],
      },
      {
        title: "Conditions de vente et réservations",
        paragraphs: [
          "Les œuvres proposées à la vente sont accompagnées d’une fiche de provenance et d’un certificat délivré au moment de l’expédition. Les prix sont indiqués en euros, toutes taxes comprises.",
          "Pour toute commande supérieure à 8 000 €, une vérification renforcée d’identité est réalisée (KYC / LCB-FT). Les réservations en ligne sont valables 15 minutes sans acompte, puis confirmées dès réception du paiement sécurisé.",
        ],
      },
      {
        title: "Données personnelles",
        paragraphs: [
          "Blue Cinis ne collecte que les données strictement nécessaires au suivi des demandes et des achats. Vous disposez d’un droit d’accès, de rectification et de suppression en écrivant à privacy@blue-cinis.com.",
        ],
      },
    ],
  },
  en: {
    title: "Legal notice",
    intro:
      "Information provided in accordance with French law n°2004-575 of 21 June 2004 for confidence in the digital economy.",
    sections: [
      {
        title: "Publisher",
        paragraphs: [
          "Blue Cinis SAS — share capital €50,000",
          "Registered office: 42 Quai de Loire, 44000 Nantes, France",
          "Company registration: RCS Nantes 902 456 781",
          "Publication director: Jules François, President",
          "Contact: contact@blue-cinis.com – +33 (0)2 40 89 32 17",
        ],
      },
      {
        title: "Hosting provider",
        paragraphs: [
          "Vercel Inc.",
          "340 S Lemon Ave #4133, Walnut, CA 91789, USA",
          "https://vercel.com – support@vercel.com",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "All content available on this website (texts, photographs, illustrations, videos) is protected by intellectual property laws and remains the exclusive property of Blue Cinis or the represented artists.",
          "Any reproduction, adaptation or distribution without prior written consent is strictly prohibited.",
        ],
      },
      {
        title: "Sales & reservations",
        paragraphs: [
          "Each artwork is delivered with provenance documentation and a certificate issued at shipment. Prices are listed in euros including VAT.",
          "For purchases above €8,000, enhanced identity checks (KYC/AML) are performed. Online reservations remain valid for 15 minutes without deposit and are confirmed once secure payment is received.",
        ],
      },
      {
        title: "Personal data",
        paragraphs: [
          "Blue Cinis only collects the data required to process enquiries and orders. You may exercise your rights of access, rectification or erasure by emailing privacy@blue-cinis.com.",
        ],
      },
    ],
  },
};

export default async function MentionsLegalesPage() {
  const locale = await resolveLocale();
  const copy = LEGAL_COPY[locale] ?? LEGAL_COPY.fr;

  return (
    <section className="container mx-auto max-w-4xl space-y-10 px-4 py-16">
      <div>
        <SectionTitle as="h1" className="mb-4">
          {copy.title}
        </SectionTitle>
        <BodyText as="p" className="text-gray-600">
          {copy.intro}
        </BodyText>
      </div>

      <div className="space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        {copy.sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <BodyText key={paragraph} as="p" className="text-gray-700">
                {paragraph}
              </BodyText>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
