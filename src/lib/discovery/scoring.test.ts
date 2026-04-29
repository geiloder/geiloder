import { describe, expect, it } from 'vitest'
import { scoreDiscoveryProduct } from './scoring'
import type { Deal } from '@/types'

function makeDiscoveryDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-id',
    external_id: '7340001800999',
    quelle: 'manuell',
    produktname: 'Protein bar salty peanuts',
    marke: 'Barebells',
    shop: 'Open Food Facts',
    kategorie: 'supplements',
    alter_preis: null,
    deal_preis: 0,
    rabatt_prozent: null,
    gutschein_code: null,
    verfuegbarkeit: null,
    produktbild_url: 'https://images.openfoodfacts.org/front.jpg',
    affiliate_link: 'https://world.openfoodfacts.org/product/7340001800999',
    landingpage_url: 'https://world.openfoodfacts.org/product/7340001800999',
    provision: null,
    deal_score: null,
    status: 'new',
    copy_data: null,
    slug: 'protein-bar-salty-peanuts-deal-id',
    created_at: new Date().toISOString(),
    expires_at: null,
    posted_at: null,
    updated_at: new Date().toISOString(),
    content_type: 'product_discovery',
    source_name: 'openfoodfacts',
    source_url: 'https://world.openfoodfacts.org/product/7340001800999',
    barcode: '7340001800999',
    image_license: 'CC BY-SA',
    image_rights_status: 'open_data_reviewed',
    attribution_text: 'Data and image: Open Food Facts, CC BY-SA',
    monetization_type: 'none',
    product_facts: {
      quantity: '55 g',
      protein_100g: 36,
      protein_serving: 20,
      sugar_100g: 2.3,
      sugar_serving: 1.3,
      calories_100g: 371,
      calories_serving: 204,
    },
    ...overrides,
  }
}

describe('scoreDiscoveryProduct', () => {
  it('gives a high score to a strong protein snack with image and known brand', () => {
    const result = scoreDiscoveryProduct(makeDiscoveryDeal())
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.tier).toBe('carousel')
  })

  it('penalizes missing image because it cannot become a strong social post', () => {
    const result = scoreDiscoveryProduct(makeDiscoveryDeal({ produktbild_url: null }))
    expect(result.score).toBeLessThan(70)
  })

  it('ignores weak products with little protein and high sugar', () => {
    const result = scoreDiscoveryProduct(makeDiscoveryDeal({
      marke: 'Unknown',
      product_facts: {
        protein_100g: 4,
        sugar_100g: 35,
        calories_100g: 480,
      },
    }))
    expect(result.tier).toBe('ignore')
  })
})
