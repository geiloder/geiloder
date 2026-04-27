import type { Deal, DealKategorie, AntiSpamContext } from '@/types'

export type DealTier = 'carousel' | 'story' | 'ignore'

const BEKANNTE_MARKEN = new Set([
  'more nutrition', 'esn', 'myprotein', 'bulk', 'optimum nutrition',
  'dymatize', 'biotech usa', 'olimp', 'weider', 'ironmaxx',
  'applied nutrition', 'bsn', 'muscletech', 'cellucor',
  'adidas', 'nike', 'under armour', 'puma', 'reebok',
  'garmin', 'polar', 'fitbit', 'theragun', 'hyperice',
])

const FITNESS_KATEGORIEN: DealKategorie[] = [
  'supplements', 'fitness', 'home-gym', 'gymwear', 'gadgets',
]

export interface ScoreDetails {
  score: number
  tier: DealTier
  breakdown: {
    rabatt: number
    marke: number
    bild: number
    provision: number
    preis: number
    kategorie: number
    knappheit: number
    humor: number
  }
}

export function scoreDeal(deal: Deal): ScoreDetails {
  const breakdown = {
    rabatt: 0,
    marke: 0,
    bild: 0,
    provision: 0,
    preis: 0,
    kategorie: 0,
    knappheit: 0,
    humor: 0,
  }

  // Rabatt-Stärke (max 25 Punkte)
  const rabatt = deal.rabatt_prozent ?? 0
  if (rabatt >= 50) breakdown.rabatt = 25
  else if (rabatt >= 40) breakdown.rabatt = 22
  else if (rabatt >= 30) breakdown.rabatt = 18
  else if (rabatt >= 25) breakdown.rabatt = 14
  else if (rabatt >= 20) breakdown.rabatt = 10
  else if (rabatt >= 15) breakdown.rabatt = 6
  else if (rabatt >= 10) breakdown.rabatt = 3

  // Markenbekanntheit (max 15 Punkte)
  const markeNormalized = (deal.marke ?? deal.shop).toLowerCase()
  if (BEKANNTE_MARKEN.has(markeNormalized)) {
    breakdown.marke = 15
  } else if (markeNormalized.length > 3) {
    breakdown.marke = 5
  }

  // Bild vorhanden (max 10 Punkte)
  if (deal.produktbild_url) {
    breakdown.bild = 10
  }

  // Provision (max 10 Punkte)
  const prov = deal.provision ?? 0
  if (prov >= 15) breakdown.provision = 10
  else if (prov >= 10) breakdown.provision = 8
  else if (prov >= 8) breakdown.provision = 6
  else if (prov >= 5) breakdown.provision = 4
  else if (prov > 0) breakdown.provision = 2

  // Preis-Attraktivität (max 15 Punkte)
  const preis = deal.deal_preis
  if (preis <= 9.99) breakdown.preis = 15
  else if (preis <= 19.99) breakdown.preis = 12
  else if (preis <= 29.99) breakdown.preis = 9
  else if (preis <= 49.99) breakdown.preis = 6
  else if (preis <= 79.99) breakdown.preis = 3

  // Kategorie-Fit (max 10 Punkte)
  if (FITNESS_KATEGORIEN.includes(deal.kategorie)) {
    breakdown.kategorie = 10
  } else {
    breakdown.kategorie = 3
  }

  // Knappheit (max 10 Punkte)
  if (deal.verfuegbarkeit) {
    const verfProzent = parseInt(deal.verfuegbarkeit.replace(/[^0-9]/g, ''))
    if (!isNaN(verfProzent)) {
      if (verfProzent <= 10) breakdown.knappheit = 10
      else if (verfProzent <= 20) breakdown.knappheit = 7
      else if (verfProzent <= 30) breakdown.knappheit = 4
      else if (verfProzent <= 50) breakdown.knappheit = 2
    }
  }

  // Humor-Potenzial (max 5 Punkte)
  if (deal.kategorie === 'supplements' || deal.kategorie === 'fitness') {
    breakdown.humor = 5
  } else if (FITNESS_KATEGORIEN.includes(deal.kategorie)) {
    breakdown.humor = 3
  } else {
    breakdown.humor = 1
  }

  const score = Math.min(100, Math.max(0, Object.values(breakdown).reduce((a, b) => a + b, 0)))

  const tier: DealTier =
    score >= 70 ? 'carousel'
    : score >= 50 ? 'story'
    : 'ignore'

  return { score, tier, breakdown }
}

export function checkAntiSpam(
  deal: Deal,
  context: AntiSpamContext
): { blocked: boolean; reason?: string } {
  const marke = (deal.marke ?? deal.shop).toLowerCase()
  const markeCount = context.dealsByMarke.get(marke) ?? 0
  if (markeCount >= 3) {
    return { blocked: true, reason: `Marke "${marke}" bereits ${markeCount}x heute` }
  }

  const katCount = context.dealsByKategorie.get(deal.kategorie) ?? 0
  if (katCount >= 15) {
    return { blocked: true, reason: `Kategorie "${deal.kategorie}" bereits ${katCount}x heute` }
  }

  const produktKey = deal.produktname.toLowerCase().slice(0, 50)
  if (context.recentProducts.has(produktKey)) {
    return { blocked: true, reason: `Produkt "${deal.produktname}" bereits in letzten 72h gepostet` }
  }

  if (deal.kategorie === 'supplements' && context.consecutiveSupplements >= 5) {
    return { blocked: true, reason: 'Zu viele Supplement-Deals hintereinander' }
  }

  return { blocked: false }
}
