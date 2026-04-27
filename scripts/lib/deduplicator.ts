import { createServiceClient } from '../../src/lib/supabase/server'
import type { RawFeedDeal } from '../../src/types'

export async function filterNewDeals(rawDeals: RawFeedDeal[]): Promise<RawFeedDeal[]> {
  const supabase = createServiceClient()
  const externalIds = rawDeals.map((d) => d.external_id)

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
