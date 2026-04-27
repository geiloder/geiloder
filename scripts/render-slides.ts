import { config } from 'dotenv'
config({ path: '.env.local' })

import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { createServiceClient } from '../src/lib/supabase/server'
import { uploadSlideToStorage } from './lib/uploader'
import type { Deal, DealCopy, DealKategorie, PostAssets } from '../src/types'

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')
const STYLES_DIR = path.join(TEMPLATES_DIR, 'styles')
const TEMP_DIR = path.join(process.cwd(), '.tmp-renders')

const FEED_SIZE = { width: 1080, height: 1350 }
const STORY_SIZE = { width: 1080, height: 1920 }

function getStyleForKategorie(kategorie: DealKategorie): string {
  if (['supplements', 'fitness'].includes(kategorie)) return path.join(STYLES_DIR, 'supplement.css')
  if (['home-gym', 'gadgets'].includes(kategorie)) return path.join(STYLES_DIR, 'gym.css')
  return path.join(STYLES_DIR, 'clean.css')
}

const SLIDE_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: 'hero', 2: 'benefits', 3: 'cta', 4: 'humor',
}

function fillTemplate(
  template: string,
  vars: Record<string, string>,
  size: { width: number; height: number },
  stylePath: string
): string {
  let html = template
  html = html.replace(/\{\{HEIGHT\}\}/g, size.height.toString())
  html = html.replace(/\{\{STYLE_PATH\}\}/g, `file://${stylePath}`)

  for (const [key, value] of Object.entries(vars)) {
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escaped)
  }

  html = html.replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return vars[varName] ? content : ''
  })

  html = html.replace(/\{\{[^}]+\}\}/g, '')
  return html
}

async function renderSlide(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  deal: Deal,
  copy: DealCopy,
  slideNumber: 1 | 2 | 3 | 4,
  size: { width: number; height: number }
): Promise<Buffer> {
  const templateFile = path.join(TEMPLATES_DIR, `slide${slideNumber}-${SLIDE_NAMES[slideNumber]}.html`)
  const template = readFileSync(templateFile, 'utf-8')
  const stylePath = getStyleForKategorie(deal.kategorie)

  const vars: Record<string, string> = {
    PRODUKTNAME: deal.produktname,
    MARKE: deal.marke ?? deal.shop,
    HEADLINE: copy.headline,
    SUBHEADLINE: copy.subheadline,
    BENEFIT_1: copy.benefit_1,
    BENEFIT_1_DETAIL: copy.benefit_1_detail,
    BENEFIT_2: copy.benefit_2,
    BENEFIT_2_DETAIL: copy.benefit_2_detail,
    BENEFIT_3: copy.benefit_3,
    BENEFIT_3_DETAIL: copy.benefit_3_detail,
    CTA: copy.cta,
    HUMOR_INTRO: copy.humor_intro,
    HUMOR_KONSEQUENZ_1: copy.humor_konsequenz_1,
    HUMOR_KONSEQUENZ_2: copy.humor_konsequenz_2,
    HUMOR_KONSEQUENZ_3: copy.humor_konsequenz_3,
    HUMOR_CTA: copy.humor_cta,
    RABATT: deal.rabatt_prozent ? `-${Math.round(deal.rabatt_prozent)}%` : 'DEAL',
    VERFUEGBARKEIT: deal.verfuegbarkeit ? `Noch ${deal.verfuegbarkeit} verfügbar` : '',
    PRODUKTBILD_URL: deal.produktbild_url ?? '',
  }

  const html = fillTemplate(template, vars, size, stylePath)
  mkdirSync(TEMP_DIR, { recursive: true })

  const tempFile = path.join(TEMP_DIR, `render_${deal.id}_${slideNumber}_${size.width}x${size.height}.html`)
  writeFileSync(tempFile, html)

  const page = await browser.newPage()
  await page.setViewportSize(size)
  await page.goto(`file://${tempFile}`)
  await page.waitForLoadState('networkidle')
  if (deal.produktbild_url) await page.waitForTimeout(300)

  const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, ...size } })
  await page.close()
  return buffer as Buffer
}

async function renderDeal(
  deal: Deal,
  copy: DealCopy,
  browser: Awaited<ReturnType<typeof chromium.launch>>
): Promise<PostAssets> {
  const feedAssets: string[] = []
  const storyAssets: string[] = []

  for (const slideNumber of [1, 2, 3, 4] as const) {
    process.stdout.write(`    Slide ${slideNumber} feed...`)
    const feedBuffer = await renderSlide(browser, deal, copy, slideNumber, FEED_SIZE)
    feedAssets.push(await uploadSlideToStorage(deal.id, slideNumber, 'feed', feedBuffer))
    process.stdout.write(' story...')
    const storyBuffer = await renderSlide(browser, deal, copy, slideNumber, STORY_SIZE)
    storyAssets.push(await uploadSlideToStorage(deal.id, slideNumber, 'story', storyBuffer))
    console.log(' done')
  }

  return { slides: feedAssets, story: storyAssets }
}

async function renderApprovedDeals() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'approved')
    .not('copy_data', 'is', null)
    .order('deal_score', { ascending: false })
    .limit(20)

  if (error) throw error

  const deals = (data ?? []) as Deal[]
  console.log(`Rendering ${deals.length} deals...`)
  if (deals.length === 0) { console.log('No deals to render.'); return }

  const browser = await chromium.launch({ headless: true })

  try {
    for (const deal of deals) {
      console.log(`  Rendering: ${deal.produktname.slice(0, 50)}...`)
      const copy = deal.copy_data as DealCopy

      try {
        const assets = await renderDeal(deal, copy, browser)

        await supabase.from('posts').insert({
          deal_id: deal.id,
          plattform: 'instagram',
          post_type: 'carousel',
          status: 'pending',
          assets,
        })

        await supabase.from('deals').update({ status: 'rendered' }).eq('id', deal.id)
        console.log(`  ✓ ${deal.produktname.slice(0, 50)}`)
      } catch (err) {
        console.error(`  ✗ Render error for ${deal.id}:`, err)
      }
    }
  } finally {
    await browser.close()
  }

  console.log('Rendering complete.')
}

renderApprovedDeals().catch(console.error)
