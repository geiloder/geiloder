import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateDealSlug } from '@/lib/utils'
import { scoreDiscoveryProduct } from '@/lib/discovery/scoring'
import type { Deal, DealKategorie, ProductFacts } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface OpenFoodFactsProduct {
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

const DEFAULT_QUERIES = [
  'protein bar',
  'high protein pudding',
  'whey protein',
  'protein drink',
  'creatine',
  'esn',
  'evo sports nutrition',
  'barebells',
  'ehrmann high protein',
]

const FIELDS = [
  'code',
  'product_name',
  'brands',
  'quantity',
  'categories_tags',
  'image_front_url',
  'image_url',
  'url',
  'nutriscore_grade',
  'nutriments',
].join(',')

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

function firstText(value: string | undefined): string | null {
  const text = value?.split(',')[0]?.trim()
  return text ? text : null
}

function numberOrNull(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function detectKategorie(product: OpenFoodFactsProduct): DealKategorie {
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

function getQueries(): string[] {
  return (process.env.OPENFOODFACTS_QUERIES?.trim() || DEFAULT_QUERIES.join(','))
    .split(',')
    .map((q) => q.trim())
    .filter(Boolean)
}

async function fetchProducts(query: string, pageSize: number): Promise<OpenFoodFactsProduct[]> {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
  url.searchParams.set('search_terms', query)
  url.searchParams.set('search_simple', '1')
  url.searchParams.set('action', 'process')
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', String(pageSize))
  url.searchParams.set('fields', FIELDS)

  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.OPENFOODFACTS_USER_AGENT?.trim() || 'geiloder/0.1 (contact: hello@geiloder.de)',
    },
    next: { revalidate: 0 },
  })
  if (!response.ok) throw new Error(`Open Food Facts HTTP ${response.status}`)

  const json = await response.json() as { products?: OpenFoodFactsProduct[] }
  return json.products ?? []
}

function normalizeProduct(product: OpenFoodFactsProduct) {
  const barcode = product.code?.trim()
  const produktname = product.product_name?.trim()
  const imageUrl = product.image_front_url?.trim() || product.image_url?.trim()

  if (!barcode || !produktname || !imageUrl) return null

  const sourceUrl = product.url?.trim() || `https://world.openfoodfacts.org/product/${barcode}`
  const facts: ProductFacts = {
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

  const dealForScore = {
    produktname,
    marke: firstText(product.brands),
    shop: 'Open Food Facts',
    kategorie: detectKategorie(product),
    produktbild_url: imageUrl,
    content_type: 'product_discovery',
    monetization_type: 'none',
    product_facts: facts,
  } as Deal
  const { score } = scoreDiscoveryProduct(dealForScore)

  return {
    external_id: barcode,
    quelle: 'manuell',
    produktname: produktname.slice(0, 255),
    marke: firstText(product.brands),
    shop: 'Open Food Facts',
    kategorie: detectKategorie(product),
    alter_preis: null,
    deal_preis: 0,
    rabatt_prozent: null,
    gutschein_code: null,
    verfuegbarkeit: null,
    produktbild_url: imageUrl,
    affiliate_link: sourceUrl,
    landingpage_url: sourceUrl,
    provision: null,
    deal_score: Math.max(score, 85),
    status: 'approved',
    copy_data: {
      content_type: 'product_discovery',
      monetization_type: 'none',
      product_facts: facts,
      attribution_text: 'Data and image: Open Food Facts, CC BY-SA',
    },
    slug: generateDealSlug(produktname, barcode),
    expires_at: null,
    posted_at: null,
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const pageSize = Math.min(Number.parseInt(process.env.OPENFOODFACTS_PAGE_SIZE?.trim() || '30', 10) || 30, 50)
  const productsByBarcode = new Map<string, OpenFoodFactsProduct>()

  for (const query of getQueries()) {
    const products = await fetchProducts(query, pageSize)
    for (const product of products) {
      if (product.code && !productsByBarcode.has(product.code)) productsByBarcode.set(product.code, product)
    }
  }

  const normalized = Array.from(productsByBarcode.values())
    .map(normalizeProduct)
    .filter((deal): deal is NonNullable<typeof deal> => deal !== null)

  if (normalized.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, message: 'Keine nutzbaren Open-Food-Facts-Produkte gefunden.' })
  }

  const { data: existing, error: existingError } = await supabase
    .from('deals')
    .select('external_id, quelle')
    .eq('quelle', 'manuell')
    .in('external_id', normalized.map((d) => d.external_id))

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })

  const existingKeys = new Set((existing ?? []).map((d) => `${d.quelle}::${d.external_id}`))
  const newDeals = normalized.filter((d) => !existingKeys.has(`manuell::${d.external_id}`)).slice(0, 50)

  if (newDeals.length === 0) {
    return NextResponse.json({ imported: 0, skipped: normalized.length, message: 'Keine neuen Produkte gefunden.' })
  }

  const { error } = await supabase.from('deals').insert(newDeals)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    imported: newDeals.length,
    skipped: normalized.length - newDeals.length,
    message: `${newDeals.length} Open-Food-Facts-Produkte importiert und approved.`,
  })
}
