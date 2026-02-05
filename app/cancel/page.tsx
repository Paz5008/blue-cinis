import Link from 'next/link';
import { SectionTitle, BodyText } from '../../components/typography';

export default function CancelPage() {
  return (
    <section className="py-16 px-4">
      <SectionTitle as="h1" className="mb-4">Paiement annulé</SectionTitle>
      <BodyText as="p">Votre paiement a été annulé. Vous pouvez poursuivre votre visite, retourner à votre sélection ou réessayer plus tard.</BodyText>
      <div className="mt-4 space-x-4">
        <Link href="/selection" className="text-blue-600 underline">Voir ma sélection</Link>
        <Link href="/galerie" className="text-blue-600 underline">Retourner à la galerie</Link>
      </div>
    </section>
  );
}
