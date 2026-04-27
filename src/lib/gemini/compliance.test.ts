import { describe, it, expect } from 'vitest'
import { checkCompliance, ensureAffiliateDisclosure } from './compliance'
import type { DealCopy } from '@/types'

function makeCopy(overrides: Partial<DealCopy> = {}): DealCopy {
  return {
    headline: 'CREATINE+ GUMMIES',
    subheadline: 'Green Apple',
    benefit_1: '3g Kreatin',
    benefit_1_detail: 'pro Tagesportion',
    benefit_2: 'Kein Pulver',
    benefit_2_detail: 'Kein Shaker-Stress',
    benefit_3: 'Green Apple',
    benefit_3_detail: 'Ohne Zucker',
    cta: 'DEAL SICHERN',
    caption: 'Anzeige | Affiliate-Link\n\nMore Creatine+ Gummies gerade -25%.',
    hashtags: ['#geiloder', '#deals'],
    humor_intro: 'WENN DU DEN DEAL VERPASST ...',
    humor_konsequenz_1: 'Shaker-Klumpen für immer.',
    humor_konsequenz_2: 'Kein Green Apple mehr.',
    humor_konsequenz_3: 'Vollpreis. Schmerz.',
    humor_cta: 'SEI SCHLAUER. DEAL SICHERN!',
    ...overrides,
  }
}

describe('checkCompliance', () => {
  it('lässt saubere Copy durch', () => {
    expect(checkCompliance(makeCopy()).passed).toBe(true)
  })

  it('erkennt verbotene gesundheitliche Claims', () => {
    const { passed, violations } = checkCompliance(
      makeCopy({ caption: 'Anzeige | Affiliate-Link\nVerbrennt Fett garantiert!' })
    )
    expect(passed).toBe(false)
    expect(violations).toContain('verbrennt fett')
  })

  it('sanitized die Kopie', () => {
    const { sanitized } = checkCompliance(
      makeCopy({ benefit_1_detail: 'Verbrennt Fett automatisch' })
    )
    expect(sanitized.benefit_1_detail).not.toContain('Verbrennt Fett')
    expect(sanitized.benefit_1_detail).toContain('[...]')
  })
})

describe('ensureAffiliateDisclosure', () => {
  it('fügt Disclosure hinzu wenn fehlt', () => {
    expect(ensureAffiliateDisclosure('Tolles Produkt!')).toContain('Anzeige | Affiliate-Link')
  })

  it('fügt KEINE doppelte Disclosure hinzu', () => {
    const text = 'Anzeige | Affiliate-Link\n\nTolles Produkt!'
    const count = (ensureAffiliateDisclosure(text).match(/Anzeige \| Affiliate-Link/g) ?? []).length
    expect(count).toBe(1)
  })
})
