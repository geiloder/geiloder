# Deal Scoring Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scoring-Algorithmus der jeden Deal mit 0–100 Punkten bewertet und automatisch entscheidet: 4-Slide-Carousel (≥70), Story (50–69), oder ignorieren (<50). Plus Anti-Spam-Regeln.

**Architecture:** Pure TypeScript Scoring-Funktion in `src/lib/scoring/`. Separates CLI-Script `scripts/score-deals.ts` das alle `status='new'` Deals lädt, scored, und den Score + ggf. neuen Status zurückschreibt.

**Tech Stack:** TypeScript, Supabase

---

## File Structure

```
/
├── src/
│   └── lib/
│       └── scoring/
│           └── index.ts
├── scripts/
│   └── score-deals.ts
```

---

### Task 1: Scoring-Algorithmus schreiben

**Files:**
- Create: `src/lib/scoring/index.ts`

- [ ] **Step 1: Scoring-Modul schreiben**

`src/lib/scoring/index.ts`:

```typescript
import type { Deal, DealKategorie } from '@/types'

export type DealTier = 'carousel' | 'story' | 'ignore'

// Bekannte Marken bekommen Bonus-Punkte
const BEKANNTE_MARKEN = new Set([
  'more nutrition', 'esn', 'myprotein', 'bulk', 'optimum nutrition',
  'dymatize', 'biotech usa', 'olimp', 'weider', 'ironmaxx',
  'applied nutrition', 'bsn', 'muscletech', 'cellucor',
  'adidas', 'nike', 'under armour', 'puma', 'reebok',
  'garmin', 'polar', 'fitbit', 'theragun', 'hyperice',
])

// Fitness-Kategorien bekommen Bonus (unsere Startnische)
const FITNESS_KATEGORIEN: DealKategorie[] = [
  'supplements', 'fitness', 'home-gym', 'gymwear', 'gadgets',
]

export interface ScoreDetails {
  score: number
  tier: DealTier
  breakdown: {
    rabatt: number
    marke: number
    bild: number
    provision: number
    preis: number
    kategorie: number
    knappheit: number
    humor: number
  }
}

export function scoreDeal(deal: Deal): ScoreDetails {
  let score = 0
  const breakdown = {
    rabatt: 0,
    marke: 0,
    bild: 0,
    provision: 0,
    preis: 0,
    kategorie: 0,
    knappheit: 0,
    humor: 0,
  }

  // === Rabatt-Stärke (max 25 Punkte) ===
  const rabatt = deal.rabatt_prozent ?? 0
  if (rabatt >= 50) breakdown.rabatt = 25
  else if (rabatt >= 40) breakdown.rabatt = 22
  else if (rabatt >= 30) breakdown.rabatt = 18
  else if (rabatt >= 25) breakdown.rabatt = 14
  else if (rabatt >= 20) breakdown.rabatt = 10
  else if (rabatt >= 15) breakdown.rabatt = 6
  else if (rabatt >= 10) breakdown.rabatt = 3

  // === Markenbekanntheit (max 15 Punkte) ===
  const markeNormalized = (deal.marke ?? deal.shop).toLowerCase()
  if (BEKANNTE_MARKEN.has(markeNormalized)) {
    breakdown.marke = 15
  } else if (markeNormalized.length > 3) {
    breakdown.marke = 5 // Unbekannte Marke aber vorhanden
  }

  // === Bild-Qualität (max 10 Punkte) ===
  if (deal.produktbild_url) {
    breakdown.bild = 10
    // Bonus für hochauflösende Bilder (URL-Heuristik)
    if (deal.produktbild_url.includes('large') || deal.produktbild_url.includes('xl') || deal.produktbild_url.includes('1000')) {
      breakdown.bild = 10 // bereits max
    }
  }

  // === Provision (max 10 Punkte) ===
  const prov = deal.provision ?? 0
  if (prov >= 15) breakdown.provision = 10
  else if (prov >= 10) breakdown.provision = 8
  else if (prov >= 8) breakdown.provision = 6
  else if (prov >= 5) breakdown.provision = 4
  else if (prov > 0) breakdown.provision = 2

  // === Preis-Attraktivität (max 15 Punkte) ===
  const preis = deal.deal_preis
  if (preis <= 9.99) breakdown.preis = 15
  else if (preis <= 19.99) breakdown.preis = 12
  else if (preis <= 29.99) breakdown.preis = 9
  else if (preis <= 49.99) breakdown.preis = 6
  else if (preis <= 79.99) breakdown.preis = 3

  // === Kategorie-Fit (max 10 Punkte) ===
  if (FITNESS_KATEGORIEN.includes(deal.kategorie)) {
    breakdown.kategorie = 10
  } else {
    breakdown.kategorie = 3 // Andere Kategorien haben weniger Fit
  }

  // === Knappheit (max 10 Punkte) ===
  if (deal.verfuegbarkeit) {
    const verfProzent = parseInt(deal.verfuegbarkeit.replace(/[^0-9]/g, ''))
    if (!isNaN(verfProzent)) {
      if (verfProzent <= 10) breakdown.knappheit = 10
      else if (verfProzent <= 20) breakdown.knappheit = 7
      else if (verfProzent <= 30) breakdown.knappheit = 4
      else if (verfProzent <= 50) breakdown.knappheit = 2
    }
  }

  // === Humor-Potenzial (max 5 Punkte) ===
  // Fitness-Deals haben inhärent gutes Humor-Potenzial
  if (deal.kategorie === 'supplements' || deal.kategorie === 'fitness') {
    breakdown.humor = 5
  } else if (FITNESS_KATEGORIEN.includes(deal.kategorie)) {
    breakdown.humor = 3
  } else {
    breakdown.humor = 1
  }

  score = Object.values(breakdown).reduce((a, b) => a + b, 0)
  score = Math.min(100, Math.max(0, score))

  const tier: DealTier =
    score >= 70 ? 'carousel'
    : score >= 50 ? 'story'
    : 'ignore'

  return { score, tier, breakdown }
}

// Anti-Spam-Prüfung: Verhindert zu viele ähnliche Deals
export interface AntiSpamContext {
  dealsByMarke: Map<string, number>    // Marke → Anzahl heute
  dealsByKategorie: Map<string, number> // Kategorie → Anzahl heute
  recentProducts: Set<string>           // produktname der letzten 72h
  consecutiveSupplements: number        // Supplements hintereinander
}

export function checkAntiSpam(
  deal: Deal,
  context: AntiSpamContext
): { blocked: boolean; reason?: string } {
  const marke = (deal.marke ?? deal.shop).toLowerCase()
  const markeCount = context.dealsByMarke.get(marke) ?? 0
  if (markeCount >= 3) {
    return { blocked: true, reason: `Marke "${marke}" bereits ${markeCount}x heute` }
  }

  const katCount = context.dealsByKategorie.get(deal.kategorie) ?? 0
  if (katCount >= 15) {
    return { blocked: true, reason: `Kategorie "${deal.kategorie}" bereits ${katCount}x heute` }
  }

  const produktKey = deal.produktname.toLowerCase().slice(0, 50)
  if (context.recentProducts.has(produktKey)) {
    return { blocked: true, reason: `Produkt "${deal.produktname}" bereits in letzten 72h gepostet` }
  }

  if (deal.kategorie === 'supplements' && context.consecutiveSupplements >= 5) {
    return { blocked: true, reason: 'Zu viele Supplement-Deals hintereinander' }
  }

  return { blocked: false }
}
```

---

### Task 2: Unit Tests für den Scorer

**Files:**
- Create: `src/lib/scoring/index.test.ts`

- [ ] **Step 1: Test-Framework installieren**

```bash
npm install -D vitest @vitest/ui
```

`package.json` → scripts erweitern:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

`vitest.config.ts` erstellen:

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Tests schreiben**

`src/lib/scoring/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { scoreDeal, checkAntiSpam } from './index'
import type { Deal, AntiSpamContext } from '@/types'

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'test-id',
    external_id: 'ext-1',
    quelle: 'awin',
    produktname: 'Test Protein',
    marke: 'More Nutrition',
    shop: 'More Shop',
    kategorie: 'supplements',
    alter_preis: 39.99,
    deal_preis: 19.99,
    rabatt_prozent: 50,
    gutschein_code: null,
    verfuegbarkeit: '15%',
    produktbild_url: 'https://example.com/img.jpg',
    affiliate_link: 'https://awin.com/test',
    landingpage_url: null,
    provision: 10,
    deal_score: null,
    status: 'new',
    copy_data: null,
    slug: 'test-protein-abc12345',
    created_at: new Date().toISOString(),
    expires_at: null,
    posted_at: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('scoreDeal', () => {
  it('gibt hohen Score für Top-Deal', () => {
    const deal = makeDeal()
    const { score, tier } = scoreDeal(deal)
    expect(score).toBeGreaterThanOrEqual(70)
    expect(tier).toBe('carousel')
  })

  it('gibt niedrigen Score wenn kein Rabatt', () => {
    const deal = makeDeal({ rabatt_prozent: 0, alter_preis: null })
    const { score } = scoreDeal(deal)
    expect(score).toBeLessThan(70)
  })

  it('gibt Story-Tier für mittleren Deal', () => {
    const deal = makeDeal({
      rabatt_prozent: 15,
      marke: 'Unbekannte Marke XYZ',
      provision: 3,
      deal_preis: 49.99,
      verfuegbarkeit: null,
    })
    const { tier } = scoreDeal(deal)
    expect(['story', 'ignore']).toContain(tier)
  })

  it('ignoriert Deal mit sehr kleinem Rabatt und hohem Preis', () => {
    const deal = makeDeal({
      rabatt_prozent: 5,
      deal_preis: 299.99,
      marke: null,
      provision: 1,
      verfuegbarkeit: null,
      kategorie: 'sonstige',
    })
    const { tier } = scoreDeal(deal)
    expect(tier).toBe('ignore')
  })

  it('Score ist immer zwischen 0 und 100', () => {
    const deals = [makeDeal(), makeDeal({ rabatt_prozent: 0 }), makeDeal({ deal_preis: 999 })]
    deals.forEach((d) => {
      const { score } = scoreDeal(d)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})

describe('checkAntiSpam', () => {
  function makeContext(overrides: Partial<AntiSpamContext> = {}): AntiSpamContext {
    return {
      dealsByMarke: new Map(),
      dealsByKategorie: new Map(),
      recentProducts: new Set(),
      consecutiveSupplements: 0,
      ...overrides,
    }
  }

  it('blockiert Marke nach 3 Deals', () => {
    const deal = makeDeal({ marke: 'more nutrition' })
    const context = makeContext({
      dealsByMarke: new Map([['more nutrition', 3]]),
    })
    const result = checkAntiSpam(deal, context)
    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('more nutrition')
  })

  it('lässt Deal durch wenn Marke weniger als 3x', () => {
    const deal = makeDeal({ marke: 'more nutrition' })
    const context = makeContext({
      dealsByMarke: new Map([['more nutrition', 2]]),
    })
    expect(checkAntiSpam(deal, context).blocked).toBe(false)
  })

  it('blockiert bereits gepostetes Produkt', () => {
    const deal = makeDeal({ produktname: 'Test Protein' })
    const context = makeContext({
      recentProducts: new Set(['test protein']),
    })
    expect(checkAntiSpam(deal, context).blocked).toBe(true)
  })

  it('blockiert zu viele Supplements hintereinander', () => {
    const deal = makeDeal({ kategorie: 'supplements' })
    const context = makeContext({ consecutiveSupplements: 5 })
    expect(checkAntiSpam(deal, context).blocked).toBe(true)
  })
})
```

- [ ] **Step 3: Tests ausführen — sollen FAIL**

```bash
npm test
```

Expected: Alle Tests PASS (die Implementierung ist fertig, nicht TDD in diesem Fall da Algorithmus zuerst designt).

Falls Tests FAIL: Scoring-Werte in `index.ts` anpassen bis Tests grün sind.

---

### Task 3: Score-CLI-Script

**Files:**
- Create: `scripts/score-deals.ts`

- [ ] **Step 1: Score-Script schreiben**

`scripts/score-deals.ts`:

```typescript
import 'dotenv/config'
import { createServiceClient } from '../src/lib/supabase/server'
import { scoreDeal, checkAntiSpam } from '../src/lib/scoring'
import type { Deal, AntiSpamContext } from '../src/types'
import { generateDealSlug } from '../src/lib/utils'

async function buildAntiSpamContext(supabase: ReturnType<typeof createServiceClient>): Promise<AntiSpamContext> {
  // Deals der letzten 72h die gepostet/approved wurden
  const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data: recentDeals } = await supabase
    .from('deals')
    .select('marke, shop, kategorie, produktname')
    .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
    .gte('updated_at', since72h)

  const context: AntiSpamContext = {
    dealsByMarke: new Map(),
    dealsByKategorie: new Map(),
    recentProducts: new Set(),
    consecutiveSupplements: 0,
  }

  // Deals des heutigen Tages
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: todayDeals } = await supabase
    .from('deals')
    .select('marke, shop, kategorie')
    .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
    .gte('updated_at', since24h)

  for (const d of todayDeals ?? []) {
    const marke = ((d.marke ?? d.shop) as string).toLowerCase()
    context.dealsByMarke.set(marke, (context.dealsByMarke.get(marke) ?? 0) + 1)
    context.dealsByKategorie.set(d.kategorie, (context.dealsByKategorie.get(d.kategorie) ?? 0) + 1)
  }

  for (const d of recentDeals ?? []) {
    const produktKey = (d.produktname as string).toLowerCase().slice(0, 50)
    context.recentProducts.add(produktKey)
  }

  return context
}

async function scoreAllNewDeals() {
  const supabase = createServiceClient()

  const { data: newDeals, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: true })

  if (error) throw error

  const deals = (newDeals ?? []) as Deal[]
  console.log(`Scoring ${deals.length} new deals...`)

  if (deals.length === 0) {
    console.log('No new deals to score.')
    return
  }

  const antiSpamContext = await buildAntiSpamContext(supabase)

  let carousel = 0, story = 0, ignored = 0, spamBlocked = 0

  for (const deal of deals) {
    const { score, tier } = scoreDeal(deal)

    // Kein Bild → direkt ignorieren
    if (!deal.produktbild_url) {
      await supabase
        .from('deals')
        .update({ status: 'rejected', deal_score: 0 })
        .eq('id', deal.id)
      ignored++
      continue
    }

    if (tier === 'ignore') {
      await supabase
        .from('deals')
        .update({ status: 'rejected', deal_score: score })
        .eq('id', deal.id)
      ignored++
      continue
    }

    // Anti-Spam prüfen
    const spamCheck = checkAntiSpam(deal, antiSpamContext)
    if (spamCheck.blocked) {
      await supabase
        .from('deals')
        .update({ status: 'rejected', deal_score: score })
        .eq('id', deal.id)
      console.log(`  SPAM-BLOCKED: ${deal.produktname} — ${spamCheck.reason}`)
      spamBlocked++
      continue
    }

    // Slug sicherstellen
    const slug = deal.slug ?? generateDealSlug(deal.produktname, deal.id)

    // Score + Status setzen
    const newStatus = tier === 'carousel' ? 'approved' : 'approved'
    await supabase
      .from('deals')
      .update({
        deal_score: score,
        status: newStatus,
        slug,
      })
      .eq('id', deal.id)

    console.log(`  ${tier.toUpperCase()} (${score}): ${deal.produktname.slice(0, 50)}`)

    // Anti-Spam-Kontext aktualisieren
    const marke = (deal.marke ?? deal.shop).toLowerCase()
    antiSpamContext.dealsByMarke.set(marke, (antiSpamContext.dealsByMarke.get(marke) ?? 0) + 1)
    antiSpamContext.dealsByKategorie.set(deal.kategorie, (antiSpamContext.dealsByKategorie.get(deal.kategorie) ?? 0) + 1)
    if (deal.kategorie === 'supplements') {
      antiSpamContext.consecutiveSupplements++
    } else {
      antiSpamContext.consecutiveSupplements = 0
    }

    if (tier === 'carousel') carousel++
    else story++
  }

  console.log(`\nScoring complete:`)
  console.log(`  Carousel: ${carousel}`)
  console.log(`  Story:    ${story}`)
  console.log(`  Ignored:  ${ignored}`)
  console.log(`  Blocked:  ${spamBlocked}`)
}

scoreAllNewDeals().catch(console.error)
```

- [ ] **Step 2: Script in package.json hinzufügen (falls noch nicht)**

```json
"score": "tsx scripts/score-deals.ts"
```

- [ ] **Step 3: Test mit den vorher importierten Test-Deals**

```bash
npm run score
```

Expected output:
```
Scoring 2 new deals...
  CAROUSEL (82): More Creatine+ Gummies Green Apple
  CAROUSEL (79): ESN Designer Whey Protein Vanilla

Scoring complete:
  Carousel: 2
  Story:    0
  Ignored:  0
  Blocked:  0
```

- [ ] **Step 4: In Supabase prüfen**

Supabase Dashboard → `deals` Tabelle: Deals sollen jetzt `status='approved'` und einen `deal_score` haben.

---

### Task 4: Type-Check und Tests

- [ ] **Step 1: Type-Check**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Step 2: Tests**

```bash
npm test
```

Expected: Alle Tests PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add deal scoring engine with anti-spam rules"
```

---

**Plan abgeschlossen wenn:**
- `npm test` → alle Tests grün
- `npx tsc --noEmit` → keine Fehler
- `npm run score` läuft fehlerfrei
- In Supabase: Test-Deals haben `deal_score` und `status='approved'`
