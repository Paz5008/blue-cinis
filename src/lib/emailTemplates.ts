export function formatAmount(amountCents: number, currency: string) {
  const cur = (currency || 'eur').toUpperCase()
  return `${(amountCents / 100).toFixed(2)} ${cur}`
}

export function buildOrderConfirmationEmail(params: {
  artworkTitle?: string
  amount: number
  fee: number
  currency: string
  stripeSessionId: string
  paymentIntentId?: string | null
}) {
  const { artworkTitle, amount, fee, currency, stripeSessionId, paymentIntentId } = params
  const fmtAmount = formatAmount(amount, currency)
  const fmtFee = formatAmount(fee, currency)
  const subject = `Commande confirmée${artworkTitle ? ` – ${artworkTitle}` : ''}`
  const html = `
    <p>Merci pour votre achat${artworkTitle ? ` de <strong>${artworkTitle}</strong>` : ''}.</p>
    <ul>
      ${artworkTitle ? `<li><strong>Œuvre:</strong> ${artworkTitle}</li>` : ''}
      <li><strong>Montant:</strong> ${fmtAmount}</li>
      <li><strong>Commission (7%):</strong> ${fmtFee}</li>
      <li><strong>Session Stripe:</strong> ${stripeSessionId}</li>
      ${paymentIntentId ? `<li><strong>PaymentIntent:</strong> ${paymentIntentId}</li>` : ''}
    </ul>
  `
  return { subject, html }
}
