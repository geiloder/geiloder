import { config } from 'dotenv'
config({ path: '.env.local' })
import Papa from 'papaparse'
import { readFileSync } from 'fs'
import { createServiceClient } from '../src/lib/supabase/server'
import { normalizeRawDeal } from './lib/normalizer'
import { filterNewDeals, deduplicateWithinBatch } from './lib/deduplicator'
import { cacheProductImage } from './lib/image-cache'
import type { RawFeedDeal } from '../src/types'

interface AdcellRow {
  'ProductID': string
  'ProductName': string
  'BrandName': string
  'ShopName': string
  'Price': string
  'OldPrice': string
  'DeepLink': string
  'ImageURL': string
  'ProductURL': string
  'StockStatus': string
  'ValidUntil': string
  'Commission': string
}

function parseAdcellRow(row: AdcellRow): RawFeedDeal | null {
  const dealPreis = parseFloat(row['Price']?.replace(',', '.').replace('€', '').trim() ?? '0')
  if (!dealPreis || dealPreis <= 0) return null

  const affiliateLink = row['DeepLink']
  if (!affiliateLink) return null

  const alterPreisStr = row['OldPrice']?.replace(',', '.').replace('€', '').trim()
  const alterPreis = alterPreisStr ? parseFloat(alterPreisStr) : undefined
  const provision = row['Commission']
    ? parseFloat(row['Commission'].replace('%', '').replace(',', '.'))
    : undefined

  return {
    external_id: row['ProductID'],
    quelle: 'adcell',
    produktname: row['ProductName'] || '',
    marke: row['BrandName'] || undefined,
    shop: row['ShopName'] || '',
    alter_preis: alterPreis,
    deal_preis: dealPreis,
    produktbild_url: row['ImageURL'] || undefined,
    affiliate_link: affiliateLink,
    landingpage_url: row['ProductURL'] || undefined,
    provision,
    verfuegbarkeit: row['StockStatus'] || undefined,
    expires_at: row['ValidUntil'] || undefined,
  }
}

async function importAdcellFeed(feedUrl: string) {
  console.log(`Importing ADCELL feed: ${feedUrl}`)

  let csvText: string
  if (feedUrl === 'local') {
    csvText = readFileSync('./scripts/test-data/adcell-sample.csv', 'utf-8')
  } else {
    const response = await fetch(feedUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    csvText = await response.text()
  }

  const { data } = Papa.parse<AdcellRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
  })

  console.log(`Parsed ${data.length} rows from ADCELL feed`)

  const rawDeals: RawFeedDeal[] = data
    .map(parseAdcellRow)
    .filter((d): d is RawFeedDeal => d !== null)

  const uniqueDeals = deduplicateWithinBatch(rawDeals)
  const newDeals = await filterNewDeals(uniqueDeals)

  console.log(`New deals: ${newDeals.length}`)
  if (newDeals.length === 0) {
    console.log('No new deals to import.')
    return
  }

  const normalizedDeals = newDeals.map(normalizeRawDeal)
  const supabase = createServiceClient()

  for (let i = 0; i < normalizedDeals.length; i += 100) {
    const batch = normalizedDeals.slice(i, i + 100)
    const { error } = await supabase.from('deals').insert(batch)
    if (error) console.error(`Batch error:`, error.message)
    else console.log(`Inserted ${batch.length} deals`)
  }

  // Cache product images
  const { data: inserted } = await supabase
    .from('deals')
    .select('id, produktbild_url, external_id')
    .eq('quelle', 'adcell')
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

const feedUrl = process.env.ADCELL_FEED_URL
if (!feedUrl) {
  console.error('ADCELL_FEED_URL not set')
  process.exit(1)
}

importAdcellFeed(feedUrl).catch(console.error)
