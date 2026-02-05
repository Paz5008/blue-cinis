'use client'

import { useState } from 'react'
import { SensitiveConfirmDialog } from '@/components/admin/SensitiveConfirmDialog'
import { useToast } from '@/context/ToastContext'

type Props = {
  event: {
    id: string
    provider: string
    type: string
    eventId?: string
  }
}

export function WebhookReplayButton({ event }: Props) {
  const [open, setOpen] = useState(false)
  const { addToast } = useToast()

  const handleConfirm = async ({ mfaToken }: { mfaToken?: string | null }) => {
    if (!mfaToken) {
      throw new Error('Validation MFA requise.')
    }
    const res = await fetch(`/api/admin/webhooks/${event.id}/replay`, {
      method: 'POST',
      headers: { 'x-admin-mfa-token': mfaToken },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(data?.error || 'Rejeu impossible.')
    }
    addToast('Webhook rejoue avec succes.', 'success')
    if (Array.isArray(data?.handled) && data.handled.length) {
      addToast(`Actions traitees: ${data.handled.join(', ')}`, 'info')
    }
  }

  const disabled = event.provider !== 'stripe'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? 'Replay indisponible' : 'Rejouer'}
      </button>
      <SensitiveConfirmDialog
        open={open}
        title="Rejouer le webhook"
        description="Relance immediatement les traitements associes."
        scope="webhooks.replay"
        confirmLabel="Rejouer"
        confirmTone="primary"
        onConfirm={handleConfirm}
        onDismiss={() => setOpen(false)}
        context={
          <p>
            Utilisez cette action pour reprocesser un evenement echoue ou bloque. Les effets sont idempotents mais
            s'appliquent immediatement sur les commandes et stocks.
          </p>
        }
        metadata={[
          { label: 'Provider', value: event.provider },
          { label: 'Type', value: event.type },
          { label: 'Event ID', value: event.eventId || 'non fourni' },
        ]}
      />
    </>
  )
}
