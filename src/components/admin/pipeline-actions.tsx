'use client'

import { useState } from 'react'

export function PipelineActions() {
  const [loading, setLoading] = useState<'import' | 'cleanup' | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function readJsonResponse(response: Response) {
    const text = await response.text()
    return text
      ? JSON.parse(text) as { imported?: number; deleted?: number; skipped?: number; message?: string; error?: string }
      : { error: 'Leere Antwort vom Server.' }
  }

  async function importOpenFoodFacts() {
    setLoading('import')
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/admin/pipeline/openfoodfacts', { method: 'POST' })
      const data = await readJsonResponse(response)

      if (!response.ok) throw new Error(data.error ?? 'Import fehlgeschlagen')

      setResult(data.message ?? `${data.imported ?? 0} Produkte importiert.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  async function removeExampleDeals() {
    setLoading('cleanup')
    setResult(null)
    setError(null)

    try {
      const confirmed = window.confirm('Amazon/More/Beispiel-Deals wirklich aus der Datenbank entfernen?')
      if (!confirmed) return

      const response = await fetch('/api/admin/pipeline/example-deals', { method: 'DELETE' })
      const data = await readJsonResponse(response)

      if (!response.ok) throw new Error(data.error ?? 'Entfernen fehlgeschlagen')

      setResult(data.message ?? `${data.deleted ?? 0} Beispiel-Deals entfernt.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
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
          disabled={loading !== null}
          className="rounded-lg bg-green-400 px-4 py-2 text-sm font-black text-black transition-colors hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === 'import' ? 'Import läuft...' : 'Jetzt importieren'}
        </button>
      </div>

      {result && <p className="mt-3 text-sm text-green-200">{result}</p>}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>

    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-bold text-red-300">Beispiel-Deals entfernen</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Entfernt Amazon/More-Testdaten aus Deals, Posts und Klicks. Open-Food-Facts-Produktchecks bleiben erhalten.
          </p>
        </div>
        <button
          type="button"
          onClick={removeExampleDeals}
          disabled={loading !== null}
          className="rounded-lg bg-red-400 px-4 py-2 text-sm font-black text-black transition-colors hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === 'cleanup' ? 'Entferne...' : 'Beispiel-Deals entfernen'}
        </button>
      </div>
    </div>
    </div>
  )
}
