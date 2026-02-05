import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authLimiterEmail } from '@/lib/ratelimit'
import { mailer } from '@/lib/mailer'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || '').toString().trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 })

    if (authLimiterEmail) {
      const rl = await authLimiterEmail.limit(`resend:${email}`)
      if (!rl.success) return NextResponse.json({ error: 'Trop de demandes, réessayez plus tard.' }, { status: 429, headers: { 'Retry-After': '60' } })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // Toujours répondre 200 pour éviter l'énumération
    if (!user || user.isActive) return NextResponse.json({ ok: true })

    const token = randomUUID()
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48) // 48h
    await prisma.user.update({ where: { id: user.id }, data: { activationToken: token, activationTokenExpiresAt: expires } })

    const baseUrl = process.env.DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = `${baseUrl}/activate?token=${encodeURIComponent(token)}`
    await mailer.send({
      to: email,
      subject: 'Activez votre compte',
      html: `<p>Bonjour,</p><p>Veuillez activer votre compte en cliquant sur le lien suivant:</p><p><a href="${link}">${link}</a></p><p>Ce lien est valable 48 heures.</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
