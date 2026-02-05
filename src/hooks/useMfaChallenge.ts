'use client'

import { useCallback, useState } from 'react'

type ChallengePayload = {
  challengeId: string
  expiresAt: string
  delivery?: {
    channel: string
    maskedDestination: string | null
  }
  debugCode?: string
}

type VerifyPayload = {
  token: string
  expiresAt: string
  scope: string
}

export function useMfaChallenge(scope: string) {
  const [challenge, setChallenge] = useState<ChallengePayload | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const requestChallenge = useCallback(async () => {
    setRequesting(true)
    setChallengeError(null)
    setVerifyError(null)
    setToken(null)
    setTokenExpiresAt(null)
    try {
      const res = await fetch('/api/admin/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      const data = (await res.json().catch(() => ({}))) as ChallengePayload & { error?: string }
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de demander un code MFA.')
      }
      setChallenge(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inattendue'
      setChallengeError(message)
    } finally {
      setRequesting(false)
    }
  }, [scope])

  const verifyCode = useCallback(
    async (code: string) => {
      if (!challenge) {
        setVerifyError('Demandez un code MFA avant de valider.')
        return false
      }
      const trimmed = code.trim()
      if (!trimmed) {
        setVerifyError('Entrez le code MFA reçu par email.')
        return false
      }
      setVerifying(true)
      setVerifyError(null)
      try {
        const res = await fetch('/api/admin/mfa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: challenge.challengeId, code: trimmed, scope }),
        })
        const data = (await res.json().catch(() => ({}))) as VerifyPayload & { error?: string }
        if (!res.ok) {
          throw new Error(data?.error || 'Code invalide.')
        }
        setToken(data.token)
        setTokenExpiresAt(data.expiresAt)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Validation impossible.'
        setVerifyError(message)
        setToken(null)
        setTokenExpiresAt(null)
        return false
      } finally {
        setVerifying(false)
      }
    },
    [challenge, scope],
  )

  const reset = useCallback(() => {
    setChallenge(null)
    setToken(null)
    setTokenExpiresAt(null)
    setChallengeError(null)
    setVerifyError(null)
  }, [])

  return {
    challenge,
    challengeError,
    verifyError,
    token,
    tokenExpiresAt,
    requesting,
    verifying,
    requestChallenge,
    verifyCode,
    reset,
    hasToken: Boolean(token),
  }
}
