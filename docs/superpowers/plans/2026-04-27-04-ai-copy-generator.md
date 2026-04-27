# AI Copy Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gemini 1.5 Flash API generiert für jeden approbierten Deal automatisch deutschen Copy-Text für alle 4 Slides + Caption + Hashtags. Compliance-Filter verhindert gesundheitliche Claims. Output wird als `copy_data` JSONB in Supabase gespeichert.

**Architecture:** `@google/generative-ai` SDK. Ein strukturierter Prompt gibt JSON zurück. Schema-Validierung mit `zod`. Compliance-Filter läuft NACH der KI-Generierung. Rate-Limiting: Gemini Flash kostenlos = 15 req/min → Script wartet 4s zwischen Calls.

**Tech Stack:** @google/generative-ai, zod, TypeScript

---

## File Structure

```
/
├── src/
│   └── lib/
│       └── gemini/
│           ├── client.ts
│           ├── prompts.ts
│           └── compliance.ts
├── scripts/
│   └── generate-copy.ts
```

---

### Task 1: Gemini Client einrichten

**Files:**
- Create: `src/lib/gemini/client.ts`

- [ ] **Step 1: Zod installieren**

```bash
npm install zod
```

- [ ] **Step 2: Gemini Client**

`src/lib/gemini/client.ts`:

```typescript
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.8,
    topP: 0.95,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
})

export async function generateWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiFlash.generateContent(prompt)
      const text = result.response.text()
      if (!text) throw new Error('Empty response from Gemini')
      return text
    } catch (error) {
      if (attempt === maxRetries) throw error
      console.warn(`Gemini attempt ${attempt} failed, retrying in 5s...`)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
  throw new Error('Gemini: max retries exceeded')
}
```

---

### Task 2: Prompts schreiben

**Files:**
- Create: `src/lib/gemini/prompts.ts`

- [ ] **Step 1: Haupt-Prompt für Deal-Copy**

`src/lib/gemini/prompts.ts`:

```typescript
import type { Deal } from '@/types'

export function buildDealCopyPrompt(deal: Deal): string {
  const rabattText = deal.rabatt_prozent
    ? `-${Math.round(deal.rabatt_prozent)}%`
    : 'Sonderpreis'

  const alterPreisText = deal.alter_preis
    ? `Alter Preis: ${deal.alter_preis.toFixed(2).replace('.', ',')} €`
    : ''

  const gutscheinText = deal.gutschein_code
    ? `Gutschein-Code: ${deal.gutschein_code}`
    : ''

  const knappheitText = deal.verfuegbarkeit
    ? `Verfügbarkeit: ${deal.verfuegbarkeit}`
    : ''

  return `Du bist Texter für die deutsche Deal-Media-Brand "Geil oder?".
Die Marke ist frech, humorvoll, direkt. Zielgruppe: 18-35 Jahre, Fitness-affin, preisbewusst.

Erstelle Copy für diesen Deal. Antworte NUR mit validem JSON ohne Markdown-Code-Blöcke.

DEAL-DATEN:
- Produktname: ${deal.produktname}
- Marke: ${deal.marke ?? deal.shop}
- Shop: ${deal.shop}
- Deal-Preis: ${deal.deal_preis.toFixed(2).replace('.', ',')} €
${alterPreisText}
- Rabatt: ${rabattText}
${gutscheinText}
${knappheitText}
- Kategorie: ${deal.kategorie}

WICHTIGE REGELN:
1. Kein Komma-Fehler: Preise NIEMALS neu erfinden, immer aus den Deal-Daten übernehmen
2. Keine Gesundheits-Claims: Schreib NICHT "macht dich stärker", "verbrennt Fett", "heilt", "wirkt garantiert"
3. Schreib Fakten: "enthält X g Protein", "25% Rabatt", "ohne Zucker"
4. Deutsch, direkt, kein "Sie"
5. Humor muss offensichtlich übertrieben sein — harmlos, nicht beleidigend

HUMOR-FORMELN (für Slide 4, verwende eine davon):
- "Wenn du den Deal verpasst, [nervige Standardlösung zurück]"
- "Deal verpasst = [Folge 1] + [Folge 2] + [Folge 3]"
- "POV: Du hast den Deal verpasst und [lustige Situation]"

Erstelle folgendes JSON-Objekt:

{
  "headline": "Slide 1: Produktname in CAPS, max 30 Zeichen",
  "subheadline": "Slide 1: Variante/Detail, max 20 Zeichen",
  "benefit_1": "Slide 2: Benefit-Titel, max 20 Zeichen, FAKTEN aus Produktname",
  "benefit_1_detail": "Slide 2: Erklärung, max 25 Zeichen",
  "benefit_2": "Slide 2: Zweiter Benefit-Titel",
  "benefit_2_detail": "Slide 2: Erklärung",
  "benefit_3": "Slide 2: Dritter Benefit-Titel",
  "benefit_3_detail": "Slide 2: Erklärung",
  "cta": "Slide 3: Call-to-Action, max 25 Zeichen, z.B. JETZT DEAL SICHERN",
  "caption": "Instagram Caption: 2-3 Sätze, enthält Produktname, Rabatt, Deal-Hinweis, Affiliate-Pflichttext am Ende: 'Anzeige | Affiliate-Link. Preis kann sich ändern. Angaben ohne Gewähr.'",
  "hashtags": ["array", "von", "deutschen", "hashtags", "max", "15", "stück"],
  "humor_intro": "Slide 4: Einleitungssatz, z.B. 'WENN DU DEN DEAL VERPASST ...'",
  "humor_konsequenz_1": "Slide 4: Erste lustige Konsequenz, max 35 Zeichen",
  "humor_konsequenz_2": "Slide 4: Zweite lustige Konsequenz, max 35 Zeichen",
  "humor_konsequenz_3": "Slide 4: Dritte lustige Konsequenz, max 35 Zeichen",
  "humor_cta": "Slide 4: Abschluss-CTA, max 30 Zeichen, z.B. 'SEI SCHLAUER. DEAL SICHERN!'"
}`
}

export function buildHumorOnlyPrompt(deal: Deal): string {
  return `Erstelle 3 witzige Konsequenzen für einen deutschen Fitness-Deal-Post. 
Produkt: ${deal.produktname}
Kategorie: ${deal.kategorie}

Regeln: Offensichtlich übertrieben, harmlos, auf das Produkt bezogen, KEIN Deutsch-Fehler, max 35 Zeichen pro Konsequenz.

Antworte NUR mit JSON:
{
  "humor_konsequenz_1": "...",
  "humor_konsequenz_2": "...",
  "humor_konsequenz_3": "..."
}`
}
```

---

### Task 3: Compliance-Filter

**Files:**
- Create: `src/lib/gemini/compliance.ts`

- [ ] **Step 1: Compliance-Filter schreiben**

`src/lib/gemini/compliance.ts`:

```typescript
import type { DealCopy } from '@/types'

// Verbotene Phrases (gesundheitliche Claims, irreführend)
const VERBOTENE_PHRASES = [
  'macht dich stärker',
  'verbrennt fett',
  'baut muskeln auf',
  'garantiert erfolg',
  'klinisch bewiesen',
  'wissenschaftlich bewiesen',
  'heilt',
  'kuriert',
  'therapie',
  'medizinisch',
  'ohne training',
  'ohne sport',
  'abnehmen garantiert',
  'schlanker',
  'gewicht verlieren garantiert',
  'wirkt sofort',
  'wundermittel',
  '100% wirksam',
  'bmi senken',
  'blutdruck',
  'cholesterin',
  'diabetes',
  'heilmittel',
]

export interface ComplianceResult {
  passed: boolean
  violations: string[]
  sanitized: DealCopy
}

function sanitizeText(text: string): string {
  let result = text
  for (const phrase of VERBOTENE_PHRASES) {
    const regex = new RegExp(phrase, 'gi')
    if (regex.test(result)) {
      result = result.replace(regex, '[...]')
    }
  }
  return result
}

export function checkCompliance(copy: DealCopy): ComplianceResult {
  const violations: string[] = []
  const allTexts = [
    copy.headline,
    copy.subheadline,
    copy.benefit_1,
    copy.benefit_1_detail,
    copy.benefit_2,
    copy.benefit_2_detail,
    copy.benefit_3,
    copy.benefit_3_detail,
    copy.cta,
    copy.caption,
    copy.humor_intro,
    copy.humor_konsequenz_1,
    copy.humor_konsequenz_2,
    copy.humor_konsequenz_3,
    copy.humor_cta,
    ...copy.hashtags,
  ].join(' ').toLowerCase()

  for (const phrase of VERBOTENE_PHRASES) {
    if (allTexts.includes(phrase.toLowerCase())) {
      violations.push(phrase)
    }
  }

  const sanitized: DealCopy = {
    ...copy,
    benefit_1_detail: sanitizeText(copy.benefit_1_detail),
    benefit_2_detail: sanitizeText(copy.benefit_2_detail),
    benefit_3_detail: sanitizeText(copy.benefit_3_detail),
    caption: sanitizeText(copy.caption),
    humor_konsequenz_1: sanitizeText(copy.humor_konsequenz_1),
    humor_konsequenz_2: sanitizeText(copy.humor_konsequenz_2),
    humor_konsequenz_3: sanitizeText(copy.humor_konsequenz_3),
  }

  return {
    passed: violations.length === 0,
    violations,
    sanitized,
  }
}

// Affiliate-Pflichttext sicherstellen
export function ensureAffiliateDisclosure(caption: string): string {
  const requiredText = 'Anzeige | Affiliate-Link'
  if (!caption.includes(requiredText)) {
    return `${requiredText}\n\n${caption}`
  }
  return caption
}
```

---

### Task 4: Zod Schema Validierung

**Files:**
- Create: `src/lib/gemini/schema.ts`

- [ ] **Step 1: Output-Schema**

`src/lib/gemini/schema.ts`:

```typescript
import { z } from 'zod'

export const DealCopySchema = z.object({
  headline: z.string().max(50),
  subheadline: z.string().max(30),
  benefit_1: z.string().max(30),
  benefit_1_detail: z.string().max(40),
  benefit_2: z.string().max(30),
  benefit_2_detail: z.string().max(40),
  benefit_3: z.string().max(30),
  benefit_3_detail: z.string().max(40),
  cta: z.string().max(30),
  caption: z.string().min(50).max(600),
  hashtags: z.array(z.string().startsWith('#')).min(3).max(15),
  humor_intro: z.string().max(50),
  humor_konsequenz_1: z.string().max(50),
  humor_konsequenz_2: z.string().max(50),
  humor_konsequenz_3: z.string().max(50),
  humor_cta: z.string().max(40),
})

export type DealCopyOutput = z.infer<typeof DealCopySchema>

export function parseDealCopyResponse(jsonText: string): DealCopyOutput {
  let parsed: unknown
  try {
    // Manchmal gibt Gemini ```json ... ``` zurück trotz Anweisung
    const cleaned = jsonText.replace(/^```json\n?|\n?```$/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`JSON parse error: ${jsonText.slice(0, 200)}`)
  }

  return DealCopySchema.parse(parsed)
}
```

---

### Task 5: Generate-Copy Script

**Files:**
- Create: `scripts/generate-copy.ts`

- [ ] **Step 1: Script schreiben**

`scripts/generate-copy.ts`:

```typescript
import 'dotenv/config'
import { createServiceClient } from '../src/lib/supabase/server'
import { generateWithRetry } from '../src/lib/gemini/client'
import { buildDealCopyPrompt } from '../src/lib/gemini/prompts'
import { parseDealCopyResponse } from '../src/lib/gemini/schema'
import { checkCompliance, ensureAffiliateDisclosure } from '../src/lib/gemini/compliance'
import type { Deal, DealCopy } from '../src/types'

const DELAY_MS = 4200 // Gemini Flash: 15 req/min → ~4s Abstand

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function generateCopyForDeal(deal: Deal): Promise<DealCopy | null> {
  const prompt = buildDealCopyPrompt(deal)

  try {
    const rawResponse = await generateWithRetry(prompt)
    const parsed = parseDealCopyResponse(rawResponse)

    // Hashtags normalisieren (# voranstellen falls fehlend)
    const hashtags = parsed.hashtags.map((h) =>
      h.startsWith('#') ? h : `#${h}`
    )

    // Affiliate-Disclosure sicherstellen
    const caption = ensureAffiliateDisclosure(parsed.caption)

    const copy: DealCopy = { ...parsed, hashtags, caption }

    // Compliance check
    const { passed, violations, sanitized } = checkCompliance(copy)
    if (!passed) {
      console.warn(`  Compliance violations for "${deal.produktname}": ${violations.join(', ')}`)
      return sanitized
    }

    return copy
  } catch (error) {
    console.error(`  Error generating copy for "${deal.produktname}":`, error)
    return null
  }
}

async function generateCopyForAllApproved() {
  const supabase = createServiceClient()

  // Alle approved Deals ohne Copy
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'approved')
    .is('copy_data', null)
    .order('deal_score', { ascending: false })
    .limit(50) // Max 50 pro Run (Gemini Rate-Limit)

  if (error) throw error

  const deals = (data ?? []) as Deal[]
  console.log(`Generating copy for ${deals.length} deals...`)

  if (deals.length === 0) {
    console.log('No deals need copy generation.')
    return
  }

  let success = 0
  let failed = 0

  for (const deal of deals) {
    console.log(`  Processing: ${deal.produktname.slice(0, 50)}...`)

    const copy = await generateCopyForDeal(deal)

    if (copy) {
      const { error: updateError } = await supabase
        .from('deals')
        .update({ copy_data: copy })
        .eq('id', deal.id)

      if (updateError) {
        console.error(`  DB update error: ${updateError.message}`)
        failed++
      } else {
        success++
      }
    } else {
      failed++
    }

    // Rate-Limiting: 4s Pause zwischen Gemini-Calls
    if (deals.indexOf(deal) < deals.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`\nCopy generation complete:`)
  console.log(`  Success: ${success}`)
  console.log(`  Failed:  ${failed}`)
}

generateCopyForAllApproved().catch(console.error)
```

- [ ] **Step 2: package.json Script**

```json
"generate:copy": "tsx scripts/generate-copy.ts"
```

- [ ] **Step 3: Test — Copy für Test-Deals generieren**

```bash
npm run generate:copy
```

Expected output:
```
Generating copy for 2 deals...
  Processing: More Creatine+ Gummies Green Apple...
  Processing: ESN Designer Whey Protein Vanilla...

Copy generation complete:
  Success: 2
  Failed:  0
```

- [ ] **Step 4: Copy in Supabase prüfen**

Supabase Dashboard → `deals` → Zeile anklicken → `copy_data` Column: Soll JSON mit allen Feldern enthalten.

Beispiel-Output:
```json
{
  "headline": "CREATINE+ GUMMIES",
  "subheadline": "Green Apple",
  "benefit_1": "3g Kreatin",
  "benefit_1_detail": "pro Tagesportion",
  "benefit_2": "Kein Pulver",
  "benefit_2_detail": "Kein Shaker-Stress",
  "benefit_3": "Green Apple",
  "benefit_3_detail": "Ohne Zucker",
  "cta": "DEAL SICHERN",
  "caption": "Anzeige | Affiliate-Link\n\nMore Creatine+ Gummies gerade -25% im Deal ...",
  "hashtags": ["#geiloder", "#deals", "#creatine", ...],
  "humor_intro": "WENN DU DEN DEAL VERPASST ...",
  "humor_konsequenz_1": "Shaker-Klumpen für immer.",
  "humor_konsequenz_2": "Kein Green Apple mehr.",
  "humor_konsequenz_3": "Vollpreis. Schmerz.",
  "humor_cta": "SEI SCHLAUER. DEAL SICHERN!"
}
```

---

### Task 6: Tests für Copy-Generator

**Files:**
- Create: `src/lib/gemini/compliance.test.ts`, `src/lib/gemini/schema.test.ts`

- [ ] **Step 1: Compliance-Tests**

`src/lib/gemini/compliance.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { checkCompliance, ensureAffiliateDisclosure } from './compliance'
import type { DealCopy } from '@/types'

function makeCopy(overrides: Partial<DealCopy> = {}): DealCopy {
  return {
    headline: 'CREATINE+ GUMMIES',
    subheadline: 'Green Apple',
    benefit_1: '3g Kreatin',
    benefit_1_detail: 'pro Tagesportion',
    benefit_2: 'Kein Pulver',
    benefit_2_detail: 'Kein Shaker-Stress',
    benefit_3: 'Green Apple',
    benefit_3_detail: 'Ohne Zucker',
    cta: 'DEAL SICHERN',
    caption: 'Anzeige | Affiliate-Link\n\nMore Creatine+ Gummies gerade -25%.',
    hashtags: ['#geiloder', '#deals'],
    humor_intro: 'WENN DU DEN DEAL VERPASST ...',
    humor_konsequenz_1: 'Shaker-Klumpen für immer.',
    humor_konsequenz_2: 'Kein Green Apple mehr.',
    humor_konsequenz_3: 'Vollpreis. Schmerz.',
    humor_cta: 'SEI SCHLAUER. DEAL SICHERN!',
    ...overrides,
  }
}

describe('checkCompliance', () => {
  it('lässt saubere Copy durch', () => {
    const { passed } = checkCompliance(makeCopy())
    expect(passed).toBe(true)
  })

  it('erkennt verbotene gesundheitliche Claims', () => {
    const copy = makeCopy({ caption: 'Anzeige | Affiliate-Link\nVerbrennt Fett garantiert!' })
    const { passed, violations } = checkCompliance(copy)
    expect(passed).toBe(false)
    expect(violations).toContain('verbrennt fett')
  })

  it('sanitized die Kopie (ersetzt verbotene Phrase mit [...])', () => {
    const copy = makeCopy({ benefit_1_detail: 'Verbrennt Fett automatisch' })
    const { sanitized } = checkCompliance(copy)
    expect(sanitized.benefit_1_detail).not.toContain('Verbrennt Fett')
    expect(sanitized.benefit_1_detail).toContain('[...]')
  })
})

describe('ensureAffiliateDisclosure', () => {
  it('fügt Disclosure hinzu wenn fehlt', () => {
    const result = ensureAffiliateDisclosure('Tolles Produkt!')
    expect(result).toContain('Anzeige | Affiliate-Link')
  })

  it('fügt KEINE doppelte Disclosure hinzu', () => {
    const text = 'Anzeige | Affiliate-Link\n\nTolles Produkt!'
    const result = ensureAffiliateDisclosure(text)
    const count = (result.match(/Anzeige \| Affiliate-Link/g) ?? []).length
    expect(count).toBe(1)
  })
})
```

- [ ] **Step 2: Schema-Tests**

`src/lib/gemini/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseDealCopyResponse } from './schema'

const VALID_JSON = JSON.stringify({
  headline: 'CREATINE+ GUMMIES',
  subheadline: 'Green Apple',
  benefit_1: '3g Kreatin',
  benefit_1_detail: 'pro Tagesportion',
  benefit_2: 'Kein Pulver',
  benefit_2_detail: 'Kein Shaker-Stress',
  benefit_3: 'Green Apple',
  benefit_3_detail: 'Ohne Zucker',
  cta: 'DEAL SICHERN',
  caption: 'Anzeige | Affiliate-Link\n\nMore Creatine+ Gummies gerade -25%.',
  hashtags: ['#geiloder', '#deals', '#fitness'],
  humor_intro: 'WENN DU DEN DEAL VERPASST ...',
  humor_konsequenz_1: 'Shaker-Klumpen für immer.',
  humor_konsequenz_2: 'Kein Green Apple mehr.',
  humor_konsequenz_3: 'Vollpreis. Schmerz.',
  humor_cta: 'SEI SCHLAUER. DEAL SICHERN!',
})

describe('parseDealCopyResponse', () => {
  it('parst valides JSON', () => {
    const result = parseDealCopyResponse(VALID_JSON)
    expect(result.headline).toBe('CREATINE+ GUMMIES')
    expect(result.hashtags).toContain('#geiloder')
  })

  it('bereinigt Gemini Markdown-Wrapper', () => {
    const wrapped = `\`\`\`json\n${VALID_JSON}\n\`\`\``
    const result = parseDealCopyResponse(wrapped)
    expect(result.headline).toBe('CREATINE+ GUMMIES')
  })

  it('wirft Fehler bei ungültigem JSON', () => {
    expect(() => parseDealCopyResponse('nicht json')).toThrow()
  })
})
```

- [ ] **Step 3: Tests ausführen**

```bash
npm test
```

Expected: Alle Tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Gemini AI copy generator with compliance filter"
```

---

**Plan abgeschlossen wenn:**
- `npm test` → alle Tests grün
- `npx tsc --noEmit` → keine Fehler
- `npm run generate:copy` → generiert valides JSON für Test-Deals
- Supabase `deals.copy_data` enthält vollständiges DealCopy-Objekt
- Kein Deal hat verbotene Health-Claims in der Copy
