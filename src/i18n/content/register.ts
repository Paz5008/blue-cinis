export type RegisterLocale = "fr" | "en";
export type Role = "client" | "artist";

export type RegistrationHubCopy = {
  documentsLabel: string;
  deadlineTitle: string;
  switchLabels: Record<Role, string>;
  roles: Record<Role, {
    title: string;
    intro: string;
    requirements: string[];
    sla: string;
  }>;
  support: {
    title: string;
    bodyPrefix: string;
    emailLabel: string;
    email: string;
    bodySuffix: string;
  };
};

export type RegisterCopy = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  hub: RegistrationHubCopy;
};

const registerContent: Record<RegisterLocale, RegisterCopy> = {
  fr: {
    hero: {
      eyebrow: "Rejoindre la communauté Blue Cinis",
      title: "Un portail unique pour les collectionneurs et les artistes",
      description:
        "Choisissez votre parcours, préparez les documents attendus et envoyez votre dossier en toute transparence. Notre équipe valide chaque inscription manuellement afin de préserver la qualité des échanges.",
    },
    hub: {
      documentsLabel: "Documents & délais",
      deadlineTitle: "Délai estimé",
      switchLabels: { client: "Client", artist: "Artiste" },
      roles: {
        client: {
          title: "Je suis collectionneur·se",
          intro:
            "Créez un compte pour suivre vos sélections, planifier des visites privées et recevoir les certificats numériques de chaque acquisition.",
          requirements: [
            "Pièce d’identité ou extrait Kbis (facultatif pour un premier contact)",
            "Coordonnées postales et téléphone pour organiser les livraisons",
            "Validation manuelle par l’équipe (moins de 24 h ouvrées)",
          ],
          sla: "Activation confirmée par email sous 24 heures.",
        },
        artist: {
          title: "Je suis artiste ou collectif",
          intro:
            "Rejoignez l’écosystème Blue Cinis : résidences, ventes accompagnées et visibilité lors de nos tournées européennes.",
          requirements: [
            "Portfolio ou site à jour (PDF, lien ou dossier cloud)",
            "3 visuels HD et une courte note d’intention (500 caractères)",
            "Réponse détaillée sous 7 jours ouvrés avec les prochaines étapes",
          ],
          sla: "Comité artistique tous les lundis, réponse garantie sous une semaine.",
        },
      },
      support: {
        title: "Besoin d’aide ?",
        bodyPrefix: "Nos conseillers vérifient chaque dossier en direct. Écrivez-nous à",
        emailLabel: "inscription@blue-cinis.com",
        email: "inscription@blue-cinis.com",
        bodySuffix: "pour préparer votre arrivée.",
      },
    },
  },
  en: {
    hero: {
      eyebrow: "Join the Blue Cinis community",
      title: "One portal for collectors and artists",
      description:
        "Pick your journey, gather the expected documents and submit your application with full transparency. Every profile is reviewed manually to preserve the quality of exchanges.",
    },
    hub: {
      documentsLabel: "Documents & timelines",
      deadlineTitle: "Estimated review",
      switchLabels: { client: "Collector", artist: "Artist" },
      roles: {
        client: {
          title: "I am a collector",
          intro:
            "Create an account to follow your selections, schedule private visits and receive the digital certificates for each acquisition.",
          requirements: [
            "ID card or company registration (optional for a first touchpoint)",
            "Postal address and phone number to organise deliveries",
            "Manual review by the team (within 24 business hours)",
          ],
          sla: "Activation confirmed by email within 24 hours.",
        },
        artist: {
          title: "I am an artist or collective",
          intro:
            "Join the Blue Cinis ecosystem: residencies, guided sales and visibility during our European tours.",
          requirements: [
            "Updated portfolio or website (PDF, link or shared folder)",
            "3 HD visuals and a short intent note (500 characters)",
            "Detailed response within 7 business days with next steps",
          ],
          sla: "Art committee every Monday, feedback guaranteed within a week.",
        },
      },
      support: {
        title: "Need help?",
        bodyPrefix: "Advisors review every application live. Drop us a line at",
        emailLabel: "inscription@blue-cinis.com",
        email: "inscription@blue-cinis.com",
        bodySuffix: "to prepare your arrival.",
      },
    },
  },
};

export function getRegisterCopy(locale: RegisterLocale = "fr"): RegisterCopy {
  return registerContent[locale] ?? registerContent.fr;
}
