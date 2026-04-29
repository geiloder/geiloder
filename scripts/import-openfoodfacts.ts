import { config } from 'dotenv'
config({ path: '.env.local' })

import { createServiceClient } from '../src/lib/supabase/server'
import { normalizeOpenFoodFactsProduct, type OpenFoodFactsProduct } from './lib/openfoodfacts'

interface SearchResponse {
  products?: OpenFoodFactsProduct[]
}

const DEFAULT_QUERIES = [
  'protein bar',
  'protein bars',
  'high protein pudding',
  'whey protein',
  'whey isolate',
  'protein drink',
  'protein shake',
  'protein smoothie',
  'creatine',
  'kreatin',
  'esn',
  'evo sports nutrition',
  'barebells',
  'ehrmann high protein',
  'more nutrition',
  'myprotein',
  'powerbar',
  'body attack',
  'foodspring',
  'protein cookie',
  'protein brownie',
  'protein chips',
  'high protein yoghurt',
  'energy drink',
  'zero sugar protein',
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

function getQueries(): string[] {
  return ((process.env.OPENFOODFACTS_QUERIES?.trim() || DEFAULT_QUERIES.join(',')))
    .split(',')
    .map((q) => q.trim())
    .filter(Boolean)
}

async function fetchProductsPage(query: string, pageSize: number, page: number): Promise<OpenFoodFactsProduct[]> {
  const v2Url = new URL('https://world.openfoodfacts.org/api/v2/search')
  v2Url.searchParams.set('search_terms', query)
  v2Url.searchParams.set('page_size', String(pageSize))
  v2Url.searchParams.set('page', String(page))
  v2Url.searchParams.set('fields', FIELDS)
  v2Url.searchParams.set('sort_by', 'last_modified_t')

  const v2Products = await fetchProductsUrl(v2Url)
  if (v2Products.length > 0) return v2Products

  const legacyUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl')
  legacyUrl.searchParams.set('search_terms', query)
  legacyUrl.searchParams.set('search_simple', '1')
  legacyUrl.searchParams.set('action', 'process')
  legacyUrl.searchParams.set('json', '1')
  legacyUrl.searchParams.set('page_size', String(pageSize))
  legacyUrl.searchParams.set('page', String(page))
  legacyUrl.searchParams.set('fields', FIELDS)
  legacyUrl.searchParams.set('sort_by', 'last_modified_t')

  return fetchProductsUrl(legacyUrl)
}

async function fetchProductsUrl(url: URL): Promise<OpenFoodFactsProduct[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.OPENFOODFACTS_USER_AGENT?.trim() || 'geiloder/0.1 (contact: hello@geiloder.de)',
      'Accept': 'application/json',
    },
  })
  if (!response.ok) throw new Error(`Open Food Facts HTTP ${response.status}`)

  const json = await response.json() as SearchResponse
  return json.products ?? []
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value?.trim() || String(fallback), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function rotate<T>(items: T[], offset: number): T[] {
  if (items.length === 0) return items
  const normalizedOffset = offset % items.length
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)]
}

function daySeed(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.floor((current - start) / 86_400_000)
}

async function importOpenFoodFacts() {
  const supabase = createServiceClient()
  const pageSize = Math.min(positiveInt(process.env.OPENFOODFACTS_PAGE_SIZE, 30), 50)
  const targetCount = Math.min(positiveInt(process.env.OPENFOODFACTS_TARGET_COUNT, 50), 50)
  const maxPages = Math.min(positiveInt(process.env.OPENFOODFACTS_MAX_PAGES, 8), 20)
  const seed = daySeed()
  const queries = rotate(getQueries(), seed)

  console.log(`Importing Open Food Facts products for ${queries.length} queries...`)
  console.log(`Target: ${targetCount} new products, page size: ${pageSize}, max pages/query: ${maxPages}`)

  const byBarcode = new Map<string, OpenFoodFactsProduct>()
  const candidateTarget = targetCount * 4
  let fetchFailures = 0

  for (let queryIndex = 0; queryIndex < queries.length; queryIndex++) {
    const query = queries[queryIndex]
    const pageStart = ((seed + queryIndex) % maxPages) + 1
    const pages = rotate(Array.from({ length: maxPages }, (_, i) => i + 1), pageStart - 1)

    for (const page of pages) {
      console.log(`  Query: ${query} (page ${page})`)
      let products: OpenFoodFactsProduct[] = []
      try {
        products = await fetchProductsPage(query, pageSize, page)
      } catch (error) {
        fetchFailures++
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`  Open Food Facts fetch failed for "${query}" page ${page}: ${message}`)
        continue
      }
      for (const product of products) {
        if (product.code && !byBarcode.has(product.code)) byBarcode.set(product.code, product)
      }
      if (byBarcode.size >= candidateTarget) break
    }
    if (byBarcode.size >= candidateTarget) break
  }

  if (fetchFailures > 0) {
    console.warn(`Open Food Facts fetch warnings: ${fetchFailures} failed query/page requests`)
  }

  const normalized = Array.from(byBarcode.values())
    .map(normalizeOpenFoodFactsProduct)
    .filter((deal): deal is NonNullable<typeof deal> => deal !== null)

  if (normalized.length === 0) {
    console.log('No usable Open Food Facts products found.')
    return
  }

  const { data: existing } = await supabase
    .from('deals')
    .select('external_id, quelle')
    .eq('quelle', 'manuell')
    .in('external_id', normalized.map((d) => d.external_id).filter(Boolean))

  const existingKeys = new Set((existing ?? []).map((d) => `${d.quelle}::${d.external_id}`))
  const newDeals = normalized
    .filter((d) => !existingKeys.has(`manuell::${d.external_id}`))
    .slice(0, targetCount)

  if (newDeals.length === 0) {
    console.log(`No new Open Food Facts products to import. Checked ${normalized.length} usable candidates.`)
    return
  }

  for (let i = 0; i < newDeals.length; i += 100) {
    const batch = newDeals.slice(i, i + 100).map((deal) => ({
      external_id: deal.external_id,
      quelle: deal.quelle,
      produktname: deal.produktname,
      marke: deal.marke,
      shop: deal.shop,
      kategorie: deal.kategorie,
      alter_preis: deal.alter_preis,
      deal_preis: deal.deal_preis,
      rabatt_prozent: deal.rabatt_prozent,
      gutschein_code: deal.gutschein_code,
      verfuegbarkeit: deal.verfuegbarkeit,
      produktbild_url: deal.produktbild_url,
      affiliate_link: deal.affiliate_link,
      landingpage_url: deal.landingpage_url,
      provision: deal.provision,
      deal_score: deal.deal_score,
      status: deal.status,
      copy_data: {
        content_type: 'product_discovery',
        monetization_type: 'none',
        product_facts: deal.product_facts,
        attribution_text: deal.attribution_text,
      },
      slug: deal.slug,
      expires_at: deal.expires_at,
      posted_at: deal.posted_at,
    }))
    const { error } = await supabase.from('deals').insert(batch)
    if (error) throw error
    console.log(`  Inserted ${batch.length} discovery products`)
  }

  console.log(`Open Food Facts import complete: ${newDeals.length} new products`)
}

importOpenFoodFacts().catch((error) => {
  console.error(error)
  process.exit(1)
})
