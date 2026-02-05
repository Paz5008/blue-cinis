import { clearRuntimeAlert, markRuntimeAlert } from "@/lib/runtimeAlerts";

export type HeroSlide = {
  id: string;
  title: string;
  description: string;
  backgroundImage: string;
  link: string;
  linkText: string;
};

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'hero-slide-1',
    title: "Blue Cinis : L'Art vous attend",
    description: "Plongez dans un univers d'œuvres uniques, signées par des talents régionaux et internationaux.",
    backgroundImage: "/hero-background.avif",
    link: "#home-artworks",
    linkText: "Explorer la Galerie",
  },
  {
    id: 'hero-slide-2',
    title: "Vivez l'Art : Événements Exclusifs",
    description: "Vernissages, expositions temporaires, rencontres... Découvrez notre programmation culturelle.",
    backgroundImage: "/hero-background2.avif",
    link: "/evenements",
    linkText: "Consulter l'Agenda",
  },
  {
    id: 'hero-slide-3',
    title: "Portraits d'Artistes : Vision & Savoir-faire",
    description: "Rencontrez les créateurs derrière les œuvres et explorez leur démarche artistique.",
    backgroundImage: "/hero-background3.avif",
    link: "/artistes",
    linkText: "Découvrir les Artistes",
  },
];

type Messages = Record<string, string> | null | undefined;

export function buildHeroSlides(messages: Messages): HeroSlide[] {
  if (!messages) {
    markRuntimeAlert("ui.hero.fallback", "Impossible de charger les messages i18n – slides statiques utilisés", "warning");
    return FALLBACK_SLIDES;
  }
  clearRuntimeAlert("ui.hero.fallback");

  const byKey = (key: string, fallback: string) => messages[key] ?? fallback;

  return [
    {
      id: 'hero-slide-1',
      title: byKey('home.hero.slide1.title', FALLBACK_SLIDES[0].title),
      description: byKey('home.hero.slide1.description', FALLBACK_SLIDES[0].description),
      backgroundImage: '/hero-background.avif',
      link: '#home-artworks',
      linkText: byKey('home.hero.slide1.cta', FALLBACK_SLIDES[0].linkText),
    },
    {
      id: 'hero-slide-2',
      title: byKey('home.hero.slide2.title', FALLBACK_SLIDES[1].title),
      description: byKey('home.hero.slide2.description', FALLBACK_SLIDES[1].description),
      backgroundImage: '/hero-background2.avif',
      link: '/evenements',
      linkText: byKey('home.hero.slide2.cta', FALLBACK_SLIDES[1].linkText),
    },
    {
      id: 'hero-slide-3',
      title: byKey('home.hero.slide3.title', FALLBACK_SLIDES[2].title),
      description: byKey('home.hero.slide3.description', FALLBACK_SLIDES[2].description),
      backgroundImage: '/hero-background3.avif',
      link: '/artistes',
      linkText: byKey('home.hero.slide3.cta', FALLBACK_SLIDES[2].linkText),
    },
  ];
}

export { FALLBACK_SLIDES as heroSlidesData };
