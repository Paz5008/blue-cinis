import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { renderOrderConfirmationEmail } from '@/lib/emailRenderer'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const params = {
    artworkTitle: 'Œuvre de démo',
    amount: 125000, // 1250.00 EUR
    fee: Math.round(125000 * 0.07),
    currency: 'eur',
    stripeSessionId: 'cs_test_preview',
    paymentIntentId: 'pi_test_preview',
  }
  const locale = (req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'fr') as 'fr' | 'en'
  const { subject, html } = await renderOrderConfirmationEmail(params, locale)
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${subject}</title></head><body>${html}</body></html>`
  return new NextResponse(doc, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
