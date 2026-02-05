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
      const rl = await authLimiterEmail.limit(`reset:${email}`)
      if (!rl.success) return NextResponse.json({ error: 'Trop de demandes, réessayez plus tard.' }, { status: 429, headers: { 'Retry-After': '60' } })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // Répondre 200 quoi qu'il arrive pour éviter l'énumération
    if (!user) return NextResponse.json({ ok: true })

    const token = randomUUID()
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1h
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiresAt: expires } })

    const baseUrl = process.env.DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`
    await mailer.send({
      to: email,
      subject: 'Réinitialisation du mot de passe',
      html: `<p>Bonjour,</p><p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant:</p><p><a href="${link}">${link}</a></p><p>Ce lien est valable 1 heure.</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
