"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import LoginForm from '@/components/features/auth/LoginForm';
import { resolveAdminReturnPath } from '@/lib/adminReturnPath'

export default function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authRequired = searchParams.get('auth') === 'required'
  const returnTo = resolveAdminReturnPath(searchParams.get('returnTo'))

  return (
    <div className="space-y-4">
      {authRequired && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Session expirée. Veuillez vous reconnecter pour accéder à l’espace d’administration.
        </div>
      )}
      <LoginForm
        onSuccess={() => {
          router.replace(returnTo || '/admin')
        }}
      />
    </div>
  )
}
