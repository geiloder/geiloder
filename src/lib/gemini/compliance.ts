import type { DealCopy } from '@/types'

const VERBOTENE_PHRASES = [
  'macht dich stärker',
  'verbrennt fett',
  'baut muskeln auf',
  'garantiert erfolg',
  'klinisch bewiesen',
  'wissenschaftlich bewiesen',
  'heilt',
  'kuriert',
  'therapie',
  'medizinisch',
  'ohne training',
  'ohne sport',
  'abnehmen garantiert',
  'gewicht verlieren garantiert',
  'wirkt sofort',
  'wundermittel',
  '100% wirksam',
  'bmi senken',
  'blutdruck',
  'cholesterin',
  'diabetes',
  'heilmittel',
]

export interface ComplianceResult {
  passed: boolean
  violations: string[]
  sanitized: DealCopy
}

function sanitizeText(text: string): string {
  let result = text
  for (const phrase of VERBOTENE_PHRASES) {
    result = result.replace(new RegExp(phrase, 'gi'), '[...]')
  }
  return result
}

export function checkCompliance(copy: DealCopy): ComplianceResult {
  const violations: string[] = []
  const allTexts = [
    copy.headline, copy.subheadline,
    copy.benefit_1, copy.benefit_1_detail,
    copy.benefit_2, copy.benefit_2_detail,
    copy.benefit_3, copy.benefit_3_detail,
    copy.cta, copy.caption,
    copy.humor_intro, copy.humor_konsequenz_1,
    copy.humor_konsequenz_2, copy.humor_konsequenz_3,
    copy.humor_cta,
    ...copy.hashtags,
  ].join(' ').toLowerCase()

  for (const phrase of VERBOTENE_PHRASES) {
    if (allTexts.includes(phrase.toLowerCase())) {
      violations.push(phrase)
    }
  }

  const sanitized: DealCopy = {
    ...copy,
    benefit_1_detail: sanitizeText(copy.benefit_1_detail),
    benefit_2_detail: sanitizeText(copy.benefit_2_detail),
    benefit_3_detail: sanitizeText(copy.benefit_3_detail),
    caption: sanitizeText(copy.caption),
    humor_konsequenz_1: sanitizeText(copy.humor_konsequenz_1),
    humor_konsequenz_2: sanitizeText(copy.humor_konsequenz_2),
    humor_konsequenz_3: sanitizeText(copy.humor_konsequenz_3),
  }

  return { passed: violations.length === 0, violations, sanitized }
}

export function ensureAffiliateDisclosure(caption: string): string {
  const requiredText = 'Anzeige | Affiliate-Link'
  if (!caption.includes(requiredText)) {
    return `${requiredText}\n\n${caption}`
  }
  return caption
}
