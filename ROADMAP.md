# Geil oder? — Master Roadmap (30 Tage)

## Zielbild

Vollautomatisierte, faceless Deal-Media-Brand. Täglich Deals importieren, bewerten, als hochwertige Carousels/Stories/Reels rendern, posten. Affiliate-Einnahmen durch Klick-Tracking.

---

## Tech Stack (Zero Budget)

| Layer | Tool | Kosten |
|---|---|---|
| Framework | Next.js 14 + TypeScript + Tailwind | free |
| Datenbank | Supabase free tier (500MB PostgreSQL + 1GB Storage) | free |
| Hosting | Vercel hobby | free |
| KI Copy | Google Gemini 1.5 Flash API (Google AI Studio) | free |
| Slide Rendering | Playwright (headless Chrome) | free |
| Video | FFmpeg | free |
| Automation | GitHub Actions (2000 min/month) | free |
| Posting | Buffer free (3 Kanäle) / manuell | free |
| Analytics | Supabase clicks table | free |
| Domain | `geiloder.vercel.app` → später `geiloder.de` (~5€/Jahr) | ~5€ |

---

## Was DU einmalig einrichten musst (externe Accounts)

Diese Schritte kannst nur du selbst machen — ich kann keine externen Accounts erstellen.

### Einmalig (Woche 1)

- [ ] **GitHub** — Account + neues Repo `geiloder` erstellen (kostenlos)
- [ ] **Vercel** — Account mit GitHub verbinden (kostenlos), Hobby-Plan
- [ ] **Supabase** — Account erstellen, Projekt `geiloder` anlegen (kostenlos)
- [ ] **Google AI Studio** — API Key für Gemini 1.5 Flash holen: https://aistudio.google.com → `Get API key` (kostenlos, kein Payment nötig)
- [ ] **Awin** — Publisher-Account anlegen: https://www.awin.com/de (kostenlos)
- [ ] **ADCELL** — Publisher-Account anlegen: https://www.adcell.de (kostenlos)

### Innerhalb Woche 1-2

- [ ] **Instagram** — Business Account: `@geiloder.deals`
- [ ] **TikTok** — Creator Account: `@geiloder.deals`
- [ ] **Pinterest** — Business Account: `@geiloder.deals`
- [ ] **YouTube** — Kanal: `Geil oder?`
- [ ] **Buffer** — Free Account (3 Kanäle): https://buffer.com

### API Keys / Secrets (für .env.local und GitHub Secrets)

```
NEXT_PUBLIC_SUPABASE_URL=        # aus Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # aus Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=       # aus Supabase Dashboard → Settings → API
GEMINI_API_KEY=                  # aus Google AI Studio
ADMIN_PASSWORD=                  # selbst festlegen (z.B. "geilerpass2025")
```

---

## Architektur-Überblick

```
GitHub Actions (tägl. 06:00 Uhr)
  → Feed Import (Awin/ADCELL CSV)
  → Deal Scoring
  → Copy Generation (Gemini API)
  → Slide Rendering (Playwright → PNG)
  → Upload zu Supabase Storage
  → Approval Queue befüllen

Vercel (Next.js Website)
  → Admin Dashboard → Approve / Reject / Download
  → Öffentliche Website mit Deal Pages
  → /go/[id] → Click Tracking → Affiliate Redirect

Du (manuell)
  → Assets aus Admin herunterladen
  → Auf Instagram/TikTok posten
  → Oder via Buffer schedulen
```

---

## 10 Pläne — Übersicht

| # | Plan | Inhalt | Tage |
|---|---|---|---|
| 1 | [Foundation](docs/superpowers/plans/2026-04-27-01-foundation.md) | Git, Next.js, Supabase, Vercel | 1–2 |
| 2 | [Database & Feed Importer](docs/superpowers/plans/2026-04-27-02-database-feed-importer.md) | Schema, Awin/ADCELL Parser, Normalisierung | 3–5 |
| 3 | [Deal Scoring](docs/superpowers/plans/2026-04-27-03-deal-scoring.md) | Scoring-Algorithmus, Anti-Spam | 6–7 |
| 4 | [AI Copy Generator](docs/superpowers/plans/2026-04-27-04-ai-copy-generator.md) | Gemini API, Prompts, Compliance | 8–10 |
| 5 | [Creative Pipeline](docs/superpowers/plans/2026-04-27-05-creative-pipeline.md) | HTML/CSS Templates, Playwright Renderer | 11–15 |
| 6 | [Video Generator](docs/superpowers/plans/2026-04-27-06-video-generator.md) | FFmpeg, Reels/TikTok/Shorts | 16–17 |
| 7 | [Website & Redirects](docs/superpowers/plans/2026-04-27-07-website.md) | Deal Pages, SEO, Legal, /go/ Tracking | 18–20 |
| 8 | [Admin Dashboard](docs/superpowers/plans/2026-04-27-08-admin-dashboard.md) | Approve/Reject, Preview, Download | 21–23 |
| 9 | [Automation & Cron](docs/superpowers/plans/2026-04-27-09-automation.md) | GitHub Actions, tägliche Pipeline | 24–26 |
| 10 | [Analytics Dashboard](docs/superpowers/plans/2026-04-27-10-analytics.md) | Klick-Tracking, Performance, Optimierung | 27–30 |

---

## Execution-Reihenfolge

Jeder Plan baut auf dem vorherigen auf. Strikt in dieser Reihenfolge ausführen.

Plan 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

---

## Minimum Viable Launch (Tag 25)

Nach Plan 1–8 ist folgendes funktionsfähig:
- Feeds werden täglich importiert
- Top Deals werden gescort und ausgewählt
- Copy wird generiert (Gemini)
- 4-Slide Carousels werden gerendert
- Du kannst im Admin Dashboard approven + herunterladen
- Website zeigt Deals mit Redirect-Tracking
- Klicks werden getrackt

Das ist der Soft Launch.
