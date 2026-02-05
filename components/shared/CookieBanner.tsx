"use client";
import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/provider'

function getConsent(): 'accepted' | 'declined' | 'unset' {
  try {
    const v = document.cookie.split('; ').find(r => r.startsWith('consent_analytics='))?.split('=')[1]
    if (v === '1') return 'accepted'
    if (v === '0') return 'declined'
  } catch {}
  return 'unset'
}

export default function CookieBanner() {
  const [status, setStatus] = useState<'accepted' | 'declined' | 'unset'>('unset')
  const { t } = useI18n()
  useEffect(() => {
    setStatus(getConsent())
  }, [])

  if (status !== 'unset') return null

  function setConsent(val: '1' | '0') {
    try {
      const oneYear = 60 * 60 * 24 * 365
      document.cookie = `consent_analytics=${val}; Max-Age=${oneYear}; Path=/; SameSite=Lax`
    } catch {}
    // Reload to allow server to include/exclude analytics scripts depending on consent
    window.location.reload()
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-4xl m-4 p-4 rounded-lg shadow-lg bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm">{t('cookie.banner')}</div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setConsent('0')} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm">{t('cookie.decline')}</button>
            <button onClick={() => setConsent('1')} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">{t('cookie.accept')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
