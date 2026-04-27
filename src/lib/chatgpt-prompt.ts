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
