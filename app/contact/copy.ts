import type { AppLocale } from "@/lib/i18n/server";

type InfoBlock = {
  icon: "location" | "phone" | "email" | "chat";
  title: string;
  lines: string[];
  helper?: string;
  link?: { label: string; href: string };
};

export type ContactCopy = {
  heroTitle: string;
  heroSubtitle: string;
  infoTitle: string;
  infoBody: string;
  infoBlocks: InfoBlock[];
  formTitle: string;
  mapTitle: string;
};

const CONTACT_COPY: Record<AppLocale, ContactCopy> = {
  fr: {
    heroTitle: "Contactez-nous",
    heroSubtitle: "Planifiez une visite privée, préparez un vernissage ou présentez votre projet artistique.",
    infoTitle: "Informations",
    infoBody:
      "Notre équipe répond en 24 h ouvrées pour les demandes de collectionneurs et sous 72 h pour les candidatures artistes.",
    infoBlocks: [
      {
        icon: "location",
        title: "Adresse",
        lines: ["42 Quai de Loire, 44000 Nantes, France"],
        helper: "Entrée par le patio verrier, ascenseur dédié pour l’atelier.",
      },
      {
        icon: "phone",
        title: "Téléphone",
        lines: ["+33 (0)2 40 89 32 17"],
        helper: "Du mardi au samedi, 10h – 19h (heure de Paris).",
      },
      {
        icon: "email",
        title: "Email",
        lines: ["contact@blue-cinis.com"],
        helper: "Réponse garantie sous 24 h ouvrées.",
      },
      {
        icon: "chat",
        title: "Messagerie instantanée",
        lines: ["WhatsApp ou Signal avec un conseiller Blue Cinis."],
        link: { label: "Ouvrir la conversation", href: "https://wa.me/33644185290" },
      },
    ],
    formTitle: "Envoyez-nous un message",
    mapTitle: "Nous rendre visite",
  },
  en: {
    heroTitle: "Get in touch",
    heroSubtitle: "Book a private visit, prepare a vernissage or share your artistic proposal.",
    infoTitle: "Practical information",
    infoBody:
      "We reply within one business day for collectors and within 72 hours for artist applications.",
    infoBlocks: [
      {
        icon: "location",
        title: "Address",
        lines: ["42 Quai de Loire, 44000 Nantes, France"],
        helper: "Entrance via the glass patio, dedicated lift for the studio.",
      },
      {
        icon: "phone",
        title: "Phone",
        lines: ["+33 (0)2 40 89 32 17"],
        helper: "Tuesday to Saturday, 10am – 7pm (CET).",
      },
      {
        icon: "email",
        title: "Email",
        lines: ["contact@blue-cinis.com"],
        helper: "We reply within 24 business hours.",
      },
      {
        icon: "chat",
        title: "Instant messaging",
        lines: ["Chat on WhatsApp or Signal with an advisor."],
        link: { label: "Start the conversation", href: "https://wa.me/33644185290" },
      },
    ],
    formTitle: "Send us a message",
    mapTitle: "Visit the gallery",
  },
};

export function getContactCopy(locale: AppLocale): ContactCopy {
  return CONTACT_COPY[locale] ?? CONTACT_COPY.fr;
}
