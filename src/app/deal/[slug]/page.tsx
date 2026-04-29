import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getDealBySlug, getSimilarDeals } from '@/lib/supabase/queries'
import { DealCard } from '@/components/deal-card'
import { formatPrice, formatDiscount, isDiscoveryDeal } from '@/lib/utils'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const deal = await getDealBySlug(slug)
  if (!deal) return {}

  const discovery = isDiscoveryDeal(deal)
  const rabatt = deal.rabatt_prozent ? ` (${formatDiscount(deal.rabatt_prozent)})` : ''
  return {
    title: discovery ? `${deal.produktname} Produkt-Check` : `${deal.produktname}${rabatt}`,
    description: discovery
      ? `${deal.produktname}: unbezahlter Produkt-Check von Geil oder?.`
      : `${deal.produktname} jetzt für ${formatPrice(deal.deal_preis)} bei ${deal.shop}. ${deal.rabatt_prozent ? formatDiscount(deal.rabatt_prozent) + ' Rabatt.' : ''}`,
    openGraph: {
      images: deal.produktbild_url ? [{ url: deal.produktbild_url }] : [],
    },
  }
}

export default async function DealPage({ params }: Props) {
  const { slug } = await params
  const deal = await getDealBySlug(slug)
  if (!deal) notFound()

  const discovery = isDiscoveryDeal(deal)
  const similarDeals = await getSimilarDeals(deal, 4)
  const rabattText = deal.rabatt_prozent ? formatDiscount(deal.rabatt_prozent) : null
  const facts = deal.product_facts ?? {}

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
            <p className="text-sm text-zinc-400 uppercase tracking-wide">
              {discovery ? 'Produkt-Check · Unbezahlt recherchiert' : `${deal.shop} · ${deal.kategorie}`}
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight">{deal.produktname}</h1>
            {deal.marke && deal.marke !== deal.shop && (
              <p className="text-sm text-zinc-500 mt-1">von {deal.marke}</p>
            )}
          </div>

          {discovery ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Protein', value: facts.protein_serving ? `${facts.protein_serving} g` : facts.protein_100g ? `${facts.protein_100g} g/100g` : '–' },
                { label: 'Zucker', value: facts.sugar_serving ? `${facts.sugar_serving} g` : facts.sugar_100g ? `${facts.sugar_100g} g/100g` : '–' },
                { label: 'Kalorien', value: facts.calories_serving ? `${facts.calories_serving} kcal` : facts.calories_100g ? `${facts.calories_100g} kcal/100g` : '–' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="mt-1 font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">{formatPrice(deal.deal_preis)}</span>
            {deal.alter_preis && (
              <span className="text-xl text-zinc-500 line-through">{formatPrice(deal.alter_preis)}</span>
            )}
            {rabattText && (
              <span className="bg-green-400 text-black font-black text-sm px-3 py-1 rounded">{rabattText}</span>
            )}
          </div>
          )}

          {!discovery && deal.gutschein_code && (
            <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
              <p className="text-xs text-zinc-400 mb-1">Gutschein-Code</p>
              <code className="text-green-400 font-bold">{deal.gutschein_code}</code>
            </div>
          )}

          {!discovery && deal.verfuegbarkeit && (
            <p className="text-sm text-orange-400">⚡ {deal.verfuegbarkeit} verfügbar</p>
          )}

          {discovery ? (
            <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
              <p className="font-bold text-blue-300">Geil oder?</p>
              <p className="mt-1 text-sm text-zinc-400">
                Unbezahlter Produkt-Check. Kein Affiliate-Link, keine Kaufempfehlung.
              </p>
            </div>
          ) : (
          <Link
            href={`/go/${deal.id}?source=website`}
            className="block w-full text-center bg-green-400 hover:bg-green-300 text-black font-black py-4 rounded-xl text-lg transition-colors"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Jetzt Deal ansehen →
          </Link>
          )}

          <p className="text-xs text-zinc-600">
            {discovery
              ? `${deal.attribution_text ?? 'Daten/Bild: Open Food Facts, CC BY-SA'}. Stand: ${new Date(deal.updated_at).toLocaleDateString('de-DE')}.`
              : `Anzeige | Affiliate-Link. Preis kann sich ändern. Stand: ${new Date(deal.updated_at).toLocaleDateString('de-DE')}.`}
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
