import { describe, it, expect } from 'vitest'
import { scoreDeal, checkAntiSpam } from './index'
import type { Deal, AntiSpamContext } from '@/types'

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'test-id',
    external_id: 'ext-1',
    quelle: 'awin',
    produktname: 'Test Protein',
    marke: 'more nutrition',
    shop: 'More Shop',
    kategorie: 'supplements',
    alter_preis: 39.99,
    deal_preis: 19.99,
    rabatt_prozent: 50,
    gutschein_code: null,
    verfuegbarkeit: '15%',
    produktbild_url: 'https://example.com/img.jpg',
    affiliate_link: 'https://awin.com/test',
    landingpage_url: null,
    provision: 10,
    deal_score: null,
    status: 'new',
    copy_data: null,
    slug: 'test-protein-abc12345',
    created_at: new Date().toISOString(),
    expires_at: null,
    posted_at: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeContext(overrides: Partial<AntiSpamContext> = {}): AntiSpamContext {
  return {
    dealsByMarke: new Map(),
    dealsByKategorie: new Map(),
    recentProducts: new Set(),
    consecutiveSupplements: 0,
    ...overrides,
  }
}

describe('scoreDeal', () => {
  it('gibt hohen Score für Top-Deal', () => {
    const { score, tier } = scoreDeal(makeDeal())
    expect(score).toBeGreaterThanOrEqual(70)
    expect(tier).toBe('carousel')
  })

  it('gibt niedrigen Score wenn kein Rabatt und kein Bild', () => {
    const { score } = scoreDeal(makeDeal({ rabatt_prozent: 0, alter_preis: null, produktbild_url: null }))
    expect(score).toBeLessThan(70)
  })

  it('gibt Story-Tier für mittleren Deal', () => {
    const { tier } = scoreDeal(makeDeal({
      rabatt_prozent: 15,
      marke: 'Unbekannte Marke XYZ',
      provision: 3,
      deal_preis: 49.99,
      verfuegbarkeit: null,
    }))
    expect(['story', 'ignore']).toContain(tier)
  })

  it('ignoriert Deal mit sehr kleinem Rabatt, hohem Preis und schlechter Kategorie', () => {
    const { tier } = scoreDeal(makeDeal({
      rabatt_prozent: 5,
      deal_preis: 299.99,
      marke: null,
      provision: 1,
      verfuegbarkeit: null,
      kategorie: 'sonstige',
      produktbild_url: null,
    }))
    expect(tier).toBe('ignore')
  })

  it('Score ist immer zwischen 0 und 100', () => {
    [makeDeal(), makeDeal({ rabatt_prozent: 0 }), makeDeal({ deal_preis: 999 })].forEach((d) => {
      const { score } = scoreDeal(d)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})

describe('checkAntiSpam', () => {
  it('blockiert Marke nach 3 Deals', () => {
    const result = checkAntiSpam(
      makeDeal({ marke: 'more nutrition' }),
      makeContext({ dealsByMarke: new Map([['more nutrition', 3]]) })
    )
    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('more nutrition')
  })

  it('lässt Deal durch wenn Marke weniger als 3x', () => {
    const result = checkAntiSpam(
      makeDeal({ marke: 'more nutrition' }),
      makeContext({ dealsByMarke: new Map([['more nutrition', 2]]) })
    )
    expect(result.blocked).toBe(false)
  })

  it('blockiert bereits gepostetes Produkt', () => {
    const result = checkAntiSpam(
      makeDeal({ produktname: 'Test Protein' }),
      makeContext({ recentProducts: new Set(['test protein']) })
    )
    expect(result.blocked).toBe(true)
  })

  it('blockiert zu viele Supplements hintereinander', () => {
    const result = checkAntiSpam(
      makeDeal({ kategorie: 'supplements' }),
      makeContext({ consecutiveSupplements: 5 })
    )
    expect(result.blocked).toBe(true)
  })

  it('lässt frischen Deal ohne Spam-Kontext durch', () => {
    expect(checkAntiSpam(makeDeal(), makeContext()).blocked).toBe(false)
  })
})
