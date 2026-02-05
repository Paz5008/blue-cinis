import type { AppLocale } from "@/lib/i18n/server";
import { resolveLocale } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXTAUTH_URL || "https://blue-cinis.com";
const CANONICAL_PATH = "/contact";

export const CONTACT_PAGE_URL = `${SITE_URL}${CANONICAL_PATH}`;
export const CONTACT_CANONICAL_PATH = CANONICAL_PATH;
export const CONTACT_OG_IMAGE = "/contact.webp";

const CONTACT_METADATA: Record<AppLocale, { title: string; description: string }> = {
  fr: {
    title: "Contact Blue Cinis",
    description:
      "Planifiez une visite privée, préparez un vernissage ou contactez notre équipe de curation pour présenter votre projet artistique.",
  },
  en: {
    title: "Contact Blue Cinis",
    description:
      "Book a private viewing, prepare a vernissage or reach our curatorial team to present your artistic project.",
  },
};

export function getContactMetadata(locale: AppLocale) {
  return CONTACT_METADATA[locale] ?? CONTACT_METADATA.fr;
}

export async function getContactJsonLd() {
  const locale = await resolveLocale();
  const copy = getContactMetadata(locale);
  return {
    "@context": "https://schema.org",
    "@type": "ArtGallery",
    name: copy.title,
    url: CONTACT_PAGE_URL,
    image: `${SITE_URL}${CONTACT_OG_IMAGE}`,
    description: copy.description,
    telephone: "+33-2-40-00-00-00",
    email: "contact@blue-cinis.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "42 Quai de Loire",
      addressLocality: "Nantes",
      postalCode: "44000",
      addressCountry: "FR",
    },
    sameAs: [
      "https://www.instagram.com/bluecinis",
      "https://www.facebook.com/bluecinis",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "11:00",
        closes: "18:00",
      },
    ],
  };
}
