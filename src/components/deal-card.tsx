import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, formatDiscount, isDiscoveryDeal } from '@/lib/utils'
import type { Deal } from '@/types'

export function DealCard({ deal }: { deal: Deal }) {
  const discovery = isDiscoveryDeal(deal)
  const rabattText = deal.rabatt_prozent ? formatDiscount(deal.rabatt_prozent) : null

  return (
    <article className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all hover:-translate-y-0.5">
      <div className="relative aspect-square bg-zinc-800">
        {deal.produktbild_url ? (
          <Image
            src={deal.produktbild_url}
            alt={deal.produktname}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-4xl">🛍️</div>
        )}
        {discovery ? (
          <div className="absolute top-2 left-2 bg-blue-400 text-black font-black text-xs px-2 py-1 rounded">
            PRODUKT-CHECK
          </div>
        ) : rabattText && (
          <div className="absolute top-2 left-2 bg-green-400 text-black font-black text-sm px-2 py-1 rounded">
            {rabattText}
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
          {discovery ? 'Unbezahlt recherchiert' : deal.shop}
        </p>
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-3">{deal.produktname}</h3>

        <div className="flex items-end justify-between">
          <div>
            {discovery ? (
              <p className="text-sm font-bold text-blue-400">Geil oder?</p>
            ) : (
              <p className="text-lg font-black text-white">{formatPrice(deal.deal_preis)}</p>
            )}
            {!discovery && deal.alter_preis && (
              <p className="text-xs text-zinc-500 line-through">{formatPrice(deal.alter_preis)}</p>
            )}
          </div>
          <Link
            href={`/deal/${deal.slug ?? deal.id}`}
            className="text-xs font-bold text-green-400 hover:text-green-300 transition-colors"
          >
            {discovery ? 'Zum Check' : 'Zum Deal'} →
          </Link>
        </div>
      </div>
    </article>
  )
}
