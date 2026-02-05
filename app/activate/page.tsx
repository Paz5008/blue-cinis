import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { recordAdminAuditLog } from '@/lib/audit'

export const metadata: Metadata = {
  title: 'Activation du compte | Blue Cinis',
  description: 'Activez votre compte Blue Cinis pour accéder à vos commandes et favoris.',
}

type ActivationPageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

type ActivationStateProps = {
  title: string
  description: string
  variant: 'info' | 'error'
  action?: { href: string; label: string }
}

function ActivationState({ title, description, variant, action }: ActivationStateProps) {
  const isError = variant === 'error'
  const accent = isError ? 'text-rose-600' : 'text-emerald-600'
  const border = isError ? 'border-rose-100' : 'border-emerald-100'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border bg-white/95 p-10 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Activation du compte</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-base text-slate-600">{description}</p>
        <div className={`mt-6 rounded-2xl border ${border} bg-white px-4 py-3`}>
          <p className={`text-sm font-medium ${accent}`}>
            {isError ? 'Action requise' : 'Prochaine étape'}
          </p>
          <p className="text-sm text-slate-600">
            {isError
              ? 'Contactez-nous si le lien a expiré ou si vous avez besoin d’un nouvel email.'
              : 'Vous pouvez maintenant vous connecter et finaliser votre profil.'}
          </p>
        </div>
        {action && (
          <div className="mt-8 flex">
            <Link
              href={action.href}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              {action.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function ActivationPage({ searchParams }: ActivationPageProps) {
  const tokenParam = Array.isArray(searchParams?.token) ? searchParams?.token[0] : searchParams?.token
  if (!tokenParam) {
    return (
      <ActivationState
        variant="error"
        title="Lien incomplet"
        description="Ce lien d’activation est incomplet ou a déjà été utilisé. Vérifiez l’URL reçue par email."
        action={{ href: '/login', label: 'Retourner à la connexion' }}
      />
    )
  }

  const user = await prisma.user.findFirst({
    where: { activationToken: tokenParam },
    select: { id: true, email: true, isActive: true, activationTokenExpiresAt: true },
  })

  if (!user) {
    return (
      <ActivationState
        variant="error"
        title="Lien invalide"
        description="Ce lien d’activation est invalide ou a déjà été utilisé. Demandez un nouvel email si besoin."
        action={{ href: '/login', label: 'Demander un nouvel email' }}
      />
    )
  }

  if (user.isActive) {
    return (
      <ActivationState
        variant="info"
        title="Compte déjà activé"
        description="Votre compte est déjà activé. Vous pouvez vous connecter pour accéder à vos espaces privés."
        action={{ href: '/login', label: 'Se connecter' }}
      />
    )
  }

  if (user.activationTokenExpiresAt && user.activationTokenExpiresAt < new Date()) {
    return (
      <ActivationState
        variant="error"
        title="Lien expiré"
        description="Le lien d’activation a expiré. Nous pouvons vous en envoyer un nouveau en quelques secondes."
        action={{ href: '/login', label: 'Recevoir un nouveau lien' }}
      />
    )
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true, activationToken: null, activationTokenExpiresAt: null },
  })

  await recordAdminAuditLog({
    action: 'user.activation',
    resource: user.id,
    metadata: { email: user.email, source: 'activate-page' },
    status: 'success',
  })

  redirect('/login?activated=1')
}
