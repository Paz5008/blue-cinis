'use client'

import { ReactNode, useCallback, useState } from 'react'
import { useMfaChallenge } from '@/hooks/useMfaChallenge'

type MetadataItem = {
  label: string
  value: string
}

type Props = {
  open: boolean
  title: string
  description: string
  scope?: string
  confirmLabel?: string
  confirmTone?: 'danger' | 'primary'
  onConfirm: (input: { mfaToken?: string | null }) => Promise<void>
  onDismiss: () => void
  context?: ReactNode
  metadata?: MetadataItem[]
  requireMfa?: boolean
}

export function SensitiveConfirmDialog({
  open,
  title,
  description,
  scope,
  confirmLabel = 'Confirmer',
  confirmTone = 'danger',
  onConfirm,
  onDismiss,
  context,
  metadata,
  requireMfa = true,
}: Props) {
  const mfa = useMfaChallenge(scope || 'admin.sensitive')
  const [otpCode, setOtpCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setOtpCode('')
    setActionError(null)
    if (requireMfa) {
      mfa.reset()
    }
    onDismiss()
  }, [mfa, onDismiss, requireMfa])

  const handleVerifyCode = useCallback(async () => {
    const ok = await mfa.verifyCode(otpCode)
    if (ok) {
      setOtpCode('')
    }
  }, [mfa, otpCode])

  const handleConfirm = useCallback(async () => {
    if (requireMfa && !mfa.token) {
      setActionError('Validez le code MFA avant de confirmer.')
      return
    }
    setSubmitting(true)
    setActionError(null)
    try {
      await onConfirm({ mfaToken: requireMfa ? mfa.token : undefined })
      handleClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action impossible.'
      setActionError(message)
      if (requireMfa) {
        mfa.reset()
      }
    } finally {
      setSubmitting(false)
      setOtpCode('')
    }
  }, [handleClose, mfa, onConfirm, requireMfa])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 transition hover:text-slate-600"
            aria-label="Fermer"
          >
            &#215;
          </button>
        </div>
        {context && <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">{context}</div>}
        {metadata && metadata.length > 0 && (
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
            {metadata.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-100 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
                <dd className="text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {requireMfa && (
          <div className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation MFA</p>
                <p className="text-xs text-slate-500">Demandez un code unique puis validez-le pour poursuivre.</p>
              </div>
              {mfa.hasToken && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Code valide
                </span>
              )}
            </div>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <button
                type="button"
                onClick={mfa.requestChallenge}
                disabled={mfa.requesting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {mfa.requesting ? 'Envoi du code...' : mfa.challenge ? 'Renvoyer un code MFA' : 'Envoyer un code MFA'}
              </button>
              {mfa.challenge && (
                <>
                  <p className="text-xs text-slate-500">
                    Code envoye a {mfa.challenge.delivery?.maskedDestination || 'votre email administrateur'}.
                  </p>
                  {mfa.challenge.debugCode && (
                    <p className="text-xs font-mono text-amber-600">Mode dev: {mfa.challenge.debugCode}</p>
                  )}
                  {!mfa.hasToken && (
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value)}
                        placeholder="Code MFA"
                        className="flex-1 min-w-[140px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={mfa.verifying || !otpCode.trim()}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {mfa.verifying ? 'Validation...' : 'Valider'}
                      </button>
                    </div>
                  )}
                </>
              )}
              {mfa.challengeError && <p className="text-xs text-rose-600">{mfa.challengeError}</p>}
              {mfa.verifyError && <p className="text-xs text-rose-600">{mfa.verifyError}</p>}
              {mfa.hasToken && mfa.tokenExpiresAt && (
                <p className="text-xs text-emerald-700">
                  Code confirme jusqu a{' '}
                  {new Date(mfa.tokenExpiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
                </p>
              )}
            </div>
          </div>
        )}
        {actionError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</div>}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || (requireMfa && !mfa.hasToken)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              confirmTone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50'
            }`}
          >
            {submitting ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
