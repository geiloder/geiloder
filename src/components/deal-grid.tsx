import { DealCard } from './deal-card'
import type { Deal } from '@/types'

export function DealGrid({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <p className="text-4xl mb-4">😔</p>
        <p>Aktuell keine Deals. Schau später nochmal vorbei.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  )
}
