export type AboutLocale = "fr" | "en";

export type AboutCopy = {
  hero: {
    title: string;
    description: string;
  };
  history: {
    heading: string;
    paragraphs: string[];
    highlights: { label: string; value: string }[];
  };
  mission: {
    heading: string;
    pillars: { title: string; body: string }[];
  };
  values: {
    heading: string;
    items: { title: string; body: string }[];
  };
  team: {
    heading: string;
    description: string;
    members: { name: string; role: string; bio: string; photo: string }[];
  };
};

const aboutContent: Record<AboutLocale, AboutCopy> = {
  fr: {
    hero: {
      title: "À propos de Blue Cinis",
      description:
        "Un lieu indépendant né sur l’île de Nantes, dédié aux artistes qui réinventent la relation entre fleuve, matière et gestes contemporains.",
    },
    history: {
      heading: "Notre histoire",
      paragraphs: [
        "Blue Cinis est née en 2012 lorsqu’Aurore Lambert et Jules François ont investi un ancien entrepôt à deux pas des Machines de l’île. Leur ambition : créer un lieu où les artistes pouvaient prototyper des œuvres monumentales tout en restant ancrés dans le quartier.",
        "Les premières expositions hors-les-murs à Bruxelles et Hambourg (2016) ont fait connaître la scène nantaise aux collectionneurs européens. Depuis 2021, l’espace a été agrandi avec des ateliers partagés, un studio photo et un salon d’écoute pour accompagner les nouveaux médiums.",
        "Aujourd’hui, la galerie représente 38 artistes permanents et accueille chaque année quatre résidences curatoriales. Les programmes publics, imaginés avec les écoles d’art de la façade Atlantique, permettent à la jeune création d’expérimenter sans concession.",
      ],
      highlights: [
        { label: "Fondation", value: "2012, Île de Nantes" },
        { label: "Artistes accompagnés", value: "38 talents contemporains" },
        { label: "Expositions itinérantes", value: "18 tournées européennes" },
        { label: "Œuvres placées", value: "312 acquisitions privées" },
      ],
    },
    mission: {
      heading: "Notre mission",
      pillars: [
        {
          title: "Programmer des récits du fleuve",
          body: "Chaque saison associe artistes ligériens, voix émergentes et invités internationaux afin de faire dialoguer patrimoine industriel et pratiques expérimentales.",
        },
        {
          title: "Accompagner les collectionneurs",
          body: "Nous proposons des rendez-vous curatoriaux, un suivi logistique complet et un atelier de restauration partagé avec les manufactures de Saint-Saturnin.",
        },
        {
          title: "Investir la ville",
          body: "Résidences ouvertes, vitrines hors-les-murs et parcours scolaires permettent à plus de 4 500 visiteurs de rencontrer les artistes chaque année.",
        },
      ],
    },
    values: {
      heading: "Nos engagements quotidiens",
      items: [
        {
          title: "Transparence",
          body: "Les artistes suivent en temps réel les réservations, honoraires et frais d’accrochage. Les collectionneurs reçoivent un dossier matière complète pour chaque pièce.",
        },
        {
          title: "Hospitalité",
          body: "Visites privées, ateliers tactiles et service de prêt rendent la galerie accessible aux primo-visiteurs comme aux institutions.",
        },
        {
          title: "Impact local",
          body: "10 % des ventes financent des bourses de résidence dans des ateliers ligériens et un fonds de soutien à la jeune photographie.",
        },
        {
          title: "Innovation responsable",
          body: "Matériaux réutilisables pour la scénographie, transports groupés et traçabilité des œuvres limitent notre empreinte carbone.",
        },
        {
          title: "Dialogue critique",
          body: "Un comité de commissaires et d’historiens indépendants accompagne chaque exposition afin de garantir pluralité des récits.",
        },
        {
          title: "Transmission",
          body: "Formats audio, carnets d’atelier et masterclasses filmées prolongent l’expérience au-delà des murs de la galerie.",
        },
      ],
    },
    team: {
      heading: "L’équipe qui vous accueille",
      description:
        "Conseillers, médiateurs, régisseurs : chaque projet est suivi par une équipe resserrée qui connaît intimement les ateliers et les collectionneurs.",
      members: [
        {
          name: "Aurore Lambert",
          role: "Directrice artistique & cofondatrice",
          bio: "Elle imagine la programmation depuis 2012 et supervise les collaborations avec les biennales de Lyon et d’Anvers.",
          photo: "/aurore-profile.webp",
        },
        {
          name: "Jules François",
          role: "Responsable des relations collectionneurs",
          bio: "Votre interlocuteur privilégié pour les acquisitions et l’accrochage sur-mesure chez les particuliers comme en entreprise.",
          photo: "/jules-profile.webp",
        },
        {
          name: "Liam Voisin",
          role: "Chargé des résidences",
          bio: "Il accompagne les artistes en production et pilote les partenariats avec les ateliers de la friche Alstom.",
          photo: "/liam-voisin-profile.webp",
        },
        {
          name: "Clara Mendes",
          role: "Médiation & programmes publics",
          bio: "Spécialiste des formats participatifs, elle conçoit des visites bilingues et des parcours pour les écoles d’art.",
          photo: "/Paz_white_background_Women_alone_artistic_clothing_abstract_wat_a70ae649-973c-4e6c-b8e0-ac2e670ce608.png",
        },
      ],
    },
  },
  en: {
    hero: {
      title: "About Blue Cinis",
      description:
        "An independent space born on the Île de Nantes, dedicated to artists who reinvent the dialogue between the river, materials and contemporary gestures.",
    },
    history: {
      heading: "Our story",
      paragraphs: [
        "Blue Cinis was created in 2012 when Aurore Lambert and Jules François transformed a former warehouse near Les Machines de l’île. The ambition: give artists room to prototype monumental works while staying rooted in the neighbourhood.",
        "The first off-site exhibitions in Brussels and Hamburg (2016) introduced Nantes’ scene to European collectors. Since 2021 the space has expanded with shared studios, a photo lab and a listening lounge to support new mediums.",
        "Today the gallery represents 38 permanent artists and welcomes four curatorial residencies every year. Public programmes imagined with art schools along the Atlantic coast allow young practices to experiment without compromise.",
      ],
      highlights: [
        { label: "Founded", value: "2012, Île de Nantes" },
        { label: "Artists represented", value: "38 contemporary talents" },
        { label: "Touring shows", value: "18 European routes" },
        { label: "Placed artworks", value: "312 private acquisitions" },
      ],
    },
    mission: {
      heading: "Our mission",
      pillars: [
        {
          title: "Curating river narratives",
          body: "Each season brings together Loire-based artists, emerging voices and international guests to connect industrial heritage with experimental practices.",
        },
        {
          title: "Supporting collectors",
          body: "We design curatorial appointments, full-service logistics and a shared restoration studio with the Saint-Saturnin manufactures.",
        },
        {
          title: "Investing in the city",
          body: "Open residencies, pop-up vitrines and school tours connect more than 4,500 visitors with artists every year.",
        },
      ],
    },
    values: {
      heading: "Daily commitments",
      items: [
        {
          title: "Transparency",
          body: "Artists monitor reservations, fees and hanging costs in real time. Collectors receive full material dossiers for every piece.",
        },
        {
          title: "Hospitality",
          body: "Private visits, tactile workshops and a lending service make the gallery accessible to first-time visitors and institutions alike.",
        },
        {
          title: "Local impact",
          body: "10% of sales fund residency grants in Loire studios and a support fund for young photography.",
        },
        {
          title: "Responsible innovation",
          body: "Reusable scenography materials, grouped transport and artwork traceability help us reduce our footprint.",
        },
        {
          title: "Critical dialogue",
          body: "An independent board of curators and historians accompanies each exhibition to guarantee plural narratives.",
        },
        {
          title: "Transmission",
          body: "Audio formats, studio notebooks and filmed masterclasses extend the experience beyond the gallery walls.",
        },
      ],
    },
    team: {
      heading: "The team welcoming you",
      description:
        "Advisors, mediators, registrars: every project is handled by a close-knit team who knows the workshops and collectors by heart.",
      members: [
        {
          name: "Aurore Lambert",
          role: "Artistic director & co-founder",
          bio: "She has curated the programme since 2012 and leads collaborations with the Lyon and Antwerp biennials.",
          photo: "/aurore-profile.webp",
        },
        {
          name: "Jules François",
          role: "Collector relations lead",
          bio: "Your main contact for acquisitions and bespoke installations at home or within companies.",
          photo: "/jules-profile.webp",
        },
        {
          name: "Liam Voisin",
          role: "Residency manager",
          bio: "He supports artists in production and coordinates partnerships with the Alstom brownfield workshops.",
          photo: "/liam-voisin-profile.webp",
        },
        {
          name: "Clara Mendes",
          role: "Mediation & public programmes",
          bio: "A specialist in participatory formats, she designs bilingual visits and tracks for art schools.",
          photo: "/Paz_white_background_Women_alone_artistic_clothing_abstract_wat_a70ae649-973c-4e6c-b8e0-ac2e670ce608.png",
        },
      ],
    },
  },
};

export function getAboutCopy(locale: AboutLocale = "fr"): AboutCopy {
  return aboutContent[locale] ?? aboutContent.fr;
}
