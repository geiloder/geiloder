'use client'
import Image from 'next/image'
import { useState } from 'react'
import { formatPrice, formatDiscount } from '@/lib/utils'
import type { Deal, DealStatus } from '@/types'

interface DealRowProps {
  deal: Deal
  onStatusChange: (id: string, status: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-400/10 text-yellow-400',
  approved: 'bg-blue-400/10 text-blue-400',
  rendered: 'bg-green-400/10 text-green-400',
  scheduled: 'bg-purple-400/10 text-purple-400',
  posted: 'bg-zinc-400/10 text-zinc-400',
  rejected: 'bg-red-400/10 text-red-400',
  expired: 'bg-zinc-600/10 text-zinc-600',
}

export function DealRow({ deal, onStatusChange }: DealRowProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch(`/api/admin/deals/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: deal.id }),
    })
    onStatusChange(deal.id, action === 'approve' ? 'approved' : 'rejected')
    setLoading(null)
  }

  const copy = deal.copy_data

  return (
    <>
      <tr className="border-b border-zinc-800 hover:bg-zinc-900/50">
        <td className="p-3 w-16">
          {deal.produktbild_url ? (
            <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-800">
              <Image src={deal.produktbild_url} alt="" fill className="object-contain p-1" sizes="48px" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-xl">🛍️</div>
          )}
        </td>
        <td className="p-3">
          <p className="text-sm font-medium text-white line-clamp-2">{deal.produktname}</p>
          <p className="text-xs text-zinc-500">{deal.shop} · {deal.kategorie}</p>
        </td>
        <td className="p-3 text-right">
          <p className="text-sm font-bold text-white">{formatPrice(deal.deal_preis)}</p>
          {deal.rabatt_prozent && (
            <p className="text-xs text-green-400">{formatDiscount(deal.rabatt_prozent)}</p>
          )}
        </td>
        <td className="p-3 text-center">
          <span className={`text-sm font-bold ${(deal.deal_score ?? 0) >= 70 ? 'text-green-400' : (deal.deal_score ?? 0) >= 50 ? 'text-yellow-400' : 'text-zinc-500'}`}>
            {deal.deal_score ?? '–'}
          </span>
        </td>
        <td className="p-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[deal.status] ?? ''}`}>
            {deal.status}
          </span>
        </td>
        <td className="p-3">
          {copy && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {expanded ? '▲ Copy' : '▼ Copy'}
            </button>
          )}
        </td>
        <td className="p-3">
          <div className="flex gap-2 flex-wrap">
            {(deal.status === 'new' || deal.status === 'rejected') && (
              <button
                onClick={() => handleAction('approve')}
                disabled={!!loading}
                className="text-xs px-2 py-1 bg-green-400 text-black font-bold rounded hover:bg-green-300 disabled:opacity-50"
              >
                {loading === 'approve' ? '...' : '✓ Approve'}
              </button>
            )}
            {deal.status !== 'rejected' && deal.status !== 'expired' && (
              <button
                onClick={() => handleAction('reject')}
                disabled={!!loading}
                className="text-xs px-2 py-1 bg-red-400/20 text-red-400 font-bold rounded hover:bg-red-400/30 disabled:opacity-50"
              >
                {loading === 'reject' ? '...' : '✗'}
              </button>
            )}
            {(deal.deal_score ?? 0) >= 50 && deal.copy_data && (
              <a
                href={`/admin/prep/${deal.id}`}
                className="text-xs px-2 py-1 bg-purple-400/20 text-purple-400 font-bold rounded hover:bg-purple-400/30"
              >
                🎨 GPT
              </a>
            )}
          </div>
        </td>
      </tr>

      {expanded && copy && (
        <tr className="border-b border-zinc-800 bg-zinc-900/30">
          <td colSpan={7} className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-zinc-400 font-bold mb-1">Slide 1 (Hero)</p>
                <p className="text-white">{copy.headline}</p>
                <p className="text-zinc-500">{copy.subheadline}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold mb-1">Slide 2 (Benefits)</p>
                <p className="text-green-400">{copy.benefit_1}</p>
                <p className="text-zinc-400">{copy.benefit_1_detail}</p>
                <p className="text-green-400 mt-1">{copy.benefit_2}</p>
                <p className="text-zinc-400">{copy.benefit_2_detail}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold mb-1">Slide 4 (Humor)</p>
                <p className="text-white">{copy.humor_konsequenz_1}</p>
                <p className="text-white">{copy.humor_konsequenz_2}</p>
                <p className="text-white">{copy.humor_konsequenz_3}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold mb-1">Caption</p>
                <p className="text-zinc-300 line-clamp-4">{copy.caption}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
