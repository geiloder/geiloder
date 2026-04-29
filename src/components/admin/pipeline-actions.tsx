'use client'

import { useState } from 'react'

export function PipelineActions() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function importOpenFoodFacts() {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/admin/pipeline/openfoodfacts', { method: 'POST' })
      const data = await response.json() as { imported?: number; skipped?: number; message?: string; error?: string }

      if (!response.ok) throw new Error(data.error ?? 'Import fehlgeschlagen')

      setResult(data.message ?? `${data.imported ?? 0} Produkte importiert.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-green-400/20 bg-green-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-bold text-green-300">Open Food Facts direkt importieren</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Läuft auf Vercel mit den dort gespeicherten Supabase-Zugangsdaten.
          </p>
        </div>
        <button
          type="button"
          onClick={importOpenFoodFacts}
          disabled={loading}
          className="rounded-lg bg-green-400 px-4 py-2 text-sm font-black text-black transition-colors hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Import läuft...' : 'Jetzt importieren'}
        </button>
      </div>

      {result && <p className="mt-3 text-sm text-green-200">{result}</p>}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  )
}
