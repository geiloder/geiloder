import { createServiceClient } from './server'

export interface GlobalStats {
  active_deals: number
  new_deals: number
  total_clicks: number
  clicks_today: number
  clicks_7d: number
  total_posts: number
}

export interface DealClickStats {
  id: string
  produktname: string
  shop: string
  kategorie: string
  deal_score: number | null
  deal_preis: number
  rabatt_prozent: number | null
  status: string
  total_clicks: number
  clicks_24h: number
  clicks_7d: number
  clicks_30d: number
}

export interface KategorieStats {
  kategorie: string
  total_clicks: number
  clicks_24h: number
  clicks_7d: number
  deals_count: number
}

export interface SourceStats {
  source: string
  total_clicks: number
  clicks_24h: number
  clicks_7d: number
}

export interface DailyClicks {
  day: string
  clicks: number
  deals_clicked: number
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('v_stats').select('*').single()
  if (error) throw error
  return data as GlobalStats
}

export async function getTopDealsByClicks(limit = 20): Promise<DealClickStats[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('v_deal_clicks')
    .select('*')
    .order('clicks_7d', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as DealClickStats[]
}

export async function getClicksByKategorie(): Promise<KategorieStats[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('v_clicks_by_kategorie').select('*')
  if (error) throw error
  return (data ?? []) as KategorieStats[]
}

export async function getClicksBySource(): Promise<SourceStats[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('v_clicks_by_source').select('*').limit(10)
  if (error) throw error
  return (data ?? []) as SourceStats[]
}

export async function getDailyClicks(days = 14): Promise<DailyClicks[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('v_clicks_daily')
    .select('*')
    .limit(days)
  if (error) throw error
  return (data ?? []) as DailyClicks[]
}
