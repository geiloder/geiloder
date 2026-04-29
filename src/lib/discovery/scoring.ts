import type { Deal, ProductFacts } from '@/types'
import type { DealTier } from '@/lib/scoring'

const DISCOVERY_BRANDS = new Set([
  'barebells',
  'esn',
  'evo sports nutrition',
  'ehrmann',
  'more nutrition',
  'myprotein',
  'powerbar',
  'multipower',
  'body attack',
  'bulk',
  'foods spring',
  'foodspring',
])

export interface DiscoveryScoreDetails {
  score: number
  tier: DealTier
  breakdown: {
    bild: number
    marke: number
    protein: number
    zucker: number
    kategorie: number
    daten: number
    humor: number
  }
}

function factsOf(deal: Deal): ProductFacts {
  return deal.product_facts ?? {}
}

export function scoreDiscoveryProduct(deal: Deal): DiscoveryScoreDetails {
  const facts = factsOf(deal)
  const breakdown = {
    bild: deal.produktbild_url ? 18 : 0,
    marke: 0,
    protein: 0,
    zucker: 0,
    kategorie: deal.kategorie === 'supplements' ? 12 : deal.kategorie === 'fitness' ? 8 : 2,
    daten: 0,
    humor: 0,
  }

  const brand = (deal.marke ?? '').toLowerCase()
  if (DISCOVERY_BRANDS.has(brand)) breakdown.marke = 15
  else if (brand.length > 2) breakdown.marke = 6

  const proteinServing = facts.protein_serving ?? null
  const protein100g = facts.protein_100g ?? null
  if ((proteinServing ?? 0) >= 20 || (protein100g ?? 0) >= 35) breakdown.protein = 25
  else if ((proteinServing ?? 0) >= 15 || (protein100g ?? 0) >= 25) breakdown.protein = 20
  else if ((proteinServing ?? 0) >= 10 || (protein100g ?? 0) >= 15) breakdown.protein = 12
  else if ((protein100g ?? 0) >= 8) breakdown.protein = 6

  const sugarServing = facts.sugar_serving ?? null
  const sugar100g = facts.sugar_100g ?? null
  if ((sugarServing !== null && sugarServing <= 2) || (sugar100g !== null && sugar100g <= 5)) breakdown.zucker = 14
  else if ((sugarServing !== null && sugarServing <= 5) || (sugar100g !== null && sugar100g <= 10)) breakdown.zucker = 9
  else if ((sugar100g ?? 100) <= 20) breakdown.zucker = 3

  const populatedFacts = Object.values(facts).filter((v) => v !== null && v !== undefined && v !== '').length
  breakdown.daten = Math.min(10, populatedFacts * 2)

  const combined = `${deal.produktname} ${deal.marke ?? ''}`.toLowerCase()
  if (/(bar|riegel|pudding|cookie|brownie|fudge|peanut|chocolate|vanilla|cookies|cream)/.test(combined)) {
    breakdown.humor = 6
  } else if (deal.kategorie === 'supplements') {
    breakdown.humor = 3
  }

  const rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const score = Math.min(deal.produktbild_url ? 100 : 65, rawScore)
  const tier: DealTier = score >= 70 ? 'carousel' : score >= 50 ? 'story' : 'ignore'

  return { score, tier, breakdown }
}
