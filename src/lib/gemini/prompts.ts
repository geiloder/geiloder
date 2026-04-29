import type { Deal } from '@/types'
import { isDiscoveryDeal } from '@/lib/utils'

export function buildDealCopyPrompt(deal: Deal): string {
  if (isDiscoveryDeal(deal)) {
    const discoveryMeta = deal.copy_data as ({ product_facts?: typeof deal.product_facts } | null)
    const facts = deal.product_facts ?? discoveryMeta?.product_facts ?? {}
    const protein = facts.protein_serving
      ? `${facts.protein_serving} g Protein pro Portion`
      : facts.protein_100g
        ? `${facts.protein_100g} g Protein pro 100 g`
        : ''
    const sugar = facts.sugar_serving
      ? `${facts.sugar_serving} g Zucker pro Portion`
      : facts.sugar_100g
        ? `${facts.sugar_100g} g Zucker pro 100 g`
        : ''
    const calories = facts.calories_serving
      ? `${facts.calories_serving} kcal pro Portion`
      : facts.calories_100g
        ? `${facts.calories_100g} kcal pro 100 g`
        : ''

    return `Du bist Texter für die deutsche Social-Media-Brand "Geil oder?".
Die Marke ist frech, humorvoll, direkt. Zielgruppe: 18-35 Jahre, Fitness-affin, neugierig auf Produkte.

Erstelle Copy für einen unbezahlten Produkt-Check. Antworte NUR mit validem JSON ohne Markdown-Code-Blöcke.

PRODUKT-DATEN:
- Produktname: ${deal.produktname}
- Marke: ${deal.marke ?? 'Unbekannt'}
- Quelle: Open Food Facts
- Menge: ${facts.quantity ?? 'unbekannt'}
${protein ? `- ${protein}` : ''}
${sugar ? `- ${sugar}` : ''}
${calories ? `- ${calories}` : ''}
- Kategorie: ${deal.kategorie}

WICHTIGE REGELN:
1. Keine Preise, Rabatte, Shops oder Kaufaufforderungen erfinden
2. Kein Affiliate, keine Anzeige, keine Provision
3. Keine Gesundheits-Claims: NICHT "macht dich stärker", "verbrennt Fett", "heilt", "wirkt garantiert", "baut Muskeln auf"
4. Schreib nur Fakten aus den Produktdaten und klare Meinungs-/Voting-Sprache
5. Deutsch, direkt, kein "Sie"
6. CTA soll Interaktion auslösen, z.B. "GEIL ODER?", "WÜRDEST DU PROBIEREN?"

Erstelle folgendes JSON-Objekt:

{
  "headline": "Slide 1: Produktname in CAPS, max 30 Zeichen",
  "subheadline": "Slide 1: Variante/Detail, max 20 Zeichen",
  "benefit_1": "Slide 2: Fakt-Titel, max 20 Zeichen",
  "benefit_1_detail": "Slide 2: Fakt aus Nährwerten, max 25 Zeichen",
  "benefit_2": "Slide 2: Zweiter Fakt-Titel",
  "benefit_2_detail": "Slide 2: Erklärung",
  "benefit_3": "Slide 2: Dritter Fakt-Titel",
  "benefit_3_detail": "Slide 2: Erklärung",
  "cta": "Slide 3: Interaktions-CTA, max 25 Zeichen, z.B. GEIL ODER?",
  "caption": "Instagram Caption: 2-3 Sätze, Produkt-Check mit Fakten. Muss enden mit: 'Unbezahlt recherchiert | Kein Affiliate-Link. Daten/Bild: Open Food Facts.'",
  "hashtags": ["#array", "#von", "#hashtags", "#max15"],
  "humor_intro": "Slide 4: Einleitungssatz, z.B. 'WENN DU DAS NICHT PROBIERST ...'",
  "humor_konsequenz_1": "Slide 4: Erste lustige Konsequenz, max 35 Zeichen",
  "humor_konsequenz_2": "Slide 4: Zweite lustige Konsequenz, max 35 Zeichen",
  "humor_konsequenz_3": "Slide 4: Dritte lustige Konsequenz, max 35 Zeichen",
  "humor_cta": "Slide 4: Abschluss-CTA, max 30 Zeichen, z.B. 'GEIL ODER? SAG DU!'"
}`
  }

  const rabattText = deal.rabatt_prozent
    ? `-${Math.round(deal.rabatt_prozent)}%`
    : 'Sonderpreis'

  const alterPreisText = deal.alter_preis
    ? `Alter Preis: ${deal.alter_preis.toFixed(2).replace('.', ',')} €`
    : ''

  const gutscheinText = deal.gutschein_code
    ? `Gutschein-Code: ${deal.gutschein_code}`
    : ''

  const knappheitText = deal.verfuegbarkeit
    ? `Verfügbarkeit: ${deal.verfuegbarkeit}`
    : ''

  return `Du bist Texter für die deutsche Deal-Media-Brand "Geil oder?".
Die Marke ist frech, humorvoll, direkt. Zielgruppe: 18-35 Jahre, Fitness-affin, preisbewusst.

Erstelle Copy für diesen Deal. Antworte NUR mit validem JSON ohne Markdown-Code-Blöcke.

DEAL-DATEN:
- Produktname: ${deal.produktname}
- Marke: ${deal.marke ?? deal.shop}
- Shop: ${deal.shop}
- Deal-Preis: ${deal.deal_preis.toFixed(2).replace('.', ',')} €
${alterPreisText}
- Rabatt: ${rabattText}
${gutscheinText}
${knappheitText}
- Kategorie: ${deal.kategorie}

WICHTIGE REGELN:
1. Preise NIEMALS neu erfinden, immer aus den Deal-Daten übernehmen
2. Keine Gesundheits-Claims: NICHT "macht dich stärker", "verbrennt Fett", "heilt", "wirkt garantiert"
3. Schreib Fakten: "enthält X g Protein", "25% Rabatt", "ohne Zucker"
4. Deutsch, direkt, kein "Sie"
5. Humor muss offensichtlich übertrieben sein — harmlos, nicht beleidigend

HUMOR-FORMELN (für Slide 4):
- "Wenn du den Deal verpasst, [nervige Standardlösung zurück]"
- "Deal verpasst = [Folge 1] + [Folge 2] + [Folge 3]"
- "POV: Du hast den Deal verpasst und [lustige Situation]"

Erstelle folgendes JSON-Objekt:

{
  "headline": "Slide 1: Produktname in CAPS, max 30 Zeichen",
  "subheadline": "Slide 1: Variante/Detail, max 20 Zeichen",
  "benefit_1": "Slide 2: Benefit-Titel, max 20 Zeichen, FAKTEN aus Produktname",
  "benefit_1_detail": "Slide 2: Erklärung, max 25 Zeichen",
  "benefit_2": "Slide 2: Zweiter Benefit-Titel",
  "benefit_2_detail": "Slide 2: Erklärung",
  "benefit_3": "Slide 2: Dritter Benefit-Titel",
  "benefit_3_detail": "Slide 2: Erklärung",
  "cta": "Slide 3: Call-to-Action, max 25 Zeichen, z.B. JETZT DEAL SICHERN",
  "caption": "Instagram Caption: 2-3 Sätze, enthält Produktname, Rabatt, Deal-Hinweis. Muss enden mit: 'Anzeige | Affiliate-Link. Preis kann sich ändern. Angaben ohne Gewähr.'",
  "hashtags": ["#array", "#von", "#hashtags", "#max15"],
  "humor_intro": "Slide 4: Einleitungssatz, z.B. 'WENN DU DEN DEAL VERPASST ...'",
  "humor_konsequenz_1": "Slide 4: Erste lustige Konsequenz, max 35 Zeichen",
  "humor_konsequenz_2": "Slide 4: Zweite lustige Konsequenz, max 35 Zeichen",
  "humor_konsequenz_3": "Slide 4: Dritte lustige Konsequenz, max 35 Zeichen",
  "humor_cta": "Slide 4: Abschluss-CTA, max 30 Zeichen, z.B. 'SEI SCHLAUER. DEAL SICHERN!'"
}`
}
