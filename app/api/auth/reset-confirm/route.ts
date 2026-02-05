import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

function isPasswordStrong(pw: string) {
  return typeof pw === 'string' && pw.length >= 8
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = (body?.token || '').toString()
    const password = (body?.password || '').toString()
    if (!token || !password) return NextResponse.json({ error: 'token et password requis' }, { status: 400 })
    if (!isPasswordStrong(password)) return NextResponse.json({ error: 'Mot de passe trop faible (min 8 caractères)' }, { status: 400 })

    const user = await prisma.user.findFirst({ where: { resetToken: token } })
    if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Token expiré' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, resetToken: null, resetTokenExpiresAt: null },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 400 })
  }
}
