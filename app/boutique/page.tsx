import { notFound } from 'next/navigation';
import { SectionTitle, BodyText } from '../../components/typography';

export default function BoutiquePage() {
  if (process.env.NODE_ENV === 'production') return notFound();
  return (
    <section className="py-16">
      <SectionTitle as="h1" className="mb-4">Boutique (démo, non disponible en production)</SectionTitle>
      <BodyText as="p">Cette page est masquée en production. Le parcours d'achat se fait via "Demander à acheter" sur la fiche œuvre.</BodyText>
    </section>
  );
}
