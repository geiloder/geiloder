import { describe, it, expect } from 'vitest'
import { parseDealCopyResponse } from './schema'

const VALID_JSON = JSON.stringify({
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
  hashtags: ['#geiloder', '#deals', '#fitness'],
  humor_intro: 'WENN DU DEN DEAL VERPASST ...',
  humor_konsequenz_1: 'Shaker-Klumpen für immer.',
  humor_konsequenz_2: 'Kein Green Apple mehr.',
  humor_konsequenz_3: 'Vollpreis. Schmerz.',
  humor_cta: 'SEI SCHLAUER. DEAL SICHERN!',
})

describe('parseDealCopyResponse', () => {
  it('parst valides JSON', () => {
    const result = parseDealCopyResponse(VALID_JSON)
    expect(result.headline).toBe('CREATINE+ GUMMIES')
    expect(result.hashtags).toContain('#geiloder')
  })

  it('bereinigt Gemini Markdown-Wrapper', () => {
    const result = parseDealCopyResponse(`\`\`\`json\n${VALID_JSON}\n\`\`\``)
    expect(result.headline).toBe('CREATINE+ GUMMIES')
  })

  it('wirft Fehler bei ungültigem JSON', () => {
    expect(() => parseDealCopyResponse('nicht json')).toThrow()
  })
})
