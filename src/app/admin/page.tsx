import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

async function getStats() {
  const supabase = createServiceClient()

  const [newDeals, approvedDeals, renderedDeals, todayClicks] = await Promise.all([
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'rendered'),
    supabase.from('clicks').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  return {
    new: newDeals.count ?? 0,
    approved: approvedDeals.count ?? 0,
    rendered: renderedDeals.count ?? 0,
    todayClicks: todayClicks.count ?? 0,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-white">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Neue Deals', value: stats.new, color: 'text-yellow-400', href: '/admin/deals?status=new' },
          { label: 'Approved', value: stats.approved, color: 'text-blue-400', href: '/admin/deals?status=approved' },
          { label: 'Gerendert', value: stats.rendered, color: 'text-green-400', href: '/admin/deals?status=rendered' },
          { label: 'Klicks heute', value: stats.todayClicks, color: 'text-purple-400', href: '/admin/analytics' },
        ].map(({ label, value, color, href }) => (
          <Link key={label} href={href} className="block p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
          </Link>
        ))}
      </div>

      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h2 className="font-bold text-white mb-3">Pipeline ausführen</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Diese Scripts werden normalerweise automatisch via GitHub Actions ausgeführt. Hier die Reihenfolge zum manuellen Ausführen.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: '1. Import Feeds', cmd: 'npm run import:awin' },
            { label: '2. Deals scoren', cmd: 'npm run score' },
            { label: '3. Copy generieren', cmd: 'npm run generate:copy' },
            { label: '4. Slides rendern', cmd: 'npm run render' },
          ].map(({ label, cmd }) => (
            <div key={label} className="p-3 bg-zinc-800 rounded-lg">
              <p className="font-medium text-zinc-200">{label}</p>
              <code className="text-xs text-green-400 mt-1 block">{cmd}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
