import { Html, Body, Container, Heading, Text } from '@react-email/components'

export function OrderConfirmationEmail(props: {
  artworkTitle?: string
  amountFormatted: string
  feeFormatted: string
  stripeSessionId: string
  paymentIntentId?: string | null
  labels: {
    heading: string
    thanks: string
    artwork: string
    amount: string
    fee: string
    stripeSession: string
    paymentIntent: string
  }
}) {
  const { artworkTitle, amountFormatted, feeFormatted, stripeSessionId, paymentIntentId, labels } = props
  return (
    <Html>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '20px auto', padding: '20px', borderRadius: 8, maxWidth: 560 }}>
          <Heading as="h2">{labels.heading}{artworkTitle ? ` – ${artworkTitle}` : ''}</Heading>
          <Text>{labels.thanks}{artworkTitle ? `: ` : ''}{artworkTitle ? <strong>{artworkTitle}</strong> : ''}</Text>
          {artworkTitle && <Text>{labels.artwork}: <strong>{artworkTitle}</strong></Text>}
          <Text>{labels.amount}: <strong>{amountFormatted}</strong></Text>
          <Text>{labels.fee}: <strong>{feeFormatted}</strong></Text>
          <Text>{labels.stripeSession}: {stripeSessionId}</Text>
          {paymentIntentId && <Text>{labels.paymentIntent}: {paymentIntentId}</Text>}
        </Container>
      </Body>
    </Html>
  )
}
