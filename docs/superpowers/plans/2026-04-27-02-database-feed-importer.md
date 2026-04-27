# Database & Feed Importer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase PostgreSQL Schema vollständig angelegt + Awin/ADCELL CSV-Feed-Importer der Produktdaten normalisiert, dedupliziert und in die Datenbank schreibt.

**Architecture:** Supabase SQL-Migrationen für das Schema. TypeScript-Skripte (`scripts/`) die direkt mit dem Supabase Service Role Key arbeiten. CSV-Parsing mit `papaparse`. Deduplication via `external_id + quelle`. Normalization mappt rohe Feed-Felder auf unser `deals`-Schema.

**Tech Stack:** Supabase PostgreSQL, TypeScript (`tsx` runner), papaparse, node-fetch

---

## File Structure

```
/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── scripts/
│   ├── import-awin.ts
│   ├── import-adcell.ts
│   └── lib/
│       ├── normalizer.ts
│       └── deduplicator.ts
├── src/
│   └── lib/
│       └── supabase/
│           └── queries.ts   (Deal-Abfragen für die Website)
```

---

### Task 1: Supabase Schema erstellen

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: SQL-Migration schreiben**

`supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- DEALS
-- =====================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT,
  quelle TEXT NOT NULL CHECK (quelle IN ('awin', 'adcell', 'amazon', 'manuell')),
  produktname TEXT NOT NULL,
  marke TEXT,
  shop TEXT NOT NULL,
  kategorie TEXT NOT NULL DEFAULT 'sonstige',
  alter_preis DECIMAL(10, 2),
  deal_preis DECIMAL(10, 2) NOT NULL,
  rabatt_prozent DECIMAL(5, 2),
  gutschein_code TEXT,
  verfuegbarkeit TEXT,
  produktbild_url TEXT,
  affiliate_link TEXT NOT NULL,
  landingpage_url TEXT,
  provision DECIMAL(5, 2),
  deal_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'approved', 'rejected', 'rendered', 'scheduled', 'posted', 'expired')),
  copy_data JSONB,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(external_id, quelle)
);

CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_kategorie ON public.deals(kategorie);
CREATE INDEX idx_deals_score ON public.deals(deal_score DESC);
CREATE INDEX idx_deals_created_at ON public.deals(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- SHOPS
-- =====================
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  affiliate_programm TEXT,
  social_erlaubt BOOLEAN DEFAULT true,
  deeplink_erlaubt BOOLEAN DEFAULT true,
  bilder_erlaubt BOOLEAN DEFAULT true,
  provision_rate DECIMAL(5, 2),
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- POSTS
-- =====================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  plattform TEXT NOT NULL CHECK (plattform IN ('instagram', 'tiktok', 'pinterest', 'youtube')),
  post_type TEXT NOT NULL CHECK (post_type IN ('carousel', 'story', 'reel', 'pin')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'posted', 'failed')),
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  external_post_id TEXT,
  assets JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_deal_id ON public.posts(deal_id);
CREATE INDEX idx_posts_status ON public.posts(status);

-- =====================
-- CLICKS
-- =====================
CREATE TABLE public.clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  source TEXT,
  plattform TEXT,
  post_id UUID REFERENCES public.posts(id),
  ip_hash TEXT,
  user_agent TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_deal_id ON public.clicks(deal_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at DESC);

-- =====================
-- AFFILIATE PROGRAMMES
-- =====================
CREATE TABLE public.affiliate_programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  netzwerk TEXT NOT NULL CHECK (netzwerk IN ('awin', 'adcell', 'amazon', 'sonstige')),
  programm_name TEXT NOT NULL,
  shop TEXT,
  provision_rate DECIMAL(5, 2),
  social_erlaubt BOOLEAN DEFAULT true,
  deeplink_erlaubt BOOLEAN DEFAULT true,
  feed_url TEXT,
  feed_typ TEXT DEFAULT 'csv' CHECK (feed_typ IN ('csv', 'xml', 'api')),
  aktiv BOOLEAN DEFAULT true,
  zuletzt_importiert_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
-- Deals: public read for approved/posted, service_role for write
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read approved deals" ON public.deals
  FOR SELECT USING (status IN ('approved', 'rendered', 'scheduled', 'posted'));

-- Clicks: anyone can insert (for tracking), service_role can read
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert click" ON public.clicks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_role can read clicks" ON public.clicks
  FOR SELECT USING (auth.role() = 'service_role');

-- Supabase Storage: Public bucket for rendered assets
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true)
  ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Migration in Supabase ausführen**

1. Supabase Dashboard öffnen
2. SQL Editor → New Query
3. Den gesamten Inhalt von `001_initial_schema.sql` einfügen
4. Run (Strg+Enter)

Expected: "Success. No rows returned."

- [ ] **Step 3: Tabellen prüfen**

In Supabase Dashboard → Table Editor: `deals`, `shops`, `posts`, `clicks`, `affiliate_programmes` müssen sichtbar sein.

---

### Task 2: Supabase Query-Utilities für die Website

**Files:**
- Create: `src/lib/supabase/queries.ts`

- [ ] **Step 1: Deal-Queries schreiben**

`src/lib/supabase/queries.ts`:

```typescript
import { createClient } from './server'
import type { Deal } from '@/types'

export async function getApprovedDeals(options: {
  limit?: number
  offset?: number
  kategorie?: string
} = {}): Promise<Deal[]> {
  const supabase = await createClient()
  let query = supabase
    .from('deals')
    .select('*')
    .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
    .order('deal_score', { ascending: false })
    .order('created_at', { ascending: false })

  if (options.kategorie) {
    query = query.eq('kategorie', options.kategorie)
  }

  const { data, error } = await query
    .limit(options.limit ?? 20)
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 20) - 1)

  if (error) throw error
  return (data ?? []) as Deal[]
}

export async function getDealBySlug(slug: string): Promise<Deal | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('slug', slug)
    .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
    .single()

  if (error) return null
  return data as Deal
}

export async function getDealById(id: string): Promise<Deal | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Deal
}

export async function getSimilarDeals(deal: Deal, limit = 4): Promise<Deal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('kategorie', deal.kategorie)
    .neq('id', deal.id)
    .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
    .order('deal_score', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as Deal[]
}

export async function getAllDealsForAdmin(): Promise<Deal[]> {
  // Uses service role — only call from server-side admin routes
  const { createServiceClient } = await import('./server')
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw error
  return (data ?? []) as Deal[]
}
```

---

### Task 3: Feed-Normalizer

**Files:**
- Create: `scripts/lib/normalizer.ts`

- [ ] **Step 1: Kategorie-Mapping und Normalizer schreiben**

`scripts/lib/normalizer.ts`:

```typescript
import { slugify, generateDealSlug } from '../../src/lib/utils'
import type { RawFeedDeal, Deal, DealKategorie } from '../../src/types'

const KATEGORIE_KEYWORDS: Record<DealKategorie, string[]> = {
  supplements: [
    'protein', 'kreatin', 'creatine', 'pre-workout', 'preworkout',
    'bcaa', 'aminosäure', 'amino acid', 'whey', 'supplement', 'ergänzung',
    'vitamin', 'magnesium', 'zink', 'omega', 'kollagen', 'collagen',
    'l-carnitin', 'carnitine', 'gainer', 'mass gainer',
  ],
  fitness: [
    'fitness', 'training', 'workout', 'sport', 'gym', 'hantel', 'dumbbell',
    'kettlebell', 'resistance band', 'widerstandsband', 'foam roller',
    'yoga', 'pilates', 'crossfit',
  ],
  'home-gym': [
    'home gym', 'heimtrainer', 'laufband', 'treadmill', 'fahrradergometer',
    'ergometer', 'rudergerät', 'rowing', 'rack', 'hantelbank', 'bench press',
    'pull-up', 'klimmzugstange', 'squat',
  ],
  gymwear: [
    'sportshirt', 'sporthose', 'leggings', 'sports bra', 'sport bh',
    'gymwear', 'training shirt', 'shorts', 'hoodie', 'compression',
    'laufsocken', 'sportschuhe', 'running shoes',
  ],
  gadgets: [
    'gadget', 'smartwatch', 'fitness tracker', 'garmin', 'fitbit', 'polar',
    'herzfrequenz', 'heart rate', 'massagepistole', 'massage gun',
    'theragun', 'hypervolt', 'elektrostimulation',
  ],
  beauty: ['beauty', 'kosmetik', 'hautpflege', 'skincare', 'parfum', 'shampoo'],
  'home-living': ['haushalt', 'küche', 'möbel', 'lamp', 'kissen', 'decke'],
  tech: ['laptop', 'smartphone', 'tablet', 'kopfhörer', 'headphone', 'speaker'],
  fashion: ['mode', 'kleid', 'jeans', 'tasche', 'bag', 'schuhe'],
  sonstige: [],
}

export function detectKategorie(produktname: string, shop: string): DealKategorie {
  const combined = `${produktname} ${shop}`.toLowerCase()

  for (const [kategorie, keywords] of Object.entries(KATEGORIE_KEYWORDS)) {
    if (kategorie === 'sonstige') continue
    if (keywords.some((kw) => combined.includes(kw))) {
      return kategorie as DealKategorie
    }
  }

  return 'sonstige'
}

export function calculateRabatt(alterPreis: number | undefined, dealPreis: number): number | null {
  if (!alterPreis || alterPreis <= dealPreis) return null
  return ((alterPreis - dealPreis) / alterPreis) * 100
}

export function normalizeRawDeal(raw: RawFeedDeal): Omit<Deal, 'id' | 'created_at' | 'updated_at'> {
  const kategorie = detectKategorie(raw.produktname, raw.shop)
  const rabatt = raw.rabatt_prozent ?? calculateRabatt(raw.alter_preis, raw.deal_preis)
  const placeholderId = crypto.randomUUID()

  return {
    external_id: raw.external_id,
    quelle: raw.quelle,
    produktname: raw.produktname.trim().slice(0, 255),
    marke: raw.marke?.trim() ?? null,
    shop: raw.shop.trim(),
    kategorie,
    alter_preis: raw.alter_preis ?? null,
    deal_preis: raw.deal_preis,
    rabatt_prozent: rabatt !== null ? Math.round(rabatt * 100) / 100 : null,
    gutschein_code: raw.gutschein_code?.trim() ?? null,
    verfuegbarkeit: raw.verfuegbarkeit?.trim() ?? null,
    produktbild_url: raw.produktbild_url?.trim() ?? null,
    affiliate_link: raw.affiliate_link.trim(),
    landingpage_url: raw.landingpage_url?.trim() ?? null,
    provision: raw.provision ?? null,
    deal_score: null,
    status: 'new',
    copy_data: null,
    slug: generateDealSlug(raw.produktname, placeholderId),
    expires_at: raw.expires_at ?? null,
    posted_at: null,
  }
}
```

---

### Task 4: Deduplizierung

**Files:**
- Create: `scripts/lib/deduplicator.ts`

- [ ] **Step 1: Deduplicator schreiben**

`scripts/lib/deduplicator.ts`:

```typescript
import { createServiceClient } from '../../src/lib/supabase/server'
import type { RawFeedDeal } from '../../src/types'

export async function filterNewDeals(rawDeals: RawFeedDeal[]): Promise<RawFeedDeal[]> {
  const supabase = createServiceClient()

  // Alle external_ids aus dem aktuellen Batch
  const externalIds = rawDeals.map((d) => d.external_id)

  // Welche davon existieren bereits in der DB?
  const { data: existing } = await supabase
    .from('deals')
    .select('external_id, quelle')
    .in('external_id', externalIds)

  const existingSet = new Set(
    (existing ?? []).map((d) => `${d.quelle}::${d.external_id}`)
  )

  return rawDeals.filter(
    (d) => !existingSet.has(`${d.quelle}::${d.external_id}`)
  )
}

export function deduplicateWithinBatch(rawDeals: RawFeedDeal[]): RawFeedDeal[] {
  const seen = new Set<string>()
  return rawDeals.filter((d) => {
    const key = `${d.quelle}::${d.external_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```

---

### Task 5: Awin Feed Importer

**Files:**
- Create: `scripts/import-awin.ts`

- [ ] **Step 1: Awin Importer schreiben**

`scripts/import-awin.ts`:

```typescript
import 'dotenv/config'
import Papa from 'papaparse'
import { createServiceClient } from '../src/lib/supabase/server'
import { normalizeRawDeal } from './lib/normalizer'
import { filterNewDeals, deduplicateWithinBatch } from './lib/deduplicator'
import type { RawFeedDeal } from '../src/types'

// Awin CSV Feed Spalten (Standard-Mapping, kann je nach Programm abweichen)
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

  const affiliate_link = row['aw_deep_link']
  if (!affiliate_link) return null

  const produktbild = row['large_image'] || row['merchant_image_url'] || undefined

  return {
    external_id: row['aw_product_id'],
    quelle: 'awin',
    produktname: row['product_name'] || '',
    marke: row['brand_name'] || row['merchant_name'] || undefined,
    shop: row['merchant_name'] || '',
    alter_preis: row['rrp_price'] ? parseFloat(row['rrp_price'].replace(',', '.')) : undefined,
    deal_preis: dealPreis,
    produktbild_url: produktbild,
    affiliate_link,
    landingpage_url: row['merchant_product_url'] || undefined,
    provision,
    verfuegbarkeit: row['stock_quantity'] || undefined,
    expires_at: row['valid_to'] || undefined,
  }
}

async function importAwinFeed(feedUrl: string, provision: number) {
  console.log(`Importing Awin feed: ${feedUrl}`)

  const response = await fetch(feedUrl)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

  const csvText = await response.text()

  const { data, errors } = Papa.parse<AwinRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  })

  if (errors.length > 0) {
    console.warn(`Parse warnings: ${errors.slice(0, 3).map(e => e.message).join(', ')}`)
  }

  console.log(`Parsed ${data.length} rows from Awin feed`)

  // Parsen
  const rawDeals: RawFeedDeal[] = data
    .map((row) => parseAwinRow(row, provision))
    .filter((d): d is RawFeedDeal => d !== null)

  console.log(`Valid deals: ${rawDeals.length}`)

  // Deduplizierung innerhalb des Batches
  const uniqueDeals = deduplicateWithinBatch(rawDeals)

  // Nur neue Deals (nicht in DB)
  const newDeals = await filterNewDeals(uniqueDeals)
  console.log(`New deals (not in DB): ${newDeals.length}`)

  if (newDeals.length === 0) {
    console.log('No new deals to import.')
    return
  }

  // Normalisieren
  const normalizedDeals = newDeals.map(normalizeRawDeal)

  // In Supabase schreiben (in Batches von 100)
  const supabase = createServiceClient()
  const batchSize = 100

  for (let i = 0; i < normalizedDeals.length; i += batchSize) {
    const batch = normalizedDeals.slice(i, i + batchSize)
    const { error } = await supabase.from('deals').insert(batch)
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message)
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} deals)`)
    }
  }

  console.log(`Import complete: ${newDeals.length} new deals added`)
}

// Main
const feedUrl = process.env.AWIN_FEED_URL
if (!feedUrl) {
  console.error('AWIN_FEED_URL environment variable not set')
  process.exit(1)
}

const provision = parseFloat(process.env.AWIN_DEFAULT_PROVISION ?? '5')

importAwinFeed(feedUrl, provision).catch(console.error)
```

- [ ] **Step 2: Dependencies installieren**

```bash
npm install papaparse dotenv
npm install -D @types/papaparse tsx
```

- [ ] **Step 3: Script-Shortcut in package.json hinzufügen**

`package.json` → `scripts` Abschnitt erweitern:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "import:awin": "tsx scripts/import-awin.ts",
    "import:adcell": "tsx scripts/import-adcell.ts",
    "score": "tsx scripts/score-deals.ts",
    "generate:copy": "tsx scripts/generate-copy.ts",
    "render:slides": "tsx scripts/render-slides.ts"
  }
}
```

- [ ] **Step 4: Test-Lauf mit Sample-CSV**

Erstelle eine Test-CSV `scripts/test-data/awin-sample.csv`:

```csv
aw_product_id,product_name,brand_name,merchant_name,store_price,rrp_price,aw_deep_link,merchant_image_url,large_image,merchant_product_url,stock_quantity,valid_to
TEST001,More Creatine+ Gummies Green Apple,More Nutrition,More Nutrition Shop,14.99,19.99,https://www.awin1.com/cread.php?awinmid=TEST,https://example.com/img1.jpg,https://example.com/img1.jpg,https://more-nutrition.de/product/creatine-gummies,50,2026-12-31
TEST002,ESN Designer Whey Protein Vanilla,ESN,ESN Shop,24.99,34.99,https://www.awin1.com/cread.php?awinmid=TEST2,https://example.com/img2.jpg,https://example.com/img2.jpg,https://esn.com/product/designer-whey,120,2026-12-31
```

Test mit lokaler CSV-Datei:

`scripts/import-awin.ts` temporär anpassen (nur für Test):

```typescript
// Statt fetch: lokale Datei lesen
import { readFileSync } from 'fs'
const csvText = readFileSync('./scripts/test-data/awin-sample.csv', 'utf-8')
```

```bash
AWIN_FEED_URL=local npm run import:awin
```

Expected output:
```
Parsed 2 rows from Awin feed
Valid deals: 2
New deals (not in DB): 2
Inserted batch 1 (2 deals)
Import complete: 2 new deals added
```

- [ ] **Step 5: In Supabase prüfen**

Supabase Dashboard → Table Editor → `deals`: 2 Zeilen mit status='new' sollen sichtbar sein.

---

### Task 6: ADCELL Feed Importer

**Files:**
- Create: `scripts/import-adcell.ts`

- [ ] **Step 1: ADCELL Importer schreiben**

`scripts/import-adcell.ts`:

```typescript
import 'dotenv/config'
import Papa from 'papaparse'
import { createServiceClient } from '../src/lib/supabase/server'
import { normalizeRawDeal } from './lib/normalizer'
import { filterNewDeals, deduplicateWithinBatch } from './lib/deduplicator'
import type { RawFeedDeal } from '../src/types'

// ADCELL CSV-Format (typische Spalten)
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

  const provision = row['Commission'] ? parseFloat(row['Commission'].replace('%', '').replace(',', '.')) : undefined

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

  const response = await fetch(feedUrl)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const csvText = await response.text()

  const { data, errors } = Papa.parse<AdcellRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';', // ADCELL oft Semikolon-getrennt
  })

  console.log(`Parsed ${data.length} rows from ADCELL feed`)

  const rawDeals: RawFeedDeal[] = data
    .map(parseAdcellRow)
    .filter((d): d is RawFeedDeal => d !== null)

  const uniqueDeals = deduplicateWithinBatch(rawDeals)
  const newDeals = await filterNewDeals(uniqueDeals)

  console.log(`New deals: ${newDeals.length}`)
  if (newDeals.length === 0) return

  const normalizedDeals = newDeals.map(normalizeRawDeal)
  const supabase = createServiceClient()

  for (let i = 0; i < normalizedDeals.length; i += 100) {
    const batch = normalizedDeals.slice(i, i + 100)
    const { error } = await supabase.from('deals').insert(batch)
    if (error) console.error(`Batch error:`, error.message)
    else console.log(`Inserted ${batch.length} deals`)
  }
}

const feedUrl = process.env.ADCELL_FEED_URL
if (!feedUrl) {
  console.error('ADCELL_FEED_URL not set')
  process.exit(1)
}

importAdcellFeed(feedUrl).catch(console.error)
```

- [ ] **Step 2: Type-Check**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

---

### Task 7: Expired Deals aufräumen

**Files:**
- Create: `scripts/cleanup-expired.ts`

- [ ] **Step 1: Cleanup-Script**

`scripts/cleanup-expired.ts`:

```typescript
import 'dotenv/config'
import { createServiceClient } from '../src/lib/supabase/server'

async function cleanupExpiredDeals() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('deals')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .not('status', 'eq', 'expired')
    .select('id')

  if (error) {
    console.error('Cleanup error:', error.message)
    return
  }

  console.log(`Marked ${data?.length ?? 0} deals as expired`)
}

cleanupExpiredDeals().catch(console.error)
```

- [ ] **Step 2: package.json Scripts erweitern**

```json
"cleanup": "tsx scripts/cleanup-expired.ts"
```

- [ ] **Step 3: Manueller Test**

```bash
npm run cleanup
```

Expected: `Marked 0 deals as expired` (da noch keine expired_at Werte gesetzt)

---

### Task 8: Produktbilder in Supabase Storage cachen

**Warum:** Affiliate-Feed-Bild-URLs laufen ab. Für den manuellen GPT-Workflow brauchen wir eine permanente, immer verfügbare URL die der User jederzeit herunterladen kann.

**Files:**
- Create: `scripts/lib/image-cache.ts`
- Modify: `scripts/import-awin.ts`, `scripts/import-adcell.ts`

- [ ] **Step 1: Image-Cache-Funktion schreiben**

`scripts/lib/image-cache.ts`:

```typescript
import { createServiceClient } from '../../src/lib/supabase/server'

export async function cacheProductImage(
  imageUrl: string,
  dealId: string
): Promise<string | null> {
  if (!imageUrl) return null

  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

    const buffer = Buffer.from(await response.arrayBuffer())

    // Mindestgröße prüfen: schlechte/placeholder Bilder verwerfen
    if (buffer.byteLength < 5000) return null

    const supabase = createServiceClient()
    const storagePath = `products/${dealId}/product.${ext}`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.warn(`Image cache upload failed for ${dealId}: ${error.message}`)
      return null
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    return data.publicUrl
  } catch (err) {
    console.warn(`Image cache failed for ${dealId}:`, err)
    return null
  }
}
```

- [ ] **Step 2: Import-Scripts anpassen — Bild nach dem Insert cachen**

In `scripts/import-awin.ts` (und identisch in `import-adcell.ts`), nach dem Insert-Loop einfügen:

```typescript
import { cacheProductImage } from './lib/image-cache'

// Nach dem erfolgreichen Insert: Bilder cachen
// (Wir lesen die frisch-inserierten Deals zurück um die IDs zu haben)
const { data: inserted } = await supabase
  .from('deals')
  .select('id, produktbild_url, external_id, quelle')
  .eq('quelle', 'awin')
  .in('external_id', newDeals.map(d => d.external_id))

for (const deal of inserted ?? []) {
  if (!deal.produktbild_url) continue

  console.log(`  Caching image for ${deal.id}...`)
  const cachedUrl = await cacheProductImage(deal.produktbild_url as string, deal.id as string)

  if (cachedUrl) {
    await supabase
      .from('deals')
      .update({ produktbild_url: cachedUrl })
      .eq('id', deal.id)
  }
}
```

- [ ] **Step 3: Test — Bild-Cache prüfen**

```bash
npm run import:awin
```

Expected: Nach dem Import soll in Supabase Storage → `assets/products/[deal_id]/product.jpg` ein Bild liegen.

In Supabase Dashboard → Storage → assets → products: Bilder müssen sichtbar sein.

- [ ] **Step 4: Bild-URL in DB prüfen**

```sql
SELECT id, produktbild_url FROM deals WHERE produktbild_url LIKE '%supabase%' LIMIT 5;
```

Expected: URLs zeigen auf `*.supabase.co/storage/...` (nicht mehr auf externe Feed-URLs).

---

**Plan abgeschlossen wenn:**
- Supabase hat alle 5 Tabellen (prüfen im Dashboard)
- `npm run import:awin` läuft ohne Fehler
- `npm run import:adcell` läuft ohne Fehler
- `npm run cleanup` läuft ohne Fehler
- Produktbilder liegen in Supabase Storage (`assets/products/`)
- `deals.produktbild_url` zeigt auf Supabase-URLs
- `npx tsc --noEmit` gibt 0 Fehler
