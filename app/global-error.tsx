'use client'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
          <h2 className="text-2xl font-semibold">Une erreur est survenue</h2>
          <p className="text-gray-500 mt-2">Veuillez réessayer. Si le problème persiste, contactez le support.</p>
          <div className="mt-6 flex gap-4">
            <button onClick={() => reset()} className="px-4 py-2 rounded bg-black text-white">Réessayer</button>
            <Link href="/" className="px-4 py-2 rounded border">Accueil</Link>
          </div>
          {process.env.NODE_ENV !== 'production' && error?.digest && (
            <p className="mt-4 text-xs text-gray-400">{error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
