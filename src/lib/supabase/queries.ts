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

  const limit = options.limit ?? 20
  const offset = options.offset ?? 0
  const { data, error } = await query.range(offset, offset + limit - 1)

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
