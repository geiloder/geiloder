import { config } from 'dotenv'
config({ path: '.env.local' })

import { createServiceClient } from '../src/lib/supabase/server'
import { scoreDeal, checkAntiSpam } from '../src/lib/scoring'
import { scoreDiscoveryProduct } from '../src/lib/discovery/scoring'
import { generateDealSlug, isDiscoveryDeal } from '../src/lib/utils'
import type { Deal, AntiSpamContext } from '../src/types'

async function buildAntiSpamContext(supabase: ReturnType<typeof createServiceClient>): Promise<AntiSpamContext> {
  const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ data: recentDeals }, { data: todayDeals }] = await Promise.all([
    supabase
      .from('deals')
      .select('produktname')
      .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
      .gte('updated_at', since72h),
    supabase
      .from('deals')
      .select('marke, shop, kategorie')
      .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
      .gte('updated_at', since24h),
  ])

  const context: AntiSpamContext = {
    dealsByMarke: new Map(),
    dealsByKategorie: new Map(),
    recentProducts: new Set(),
    consecutiveSupplements: 0,
  }

  for (const d of todayDeals ?? []) {
    const marke = ((d.marke ?? d.shop) as string).toLowerCase()
    context.dealsByMarke.set(marke, (context.dealsByMarke.get(marke) ?? 0) + 1)
    context.dealsByKategorie.set(d.kategorie, (context.dealsByKategorie.get(d.kategorie) ?? 0) + 1)
  }

  for (const d of recentDeals ?? []) {
    context.recentProducts.add((d.produktname as string).toLowerCase().slice(0, 50))
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
    // No image → reject immediately
    if (!deal.produktbild_url) {
      await supabase.from('deals').update({ status: 'rejected', deal_score: 0 }).eq('id', deal.id)
      ignored++
      continue
    }

    const discovery = isDiscoveryDeal(deal)
    const { score, tier } = discovery
      ? scoreDiscoveryProduct(deal)
      : scoreDeal(deal)

    if (tier === 'ignore') {
      await supabase.from('deals').update({ status: 'rejected', deal_score: score }).eq('id', deal.id)
      ignored++
      continue
    }

    const spamCheck = discovery
      ? {
          blocked: antiSpamContext.recentProducts.has(deal.produktname.toLowerCase().slice(0, 50)),
          reason: 'Produkt bereits in letzten 72h gepostet',
        }
      : checkAntiSpam(deal, antiSpamContext)
    if (spamCheck.blocked) {
      await supabase.from('deals').update({ status: 'rejected', deal_score: score }).eq('id', deal.id)
      console.log(`  SPAM-BLOCKED: ${deal.produktname} — ${spamCheck.reason}`)
      spamBlocked++
      continue
    }

    const slug = deal.slug ?? generateDealSlug(deal.produktname, deal.id)
    await supabase.from('deals').update({ deal_score: score, status: 'approved', slug }).eq('id', deal.id)
    console.log(`  ${tier.toUpperCase()} (${score}): ${deal.produktname.slice(0, 60)}`)

    const marke = (deal.marke ?? deal.shop).toLowerCase()
    antiSpamContext.dealsByMarke.set(marke, (antiSpamContext.dealsByMarke.get(marke) ?? 0) + 1)
    antiSpamContext.dealsByKategorie.set(deal.kategorie, (antiSpamContext.dealsByKategorie.get(deal.kategorie) ?? 0) + 1)
    if (deal.kategorie === 'supplements') antiSpamContext.consecutiveSupplements++
    else antiSpamContext.consecutiveSupplements = 0

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
