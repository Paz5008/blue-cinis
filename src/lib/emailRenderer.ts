import { formatAmount } from './emailTemplates'
import fr from '@/i18n/messages/fr.json'
import en from '@/i18n/messages/en.json'

export async function renderOrderConfirmationEmail(params: {
  artworkTitle?: string
  amount: number
  fee: number
  currency: string
  stripeSessionId: string
  paymentIntentId?: string | null
}, localeParam?: 'fr'|'en'): Promise<{ subject: string; html: string }> {
  try {
    const { render } = await import('@react-email/render')
    const { OrderConfirmationEmail } = await import('../emails/OrderConfirmationEmail')
    const amountFormatted = formatAmount(params.amount, params.currency)
    const feeFormatted = formatAmount(params.fee, params.currency)
    const locale = (localeParam || (process.env.LOCALE === 'en' ? 'en' : 'fr')) as 'fr'|'en'
    const messages: any = locale === 'en' ? en : fr
    const baseSubject = messages['email.order.buyer'] || 'Commande confirmée'
    const subject = `${baseSubject}${params.artworkTitle ? ` – ${params.artworkTitle}` : ''}`
    const labels = {
      heading: baseSubject,
      thanks: messages['email.label.thanks'] || (locale === 'en' ? 'Thank you for your purchase' : 'Merci pour votre achat'),
      artwork: messages['email.label.artwork'] || (locale === 'en' ? 'Artwork' : 'Œuvre'),
      amount: messages['email.label.amount'] || (locale === 'en' ? 'Amount' : 'Montant'),
      fee: messages['email.label.fee'] || 'Commission (7%)',
      stripeSession: messages['email.label.stripe_session'] || (locale === 'en' ? 'Stripe session' : 'Session Stripe'),
      paymentIntent: messages['email.label.payment_intent'] || 'PaymentIntent',
    }
    const html = render(OrderConfirmationEmail({
      artworkTitle: params.artworkTitle,
      amountFormatted,
      feeFormatted,
      stripeSessionId: params.stripeSessionId,
      paymentIntentId: params.paymentIntentId,
      labels,
    }))
    return { subject, html }
  } catch {
    // Fallback sur template simple si React Email n'est pas dispo
    const locale = (localeParam || (process.env.LOCALE === 'en' ? 'en' : 'fr')) as 'fr'|'en'
    const messages: any = locale === 'en' ? en : fr
    const baseSubject = messages['email.order.buyer'] || 'Commande confirmée'
    const labels = {
      heading: baseSubject,
      thanks: messages['email.label.thanks'] || (locale === 'en' ? 'Thank you for your purchase' : 'Merci pour votre achat'),
      artwork: messages['email.label.artwork'] || (locale === 'en' ? 'Artwork' : 'Œuvre'),
      amount: messages['email.label.amount'] || (locale === 'en' ? 'Amount' : 'Montant'),
      fee: messages['email.label.fee'] || 'Commission (7%)',
      stripeSession: messages['email.label.stripe_session'] || (locale === 'en' ? 'Stripe session' : 'Session Stripe'),
      paymentIntent: messages['email.label.payment_intent'] || 'PaymentIntent',
    }
    // Build a very simple HTML if react-email is not available
    const subject = `${baseSubject}${params.artworkTitle ? ` – ${params.artworkTitle}` : ''}`
    const amountFormatted = formatAmount(params.amount, params.currency)
    const feeFormatted = formatAmount(params.fee, params.currency)
    const html = `
      <h2>${labels.heading}${params.artworkTitle ? ` – ${params.artworkTitle}` : ''}</h2>
      <p>${labels.thanks}${params.artworkTitle ? `: <strong>${params.artworkTitle}</strong>` : ''}</p>
      <ul>
        ${params.artworkTitle ? `<li><strong>${labels.artwork}:</strong> ${params.artworkTitle}</li>` : ''}
        <li><strong>${labels.amount}:</strong> ${amountFormatted}</li>
        <li><strong>${labels.fee}:</strong> ${feeFormatted}</li>
        <li><strong>${labels.stripeSession}:</strong> ${params.stripeSessionId}</li>
        ${params.paymentIntentId ? `<li><strong>${labels.paymentIntent}:</strong> ${params.paymentIntentId}</li>` : ''}
      </ul>
    `
    return { subject, html }
  }
}

export async function renderOrderNotificationEmail(
  recipient: 'buyer' | 'artist' | 'admin',
  params: {
    artworkTitle?: string
    amount: number
    fee: number
    currency: string
    stripeSessionId: string
    paymentIntentId?: string | null
  }
): Promise<{ subject: string; html: string }> {
  const locale = (process.env.LOCALE === 'en' ? 'en' : 'fr') as 'fr'|'en'
  const base = await renderOrderConfirmationEmail(params, locale)
  const messages: any = locale === 'en' ? en : fr
  let key = 'email.order.buyer'
  if (recipient === 'artist') key = 'email.order.artist'
  if (recipient === 'admin') key = 'email.order.admin'
  const subjectPrefix = messages[key] || 'Commande confirmée'
  const suffix = params.artworkTitle ? ` – ${params.artworkTitle}` : ''
  return { subject: `${subjectPrefix}${suffix}`, html: base.html }
}
