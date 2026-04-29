import type { Deal, DealCopy } from '@/types'

const STYLE_INSTRUCTIONS: Record<string, string> = {
  supplements: 'Dunkler Hintergrund (fast schwarz), Neon-Grün Akzente (#39ff14), Premium Fitness Aesthetic. Dynamisches Licht von oben links.',
  fitness: 'Dunkler Hintergrund, Neon-Grün oder Weiß Akzente, Sport/Gym Atmosphere.',
  'home-gym': 'Schwarz/Dunkelgrau Hintergrund, Rot/Orange Akzente, Industrial Gym Feeling.',
  gymwear: 'Clean, Minimal, Weiß oder Hellgrau Hintergrund, Editorial Fashion Feeling.',
  gadgets: 'Dunkelblau/Schwarz, Tech-Look, Blaue LED-Akzente, Premium Product Shot.',
  default: 'Dunkler Hintergrund, Helle Akzente, Premium Look.',
}

export function generateChatGptPrompt(deal: Deal, copy: DealCopy): string {
  if (deal.content_type === 'product_discovery') {
    const style = STYLE_INSTRUCTIONS[deal.kategorie] ?? STYLE_INSTRUCTIONS['default']
    const facts = deal.product_facts ?? {}
    const protein = facts.protein_serving ? `${facts.protein_serving}g Protein pro Portion` : facts.protein_100g ? `${facts.protein_100g}g Protein pro 100g` : 'Protein-Fakt falls sichtbar'
    const sugar = facts.sugar_serving ? `${facts.sugar_serving}g Zucker pro Portion` : facts.sugar_100g ? `${facts.sugar_100g}g Zucker pro 100g` : 'Zucker-Fakt falls sichtbar'

    return `Du bist ein professioneller Social-Media-Designer. Erstelle 4 hochwertige Instagram-Slides für einen unbezahlten Produkt-Check.

FORMAT: 1080 × 1350 Pixel (Portrait, Instagram Feed-Carousel)
STIL: ${style}
WICHTIG: Das Produktfoto ist beigefügt — zeige es als Verpackungsfoto, aber erfinde keine Partnerschaft mit der Marke.

Keine Kaufaufforderung, kein Rabatt, kein Affiliate-Link.

SLIDE 1 – PRODUKT-CHECK
Tag: "PRODUKT-CHECK"
Produktname: ${copy.headline}
Detail: ${copy.subheadline}
Badge: "GEIL ODER?"
Footer: "Unbezahlt recherchiert • Kein Affiliate-Link"

SLIDE 2 – FAKTEN
Headline: "WAS STECKT DRIN?"
Fakt 1: "${copy.benefit_1}" / "${copy.benefit_1_detail}"
Fakt 2: "${protein}"
Fakt 3: "${sugar}"

SLIDE 3 – VOTING
Headline: "${copy.cta}"
Subtext: "Würdest du das probieren?"
Footer: "Folge @geiloder.deals für tägliche Gym-Funds"

SLIDE 4 – HUMOR
Headline: "${copy.humor_intro}"
Konsequenz 1: "${copy.humor_konsequenz_1}"
Konsequenz 2: "${copy.humor_konsequenz_2}"
Konsequenz 3: "${copy.humor_konsequenz_3}"
CTA: "${copy.humor_cta}"

Liefere alle 4 Slides als separate Bilder. Konsistentes Design über alle 4 Slides.`
  }

  const style = STYLE_INSTRUCTIONS[deal.kategorie] ?? STYLE_INSTRUCTIONS['default']
  const rabattText = deal.rabatt_prozent ? `-${Math.round(deal.rabatt_prozent)}%` : 'DEAL'
  const verfText = deal.verfuegbarkeit ? `Nur noch ${deal.verfuegbarkeit} verfügbar` : ''

  return `Du bist ein professioneller Social-Media-Designer. Erstelle 4 hochwertige Instagram-Slides.

FORMAT: 1080 × 1350 Pixel (Portrait, Instagram Feed-Carousel)
STIL: ${style}
WICHTIG: Das Produktfoto ist beigefügt — baue es prominent in Slide 1 ein.

Erstelle alle 4 Slides als separate Bilder mit konsistentem Design.

---

SLIDE 1 – HERO DEAL
Oberer Tag (klein, Capslock): "TOP DEAL"
Produktname (groß, Capslock): ${copy.headline}
Variante/Detail (klein): ${copy.subheadline}
Rabatt-Badge (sehr groß, auffällig): ${rabattText}
${verfText ? `Verfügbarkeit (klein): "${verfText}"` : ''}
Marken-Claim (mittelgroß, Akzentfarbe): "GEIL ODER?"
CTA-Button: "JETZT DEAL ANSEHEN"
Footer (klein): "🔗 Link im Profil  •  @geiloder.deals"

---

SLIDE 2 – WARUM GEIL?
Abschnittstag (klein): "Warum ist das geil?"
Headline (groß): "WARUM DER DEAL GEIL IST"
Benefit-Karte 1: "${copy.benefit_1}" / "${copy.benefit_1_detail}"
Benefit-Karte 2: "${copy.benefit_2}" / "${copy.benefit_2_detail}"
Benefit-Karte 3: "${copy.benefit_3}" / "${copy.benefit_3_detail}"
Footer: "🔗 Link im Profil  •  @geiloder.deals"

---

SLIDE 3 – DEAL LIVE
Live-Indicator: "● DEAL LIVE"
Headline (groß): "${rabattText} AUF ${copy.headline}"
CTA-Button (groß, Akzentfarbe): "${copy.cta}"
Subtext: "Link im Profil oder in der Story"
Follow-Text: "Folge @geiloder.deals für tägliche Fitness-Deals"

---

SLIDE 4 – HUMOR
Headline (groß, Capslock): "${copy.humor_intro}"
Subtext: "dann warten diese Schicksale auf dich:"
Konsequenz 1 (nummeriert "01"): "${copy.humor_konsequenz_1}"
Konsequenz 2 (nummeriert "02"): "${copy.humor_konsequenz_2}"
Konsequenz 3 (nummeriert "03"): "${copy.humor_konsequenz_3}"
Abschluss-CTA: "${copy.humor_cta}"
Footer: "🔗 Deal im Profil oder in der Story  •  Folge @geiloder.deals"

---

Liefere alle 4 Slides als separate Bilder. Konsistentes Design über alle 4 Slides.`
}
