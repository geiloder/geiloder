export type DealStatus =
  | 'new'
  | 'approved'
  | 'rejected'
  | 'rendered'
  | 'scheduled'
  | 'posted'
  | 'expired'

export type DealKategorie =
  | 'supplements'
  | 'fitness'
  | 'home-gym'
  | 'gymwear'
  | 'gadgets'
  | 'beauty'
  | 'home-living'
  | 'tech'
  | 'fashion'
  | 'sonstige'

export type DealQuelle = 'awin' | 'adcell' | 'amazon' | 'manuell'
export type ContentType = 'affiliate_deal' | 'product_discovery'
export type MonetizationType = 'affiliate' | 'none'

export interface ProductFacts {
  quantity?: string | null
  protein_100g?: number | null
  protein_serving?: number | null
  sugar_100g?: number | null
  sugar_serving?: number | null
  calories_100g?: number | null
  calories_serving?: number | null
  fat_100g?: number | null
  carbs_100g?: number | null
  fiber_100g?: number | null
  nutriscore_grade?: string | null
}

export interface Deal {
  id: string
  external_id: string | null
  quelle: DealQuelle
  produktname: string
  marke: string | null
  shop: string
  kategorie: DealKategorie
  alter_preis: number | null
  deal_preis: number
  rabatt_prozent: number | null
  gutschein_code: string | null
  verfuegbarkeit: string | null
  produktbild_url: string | null
  affiliate_link: string
  landingpage_url: string | null
  provision: number | null
  deal_score: number | null
  status: DealStatus
  copy_data: DealCopy | null
  slug: string | null
  created_at: string
  expires_at: string | null
  posted_at: string | null
  updated_at: string
  content_type?: ContentType | null
  source_name?: string | null
  source_url?: string | null
  barcode?: string | null
  image_license?: string | null
  image_rights_status?: string | null
  attribution_text?: string | null
  monetization_type?: MonetizationType | null
  product_facts?: ProductFacts | null
}

export interface DealCopy {
  headline: string
  subheadline: string
  benefit_1: string
  benefit_1_detail: string
  benefit_2: string
  benefit_2_detail: string
  benefit_3: string
  benefit_3_detail: string
  cta: string
  caption: string
  hashtags: string[]
  humor_intro: string
  humor_konsequenz_1: string
  humor_konsequenz_2: string
  humor_konsequenz_3: string
  humor_cta: string
}

export interface Shop {
  id: string
  name: string
  domain: string | null
  affiliate_programm: string | null
  social_erlaubt: boolean
  deeplink_erlaubt: boolean
  bilder_erlaubt: boolean
  provision_rate: number | null
  aktiv: boolean
  created_at: string
}

export interface Post {
  id: string
  deal_id: string
  plattform: 'instagram' | 'tiktok' | 'pinterest' | 'youtube'
  post_type: 'carousel' | 'story' | 'reel' | 'pin'
  status: 'pending' | 'scheduled' | 'posted' | 'failed'
  scheduled_for: string | null
  posted_at: string | null
  external_post_id: string | null
  assets: PostAssets | null
  created_at: string
}

export interface PostAssets {
  slides?: string[]
  story?: string[]
  video?: string | null
  thumbnail?: string | null
}

export interface Click {
  id: string
  deal_id: string
  source: string | null
  plattform: string | null
  post_id: string | null
  ip_hash: string | null
  user_agent: string | null
  utm_campaign: string | null
  utm_content: string | null
  created_at: string
}

export interface RawFeedDeal {
  external_id: string
  quelle: DealQuelle
  produktname: string
  marke?: string
  shop: string
  alter_preis?: number
  deal_preis: number
  produktbild_url?: string
  affiliate_link: string
  landingpage_url?: string
  provision?: number
  verfuegbarkeit?: string
  gutschein_code?: string
  expires_at?: string
}

export interface AntiSpamContext {
  dealsByMarke: Map<string, number>
  dealsByKategorie: Map<string, number>
  recentProducts: Set<string>
  consecutiveSupplements: number
}
