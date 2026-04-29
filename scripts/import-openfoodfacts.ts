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
  return (process.env.OPENFOODFACTS_QUERIES ?? DEFAULT_QUERIES.join(','))
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
      'User-Agent': process.env.OPENFOODFACTS_USER_AGENT ?? 'geiloder/0.1 (contact: hello@geiloder.de)',
    },
  })
  if (!response.ok) throw new Error(`Open Food Facts HTTP ${response.status}`)

  const json = await response.json() as SearchResponse
  return json.products ?? []
}

async function importOpenFoodFacts() {
  const supabase = createServiceClient()
  const pageSize = Number.parseInt(process.env.OPENFOODFACTS_PAGE_SIZE ?? '30', 10)
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
    .select('source_name, barcode')
    .eq('source_name', 'openfoodfacts')
    .in('barcode', normalized.map((d) => d.barcode))

  const existingKeys = new Set((existing ?? []).map((d) => `${d.source_name}::${d.barcode}`))
  const newDeals = normalized.filter((d) => !existingKeys.has(`openfoodfacts::${d.barcode}`))

  if (newDeals.length === 0) {
    console.log('No new Open Food Facts products to import.')
    return
  }

  for (let i = 0; i < newDeals.length; i += 100) {
    const batch = newDeals.slice(i, i + 100)
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
