'use client'
import { useSearchParams } from 'next/navigation'
import { SectionTitle, BodyText } from "../../components/typography";
import { useState } from 'react'

export default function ResetPasswordPage() {
  const sp = useSearchParams()
  const tokenFromUrl = sp.get('token') || ''
  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setMessage('Mot de passe mis à jour. Vous pouvez vous connecter.')
    } catch (e: any) {
      setMessage(e.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 max-w-md mx-auto px-4">
      <SectionTitle as="h1" className="mb-4">Réinitialiser le mot de passe</SectionTitle>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600">Token</label>
          <input value={token} onChange={e=>setToken(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Nouveau mot de passe</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" required minLength={8} />
        </div>
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Envoi...' : 'Valider'}</button>
      </form>
      {message && <BodyText as="p" className="mt-3 text-sm">{message}</BodyText>}
    </section>
  )
}
