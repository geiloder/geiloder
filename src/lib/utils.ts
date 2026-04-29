import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Deal } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

export function formatDiscount(percent: number): string {
  return `-${Math.round(percent)}%`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateDealSlug(produktname: string, dealId: string): string {
  return `${slugify(produktname)}-${dealId.slice(0, 8)}`
}

export function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export function isDiscoveryDeal(
  deal: Partial<Pick<Deal, 'content_type' | 'monetization_type' | 'quelle' | 'shop' | 'affiliate_link' | 'landingpage_url'>>
): boolean {
  const shop = deal.shop?.toLowerCase()
  const link = `${deal.affiliate_link ?? ''} ${deal.landingpage_url ?? ''}`.toLowerCase()
  return (
    deal.content_type === 'product_discovery' ||
    deal.monetization_type === 'none' ||
    (deal.quelle === 'manuell' && shop === 'open food facts') ||
    link.includes('openfoodfacts.org')
  )
}
