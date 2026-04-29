import { config } from 'dotenv'
config({ path: '.env.local' })

import { createServiceClient } from '../src/lib/supabase/server'
import { generateWithRetry } from '../src/lib/gemini/client'
import { buildDealCopyPrompt } from '../src/lib/gemini/prompts'
import { parseDealCopyResponse } from '../src/lib/gemini/schema'
import { checkCompliance, ensureAffiliateDisclosure, ensureUnpaidDisclosure } from '../src/lib/gemini/compliance'
import type { Deal, DealCopy } from '../src/types'

const DELAY_MS = 4200 // Gemini Flash: 15 req/min free tier

async function generateCopyForDeal(deal: Deal): Promise<DealCopy | null> {
  try {
    const rawResponse = await generateWithRetry(buildDealCopyPrompt(deal))
    const parsed = parseDealCopyResponse(rawResponse)

    const hashtags = parsed.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`))
    const caption = deal.content_type === 'product_discovery'
      ? ensureUnpaidDisclosure(parsed.caption)
      : ensureAffiliateDisclosure(parsed.caption)
    const copy: DealCopy = { ...parsed, hashtags, caption }

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

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'approved')
    .is('copy_data', null)
    .order('deal_score', { ascending: false })
    .limit(50)

  if (error) throw error

  const deals = (data ?? []) as Deal[]
  console.log(`Generating copy for ${deals.length} deals...`)

  if (deals.length === 0) {
    console.log('No deals need copy generation.')
    return
  }

  let success = 0, failed = 0

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i]
    console.log(`  [${i + 1}/${deals.length}] ${deal.produktname.slice(0, 60)}...`)

    const copy = await generateCopyForDeal(deal)

    if (copy) {
      const { error: updateError } = await supabase
        .from('deals')
        .update({ copy_data: copy })
        .eq('id', deal.id)

      if (updateError) {
        console.error(`  DB error: ${updateError.message}`)
        failed++
      } else {
        success++
      }
    } else {
      failed++
    }

    if (i < deals.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  console.log(`\nCopy generation complete:`)
  console.log(`  Success: ${success}`)
  console.log(`  Failed:  ${failed}`)
}

generateCopyForAllApproved().catch(console.error)
