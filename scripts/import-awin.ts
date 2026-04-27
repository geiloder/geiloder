import { config } from 'dotenv'
config({ path: '.env.local' })
import Papa from 'papaparse'
import { readFileSync } from 'fs'
import { createServiceClient } from '../src/lib/supabase/server'
import { normalizeRawDeal } from './lib/normalizer'
import { filterNewDeals, deduplicateWithinBatch } from './lib/deduplicator'
import { cacheProductImage } from './lib/image-cache'
import type { RawFeedDeal } from '../src/types'

interface AwinRow {
  'aw_product_id': string
  'product_name': string
  'description': string
  'category_name': string
  'merchant_name': string
  'merchant_id': string
  'store_price': string
  'rrp_price': string
  'aw_deep_link': string
  'merchant_product_url': string
  'merchant_image_url': string
  'large_image': string
  'stock_quantity': string
  'valid_to': string
  'commission_group': string
  'brand_name': string
}

function parseAwinRow(row: AwinRow, provision: number): RawFeedDeal | null {
  const dealPreis = parseFloat(row['store_price']?.replace(',', '.') ?? '0')
  if (!dealPreis || dealPreis <= 0) return null

  const affiliateLink = row['aw_deep_link']
  if (!affiliateLink) return null

  return {
    external_id: row['aw_product_id'],
    quelle: 'awin',
    produktname: row['product_name'] || '',
    marke: row['brand_name'] || row['merchant_name'] || undefined,
    shop: row['merchant_name'] || '',
    alter_preis: row['rrp_price'] ? parseFloat(row['rrp_price'].replace(',', '.')) : undefined,
    deal_preis: dealPreis,
    produktbild_url: row['large_image'] || row['merchant_image_url'] || undefined,
    affiliate_link: affiliateLink,
    landingpage_url: row['merchant_product_url'] || undefined,
    provision,
    verfuegbarkeit: row['stock_quantity'] || undefined,
    expires_at: row['valid_to'] || undefined,
  }
}

async function importAwinFeed(feedUrl: string, provision: number) {
  console.log(`Importing Awin feed: ${feedUrl}`)

  let csvText: string
  if (feedUrl === 'local') {
    csvText = readFileSync('./scripts/test-data/awin-sample.csv', 'utf-8')
  } else {
    const response = await fetch(feedUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    csvText = await response.text()
  }

  const { data, errors } = Papa.parse<AwinRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  })

  if (errors.length > 0) {
    console.warn(`Parse warnings: ${errors.slice(0, 3).map((e) => e.message).join(', ')}`)
  }

  console.log(`Parsed ${data.length} rows from Awin feed`)

  const rawDeals: RawFeedDeal[] = data
    .map((row) => parseAwinRow(row, provision))
    .filter((d): d is RawFeedDeal => d !== null)

  console.log(`Valid deals: ${rawDeals.length}`)

  const uniqueDeals = deduplicateWithinBatch(rawDeals)
  const newDeals = await filterNewDeals(uniqueDeals)
  console.log(`New deals (not in DB): ${newDeals.length}`)

  if (newDeals.length === 0) {
    console.log('No new deals to import.')
    return
  }

  const normalizedDeals = newDeals.map(normalizeRawDeal)
  const supabase = createServiceClient()

  for (let i = 0; i < normalizedDeals.length; i += 100) {
    const batch = normalizedDeals.slice(i, i + 100)
    const { error } = await supabase.from('deals').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / 100) + 1}:`, error.message)
    } else {
      console.log(`Inserted batch ${Math.floor(i / 100) + 1} (${batch.length} deals)`)
    }
  }

  // Cache product images in Supabase Storage
  const { data: inserted } = await supabase
    .from('deals')
    .select('id, produktbild_url, external_id')
    .eq('quelle', 'awin')
    .in('external_id', newDeals.map((d) => d.external_id))

  for (const deal of inserted ?? []) {
    if (!deal.produktbild_url) continue
    console.log(`  Caching image for ${deal.id}...`)
    const cachedUrl = await cacheProductImage(deal.produktbild_url as string, deal.id as string)
    if (cachedUrl) {
      await supabase.from('deals').update({ produktbild_url: cachedUrl }).eq('id', deal.id)
    }
  }

  console.log(`Import complete: ${newDeals.length} new deals added`)
}

const feedUrl = process.env.AWIN_FEED_URL
if (!feedUrl) {
  console.error('AWIN_FEED_URL environment variable not set')
  process.exit(1)
}

const provision = parseFloat(process.env.AWIN_DEFAULT_PROVISION ?? '5')
importAwinFeed(feedUrl, provision).catch(console.error)
