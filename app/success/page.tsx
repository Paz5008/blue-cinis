import { prisma } from '@/lib/prisma'
import { SectionTitle, BodyText } from "../../components/typography";
import Stripe from 'stripe'
import { env } from '@/env'
import Link from 'next/link'
import { buildArtworkPath } from '@/lib/artworkSlug'

export default async function SuccessPage({ searchParams }: { searchParams?: { session_id?: string } }) {
  const sessionId = searchParams?.session_id
  let title = 'Paiement confirmé'
  let details: { artworkTitle?: string; amount?: string; fee?: string; currency?: string; artworkId?: string } = {}

  if (sessionId) {
    // 1) Essayer de retrouver la commande en base (webhook a dû l’insérer)
    const order = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } })
    if (order) {
      title = 'Merci pour votre achat'
      details = {
        amount: `${(order.amount/100).toFixed(2)} ${order.currency.toUpperCase()}`,
        fee: `${(order.fee/100).toFixed(2)} ${order.currency.toUpperCase()}`,
        currency: order.currency,
        artworkId: order.artworkId,
      }
    } else if (env.STRIPE_SECRET_KEY) {
      // 2) Fallback: interroger Stripe si la commande n'est pas encore en base
      try {
        const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        const amount = session.amount_total || 0
        const currency = (session.currency || 'eur').toUpperCase()
        const fee = Math.round((amount || 0) * 0.07)
        const md = (session.metadata || ({} as any)) as Record<string, string>
        const artworkTitle = md.artworkTitle as string | undefined
        const artworkId = md.artworkId as string | undefined
        title = 'Merci pour votre achat'
        details = {
          artworkTitle,
          amount: `${(amount/100).toFixed(2)} ${currency}`,
          fee: `${(fee/100).toFixed(2)} ${currency}`,
          currency,
          artworkId,
        }
      } catch {
        // ignoré: affichage générique
      }
    }
  }

  return (
    <section className="py-16 px-4">
      <SectionTitle as="h1" className="mb-4">{title}</SectionTitle>
      {details.amount && (
        <div className="mb-4 text-sm text-gray-700">
          {details.artworkTitle && <BodyText as="p">Œuvre: <strong>{details.artworkTitle}</strong></BodyText>}
          <BodyText as="p">Montant: <strong>{details.amount}</strong></BodyText>
          {details.fee && <BodyText as="p">Commission: <strong>{details.fee}</strong></BodyText>}
        </div>
      )}
      <BodyText as="p">Un e-mail de confirmation vous a été envoyé. Vous recevrez des informations de suivi si l’œuvre nécessite une expédition.</BodyText>
      {details.artworkId && (
        <BodyText as="p" className="mt-2">
          Voir l’œuvre:{" "}
          <Link
            className="text-blue-700 underline"
            href={buildArtworkPath({ id: details.artworkId, title: details.artworkTitle })}
          >
            {buildArtworkPath({ id: details.artworkId, title: details.artworkTitle })}
          </Link>
        </BodyText>
      )}
      <div className="mt-6">
        <Link href="/galerie" className="px-4 py-2 bg-blue-600 text-white rounded">Retour à la galerie</Link>
      </div>
    </section>
  )
}
