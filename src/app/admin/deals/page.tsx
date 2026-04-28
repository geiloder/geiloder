'use client'
import { useEffect, useState } from 'react'
import { DealRow } from '@/components/admin/deal-row'
import type { Deal, DealStatus } from '@/types'

const STATUS_FILTERS: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Neu' },
  { value: 'approved', label: 'Approved' },
  { value: 'rendered', label: 'Gerendert' },
  { value: 'posted', label: 'Gepostet' },
  { value: 'rejected', label: 'Abgelehnt' },
]

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = statusFilter !== 'all' ? '?' + new URLSearchParams({ status: statusFilter }) : ''
      const res = await fetch(`/api/admin/deals/list${params}`)
      const data = await res.json() as { deals: Deal[] }
      setDeals(data.deals ?? [])
      setLoading(false)
    }
    load()
  }, [statusFilter])

  function handleStatusChange(id: string, newStatus: string) {
    setDeals((prev) => prev.map((d) => d.id === id ? { ...d, status: newStatus as DealStatus } : d))
  }

  const filtered = statusFilter === 'all' ? deals : deals.filter((d) => d.status === statusFilter)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-white">Deals ({filtered.length})</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value as DealStatus | 'all')}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              statusFilter === value ? 'bg-green-400 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-zinc-500 text-center py-10">Lädt...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-xs text-zinc-500">
              <tr>
                <th className="p-3">Bild</th>
                <th className="p-3">Produkt</th>
                <th className="p-3 text-right">Preis</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3">Status</th>
                <th className="p-3">Copy</th>
                <th className="p-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((deal) => (
                <DealRow key={deal.id} deal={deal} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-zinc-500">Keine Deals gefunden.</div>
          )}
        </div>
      )}
    </div>
  )
}
