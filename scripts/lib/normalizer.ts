import { generateDealSlug } from '../../src/lib/utils'
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
  const rabatt = calculateRabatt(raw.alter_preis, raw.deal_preis)
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
    content_type: 'affiliate_deal',
    source_name: raw.quelle,
    source_url: raw.landingpage_url ?? null,
    barcode: null,
    image_license: null,
    image_rights_status: raw.produktbild_url ? 'affiliate_feed' : null,
    attribution_text: null,
    monetization_type: 'affiliate',
    product_facts: null,
  }
}
