import { generateDealSlug } from '../../src/lib/utils'
import type { Deal, DealKategorie, ProductFacts } from '../../src/types'

export interface OpenFoodFactsProduct {
  code?: string
  product_name?: string
  brands?: string
  quantity?: string
  categories_tags?: string[]
  image_front_url?: string
  image_url?: string
  url?: string
  nutriscore_grade?: string
  nutriments?: {
    proteins_100g?: number
    proteins_serving?: number
    sugars_100g?: number
    sugars_serving?: number
    energy_kcal_100g?: number
    energy_kcal_serving?: number
    fat_100g?: number
    carbohydrates_100g?: number
    fiber_100g?: number
  }
}

function firstText(value: string | undefined): string | null {
  const text = value?.split(',')[0]?.trim()
  return text ? text : null
}

function detectDiscoveryKategorie(product: OpenFoodFactsProduct): DealKategorie {
  const combined = [
    product.product_name,
    product.brands,
    ...(product.categories_tags ?? []),
  ].join(' ').toLowerCase()

  if (/(protein|whey|creatine|kreatin|supplement|high-protein|protein-bar|protein-powder|eiweiss|evo sports|esn|barebells)/.test(combined)) {
    return 'supplements'
  }
  if (/(energy-drink|isotonic|sports-drink|fitness)/.test(combined)) {
    return 'fitness'
  }
  return 'sonstige'
}

function numberOrNull(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function normalizeOpenFoodFactsProduct(
  product: OpenFoodFactsProduct
): Omit<Deal, 'id' | 'created_at' | 'updated_at'> | null {
  const barcode = product.code?.trim()
  const produktname = product.product_name?.trim()
  const imageUrl = product.image_front_url?.trim() || product.image_url?.trim()

  if (!barcode || !produktname || !imageUrl) return null

  const sourceUrl = product.url?.trim() || `https://world.openfoodfacts.org/product/${barcode}`
  const brand = firstText(product.brands)
  const productFacts: ProductFacts = {
    quantity: product.quantity?.trim() || null,
    protein_100g: numberOrNull(product.nutriments?.proteins_100g),
    protein_serving: numberOrNull(product.nutriments?.proteins_serving),
    sugar_100g: numberOrNull(product.nutriments?.sugars_100g),
    sugar_serving: numberOrNull(product.nutriments?.sugars_serving),
    calories_100g: numberOrNull(product.nutriments?.energy_kcal_100g),
    calories_serving: numberOrNull(product.nutriments?.energy_kcal_serving),
    fat_100g: numberOrNull(product.nutriments?.fat_100g),
    carbs_100g: numberOrNull(product.nutriments?.carbohydrates_100g),
    fiber_100g: numberOrNull(product.nutriments?.fiber_100g),
    nutriscore_grade: product.nutriscore_grade ?? null,
  }

  return {
    external_id: barcode,
    quelle: 'manuell',
    produktname: produktname.slice(0, 255),
    marke: brand,
    shop: 'Open Food Facts',
    kategorie: detectDiscoveryKategorie(product),
    alter_preis: null,
    deal_preis: 0,
    rabatt_prozent: null,
    gutschein_code: null,
    verfuegbarkeit: null,
    produktbild_url: imageUrl,
    affiliate_link: sourceUrl,
    landingpage_url: sourceUrl,
    provision: null,
    deal_score: null,
    status: 'new',
    copy_data: null,
    slug: generateDealSlug(produktname, barcode),
    expires_at: null,
    posted_at: null,
    content_type: 'product_discovery',
    source_name: 'openfoodfacts',
    source_url: sourceUrl,
    barcode,
    image_license: 'CC BY-SA',
    image_rights_status: 'open_data_reviewed',
    attribution_text: 'Data and image: Open Food Facts, CC BY-SA',
    monetization_type: 'none',
    product_facts: productFacts,
  }
}
