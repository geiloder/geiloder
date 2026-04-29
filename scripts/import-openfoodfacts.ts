import { config } from 'dotenv'
config({ path: '.env.local' })

import { createServiceClient } from '../src/lib/supabase/server'
import { normalizeOpenFoodFactsProduct, type OpenFoodFactsProduct } from './lib/openfoodfacts'

interface SearchResponse {
  products?: OpenFoodFactsProduct[]
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

function getQueries(): string[] {
  return ((process.env.OPENFOODFACTS_QUERIES?.trim() || DEFAULT_QUERIES.join(',')))
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
  })
  if (!response.ok) throw new Error(`Open Food Facts HTTP ${response.status}`)

  const json = await response.json() as SearchResponse
  return json.products ?? []
}

async function importOpenFoodFacts() {
  const supabase = createServiceClient()
  const parsedPageSize = Number.parseInt(process.env.OPENFOODFACTS_PAGE_SIZE?.trim() || '30', 10)
  const pageSize = Number.isFinite(parsedPageSize) ? parsedPageSize : 30
  const queries = getQueries()

  console.log(`Importing Open Food Facts products for ${queries.length} queries...`)

  const byBarcode = new Map<string, OpenFoodFactsProduct>()
  for (const query of queries) {
    console.log(`  Query: ${query}`)
    const products = await fetchProducts(query, pageSize)
    for (const product of products) {
      if (product.code && !byBarcode.has(product.code)) byBarcode.set(product.code, product)
    }
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
  const newDeals = normalized.filter((d) => !existingKeys.has(`manuell::${d.external_id}`))

  if (newDeals.length === 0) {
    console.log('No new Open Food Facts products to import.')
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
