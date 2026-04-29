import { describe, expect, it } from 'vitest'
import { normalizeOpenFoodFactsProduct } from './openfoodfacts'

describe('normalizeOpenFoodFactsProduct', () => {
  it('maps a protein product into a non-affiliate discovery deal', () => {
    const result = normalizeOpenFoodFactsProduct({
      code: '7340001800999',
      product_name: 'Protein bar salty peanuts',
      brands: 'Barebells',
      quantity: '55 g',
      categories_tags: ['en:protein-bars'],
      image_front_url: 'https://images.openfoodfacts.org/images/products/734/000/180/0999/front_en.1.400.jpg',
      url: 'https://world.openfoodfacts.org/product/7340001800999',
      nutriments: {
        proteins_100g: 36,
        proteins_serving: 20,
        sugars_100g: 2.3,
        sugars_serving: 1.3,
        energy_kcal_100g: 371,
        energy_kcal_serving: 204,
      },
    })

    expect(result).toMatchObject({
      external_id: '7340001800999',
      quelle: 'manuell',
      produktname: 'Protein bar salty peanuts',
      marke: 'Barebells',
      shop: 'Open Food Facts',
      kategorie: 'supplements',
      deal_preis: 0,
      affiliate_link: 'https://world.openfoodfacts.org/product/7340001800999',
      content_type: 'product_discovery',
      source_name: 'openfoodfacts',
      barcode: '7340001800999',
      monetization_type: 'none',
      image_license: 'CC BY-SA',
      image_rights_status: 'open_data_reviewed',
    })
    expect(result.product_facts).toMatchObject({
      protein_100g: 36,
      protein_serving: 20,
      sugar_100g: 2.3,
      sugar_serving: 1.3,
      calories_100g: 371,
      calories_serving: 204,
      quantity: '55 g',
    })
  })

  it('rejects products without a name, barcode, or front image', () => {
    expect(normalizeOpenFoodFactsProduct({ code: '', product_name: 'Protein' })).toBeNull()
    expect(normalizeOpenFoodFactsProduct({ code: '123', product_name: '', image_front_url: 'https://example.com/a.jpg' })).toBeNull()
    expect(normalizeOpenFoodFactsProduct({ code: '123', product_name: 'Protein' })).toBeNull()
  })
})
