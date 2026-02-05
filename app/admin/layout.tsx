import type { ReactNode } from 'react'
import { ensureAdminSession } from '@/lib/adminGuard'
import AdminNav from './_components/AdminNav'
import AdminLoginForm from './_components/AdminLoginForm'

type AdminLayoutProps = {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await ensureAdminSession()

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 text-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Accès restreint</p>
            <h1 className="text-3xl font-semibold text-white lg:text-4xl">Espace réservé aux administrateurs</h1>
            <p className="text-base leading-relaxed text-slate-300">
              Connectez-vous avec vos identifiants pour accéder aux outils de pilotage de la galerie : validation des artistes,
              supervision des commandes, suivi des leads et configuration avancée.
            </p>
          </div>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-xl backdrop-blur">
            <div className="mb-6 space-y-1 text-center">
              <h2 className="text-lg font-semibold text-white">Connexion sécurisée</h2>
              <p className="text-sm text-slate-400">Vos identifiants sont chiffrés et vérifiés avant l’accès.</p>
            </div>
            <AdminLoginForm />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 lg:px-8">
        <AdminNav />
        <main className="mt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
