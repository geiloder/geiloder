import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDealBySlug, getSimilarDeals } from '@/lib/supabase/queries'
import { DealCard } from '@/components/deal-card'
import { formatPrice, formatDiscount } from '@/lib/utils'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const deal = await getDealBySlug(slug)
  if (!deal) return {}

  const rabatt = deal.rabatt_prozent ? ` (${formatDiscount(deal.rabatt_prozent)})` : ''
  return {
    title: `${deal.produktname}${rabatt}`,
    description: `${deal.produktname} jetzt für ${formatPrice(deal.deal_preis)} bei ${deal.shop}. ${deal.rabatt_prozent ? formatDiscount(deal.rabatt_prozent) + ' Rabatt.' : ''}`,
    openGraph: {
      images: deal.produktbild_url ? [{ url: deal.produktbild_url }] : [],
    },
  }
}

export default async function DealPage({ params }: Props) {
  const { slug } = await params
  const deal = await getDealBySlug(slug)
  if (!deal) notFound()

  const similarDeals = await getSimilarDeals(deal, 4)
  const rabattText = deal.rabatt_prozent ? formatDiscount(deal.rabatt_prozent) : null

  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900">
          {deal.produktbild_url ? (
            <Image
              src={deal.produktbild_url}
              alt={deal.produktname}
              fill
              className="object-contain p-8"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">🛍️</div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-zinc-400 uppercase tracking-wide">{deal.shop} · {deal.kategorie}</p>
            <h1 className="mt-2 text-2xl font-black leading-tight">{deal.produktname}</h1>
            {deal.marke && deal.marke !== deal.shop && (
              <p className="text-sm text-zinc-500 mt-1">von {deal.marke}</p>
            )}
          </div>

          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">{formatPrice(deal.deal_preis)}</span>
            {deal.alter_preis && (
              <span className="text-xl text-zinc-500 line-through">{formatPrice(deal.alter_preis)}</span>
            )}
            {rabattText && (
              <span className="bg-green-400 text-black font-black text-sm px-3 py-1 rounded">{rabattText}</span>
            )}
          </div>

          {deal.gutschein_code && (
            <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
              <p className="text-xs text-zinc-400 mb-1">Gutschein-Code</p>
              <code className="text-green-400 font-bold">{deal.gutschein_code}</code>
            </div>
          )}

          {deal.verfuegbarkeit && (
            <p className="text-sm text-orange-400">⚡ {deal.verfuegbarkeit} verfügbar</p>
          )}

          <Link
            href={`/go/${deal.id}?source=website`}
            className="block w-full text-center bg-green-400 hover:bg-green-300 text-black font-black py-4 rounded-xl text-lg transition-colors"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Jetzt Deal ansehen →
          </Link>

          <p className="text-xs text-zinc-600">
            Anzeige | Affiliate-Link. Preis kann sich ändern. Stand: {new Date(deal.updated_at).toLocaleDateString('de-DE')}.
          </p>
        </div>
      </div>

      {similarDeals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Ähnliche Deals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarDeals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
