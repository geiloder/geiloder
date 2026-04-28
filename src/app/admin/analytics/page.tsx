import {
  getGlobalStats,
  getTopDealsByClicks,
  getClicksByKategorie,
  getClicksBySource,
  getDailyClicks,
} from '@/lib/supabase/analytics'

export const revalidate = 60

export default async function AdminAnalyticsPage() {
  let stats, topDeals, kategorien, sources, daily

  try {
    ;[stats, topDeals, kategorien, sources, daily] = await Promise.all([
      getGlobalStats(),
      getTopDealsByClicks(15),
      getClicksByKategorie(),
      getClicksBySource(),
      getDailyClicks(14),
    ])
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <div className="p-6 bg-zinc-900 rounded-xl border border-yellow-400/30">
          <p className="text-yellow-400 font-bold">SQL-Views noch nicht erstellt</p>
          <p className="text-zinc-400 text-sm mt-2">
            Bitte <code className="text-green-400">supabase/migrations/002_analytics_views.sql</code> im Supabase SQL Editor ausführen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-white">Analytics</h1>

      {/* Gesamt-Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Aktive Deals', value: stats.active_deals, color: 'text-green-400' },
          { label: 'Neue Deals', value: stats.new_deals, color: 'text-yellow-400' },
          { label: 'Klicks heute', value: stats.clicks_today, color: 'text-blue-400' },
          { label: 'Klicks 7 Tage', value: stats.clicks_7d, color: 'text-purple-400' },
          { label: 'Klicks gesamt', value: stats.total_clicks, color: 'text-white' },
          { label: 'Posts gesamt', value: stats.total_posts, color: 'text-zinc-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Klicks pro Tag (letzte 14 Tage) */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h2 className="font-bold text-white mb-4">Klicks letzte 14 Tage</h2>
        {daily.length === 0 ? (
          <p className="text-zinc-500 text-sm">Noch keine Klick-Daten vorhanden.</p>
        ) : (
          <div className="space-y-2">
            {daily.map((d) => {
              const maxClicks = Math.max(...daily.map((x) => x.clicks), 1)
              const pct = (d.clicks / maxClicks) * 100
              const date = new Date(d.day).toLocaleDateString('de-DE', {
                weekday: 'short', day: '2-digit', month: '2-digit',
              })
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-20">{date}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-white w-10 text-right">{d.clicks}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Deals */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="font-bold text-white mb-4">Top Deals (7 Tage)</h2>
          <div className="space-y-2">
            {topDeals.slice(0, 10).map((deal, i) => (
              <div key={deal.id} className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{deal.produktname}</p>
                  <p className="text-xs text-zinc-500">{deal.shop}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-400">{deal.clicks_7d}</p>
                  <p className="text-xs text-zinc-600">{deal.total_clicks} total</p>
                </div>
              </div>
            ))}
            {topDeals.length === 0 && (
              <p className="text-zinc-500 text-sm">Noch keine Klicks</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Kategorien */}
          <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <h2 className="font-bold text-white mb-4">Klicks nach Kategorie</h2>
            <div className="space-y-2">
              {kategorien.length === 0 ? (
                <p className="text-zinc-500 text-sm">Noch keine Daten</p>
              ) : kategorien.map((kat) => (
                <div key={kat.kategorie} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{kat.kategorie}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-blue-400">{kat.clicks_7d} (7T)</span>
                    <span className="text-zinc-500">{kat.total_clicks} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quellen */}
          <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <h2 className="font-bold text-white mb-4">Klicks nach Plattform</h2>
            <div className="space-y-2">
              {sources.length === 0 ? (
                <p className="text-zinc-500 text-sm">Noch keine Daten</p>
              ) : sources.map((src) => (
                <div key={src.source} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300 capitalize">{src.source}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-purple-400">{src.clicks_24h} (24h)</span>
                    <span className="text-zinc-500">{src.total_clicks} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score-Optimierung Hinweis */}
      {(kategorien[0] || sources[0] || topDeals[0]) && (
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-700">
          <h2 className="font-bold text-white mb-2">Score-Optimierung</h2>
          <div className="text-sm text-zinc-400 space-y-1">
            {kategorien[0] && (
              <p>📈 Beste Kategorie: <strong className="text-white">{kategorien[0].kategorie}</strong> ({kategorien[0].clicks_7d} Klicks letzte 7 Tage)</p>
            )}
            {sources[0] && (
              <p>🏆 Beste Plattform: <strong className="text-white">{sources[0].source}</strong> ({sources[0].clicks_7d} Klicks letzte 7 Tage)</p>
            )}
            {topDeals[0] && (
              <p>⭐ Top Deal: <strong className="text-white">{topDeals[0].produktname.slice(0, 40)}</strong> ({topDeals[0].clicks_7d} Klicks)</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
