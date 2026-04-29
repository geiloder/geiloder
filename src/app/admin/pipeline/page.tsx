import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getPipelineStats() {
  const supabase = createServiceClient()
  const [discoveryNew, discoveryApproved, discoveryRendered, affiliateDeals] = await Promise.all([
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('content_type', 'product_discovery').eq('status', 'new'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('content_type', 'product_discovery').eq('status', 'approved'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('content_type', 'product_discovery').eq('status', 'rendered'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('content_type', 'affiliate_deal'),
  ])

  return {
    discoveryNew: discoveryNew.count ?? 0,
    discoveryApproved: discoveryApproved.count ?? 0,
    discoveryRendered: discoveryRendered.count ?? 0,
    affiliateDeals: affiliateDeals.count ?? 0,
  }
}

export default async function AdminPipelinePage() {
  const stats = await getPipelineStats()
  const steps = [
    { label: '1. Open Food Facts importieren', command: 'npm run import:openfoodfacts', note: 'Holt Protein-/Fitness-Produkte ohne Affiliate.' },
    { label: '2. Produkte scoren', command: 'npm run score', note: 'Bewertet Bild, Marke, Protein, Zucker und Social-Potenzial.' },
    { label: '3. Copy generieren', command: 'npm run generate:copy', note: 'Erstellt Produktcheck-Texte mit Groq ohne Kauf-Claims.' },
    { label: '4. Slides rendern', command: 'npm run render', note: 'Erzeugt Feed- und Story-PNGs für Review/Download.' },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Discovery Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">
          MVP ohne Affiliate: Produkte finden, scoren, Copy schreiben, Slides rendern und manuell posten.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Neue Checks', value: stats.discoveryNew, color: 'text-yellow-400', href: '/admin/deals?status=new' },
          { label: 'Approved', value: stats.discoveryApproved, color: 'text-blue-400', href: '/admin/deals?status=approved' },
          { label: 'Gerendert', value: stats.discoveryRendered, color: 'text-green-400', href: '/admin/deals?status=rendered' },
          { label: 'Affiliate-Deals', value: stats.affiliateDeals, color: 'text-zinc-400', href: '/admin/deals' },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600">
            <p className="text-sm text-zinc-500">{item.label}</p>
            <p className={`mt-1 text-3xl font-black ${item.color}`}>{item.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 p-4">
          <h2 className="font-bold text-white">Täglicher Ablauf</h2>
          <p className="mt-1 text-xs text-zinc-500">Diese Befehle laufen später automatisch. Für den MVP sind sie bewusst sichtbar und einzeln prüfbar.</p>
        </div>
        <div className="divide-y divide-zinc-800">
          {steps.map((step) => (
            <div key={step.command} className="grid gap-2 p-4 md:grid-cols-[1fr_260px] md:items-center">
              <div>
                <p className="font-medium text-white">{step.label}</p>
                <p className="text-sm text-zinc-500">{step.note}</p>
              </div>
              <code className="rounded-lg bg-zinc-950 px-3 py-2 text-xs text-green-400">{step.command}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-zinc-300">
        <p className="font-bold text-blue-300">Rechte-Modus</p>
        <p className="mt-1">
          Open-Food-Facts-Importe werden als unbezahlte Produktchecks markiert. Daten und Bilder behalten Attribution und Lizenzhinweis; es werden keine Affiliate-Links oder Kauf-CTAs verwendet.
        </p>
      </div>
    </div>
  )
}
