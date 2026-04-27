# Creative Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zweigleisige Creative-Pipeline je nach Deal-Tier. Story-Deals (Score 50–69) werden vollautomatisch mit HTML/CSS + Playwright gerendert. Carousel-Deals (Score ≥70) bekommen automatisch Story-Slides + einen fertigen ChatGPT-Prompt mit dem der User manuell 4 GPT-image-2.0-Slides erstellt und hochlädt.

**Architecture:**

```
Score ≥ 70 (Carousel-Deal):
  → Playwright rendert Story-Format (1080×1920) automatisch — für Instagram Stories
  → Admin zeigt ChatGPT-Prompt + Produktbild-Download
  → User erstellt 4 Feed-Slides (1080×1350) mit GPT image gen 2.0 in ChatGPT
  → User lädt 4 PNGs hoch → System speichert in Supabase Storage

Score 50–69 (Story-Deal):
  → Playwright rendert nur Story-Format (1080×1920) automatisch
  → Kein Carousel nötig
```

Jede Slide ist ein eigenständiges HTML-File (dynamisch befüllt via Template-Strings). Playwright startet headless Chrome auf GitHub Actions Runner. Assets landen in Supabase Storage Bucket `assets/{deal_id}/`. CSS-Backgrounds für den automatischen Story-Render.

**Tech Stack:** Playwright, TypeScript, Node.js FS, Supabase Storage

---

## File Structure

```
/
├── templates/
│   ├── styles/
│   │   ├── supplement.css      # Dark/Neon/Grün Style
│   │   ├── gym.css             # Schwarz/Rot Style
│   │   └── clean.css           # Clean/Minimal Style
│   ├── slide1-hero.html
│   ├── slide2-benefits.html
│   ├── slide3-cta.html
│   └── slide4-humor.html
├── scripts/
│   ├── render-slides.ts
│   └── lib/
│       └── uploader.ts
```

---

### Task 1: CSS-Styles für Kategorien

**Files:**
- Create: `templates/styles/supplement.css`, `templates/styles/gym.css`, `templates/styles/clean.css`

- [ ] **Step 1: Supplement Style (Dark/Neon)**

`templates/styles/supplement.css`:

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --accent: #39ff14;
  --accent-soft: #2adf10;
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --text-accent: #39ff14;
  --badge-bg: #39ff14;
  --badge-text: #0a0a0f;
  --card-bg: rgba(255,255,255,0.05);
  --border: rgba(57,255,20,0.2);
}

body {
  margin: 0;
  font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

.bg-gradient {
  background: radial-gradient(ellipse at 20% 50%, rgba(57,255,20,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(57,255,20,0.08) 0%, transparent 40%),
              linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0f0f18 100%);
}

.brand-tag {
  background: var(--badge-bg);
  color: var(--badge-text);
  font-weight: 900;
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 2px;
  display: inline-block;
}

.discount-badge {
  background: var(--accent);
  color: #000;
  font-weight: 900;
  font-size: 52px;
  border-radius: 8px;
  padding: 8px 16px;
  line-height: 1;
  letter-spacing: -1px;
}

.product-name {
  font-size: 38px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -1px;
  text-transform: uppercase;
  color: var(--text-primary);
}

.product-variant {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.geil-oder-tag {
  font-size: 22px;
  font-weight: 900;
  color: var(--accent);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.cta-button {
  background: var(--accent);
  color: #000;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 14px 28px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: inline-block;
}

.footer-link {
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: 1px;
}

.benefit-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 10px;
}

.benefit-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.benefit-detail {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.humor-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.humor-konsequenz {
  font-size: 15px;
  color: var(--text-primary);
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.humor-konsequenz:last-child {
  border-bottom: none;
}
```

- [ ] **Step 2: Gym Style (Schwarz/Rot)**

`templates/styles/gym.css`:

```css
:root {
  --bg-primary: #080808;
  --bg-secondary: #111111;
  --accent: #e63946;
  --accent-soft: #c1121f;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-accent: #e63946;
  --badge-bg: #e63946;
  --badge-text: #ffffff;
  --card-bg: rgba(255,255,255,0.04);
  --border: rgba(230,57,70,0.25);
}

body {
  margin: 0;
  font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

.bg-gradient {
  background: radial-gradient(ellipse at 70% 30%, rgba(230,57,70,0.12) 0%, transparent 50%),
              linear-gradient(160deg, #080808 0%, #0f0f0f 60%, #0a0a0a 100%);
}

.brand-tag {
  background: var(--badge-bg);
  color: var(--badge-text);
  font-weight: 900;
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 2px;
  display: inline-block;
}

.discount-badge {
  background: var(--accent);
  color: #fff;
  font-weight: 900;
  font-size: 52px;
  border-radius: 8px;
  padding: 8px 16px;
  line-height: 1;
  letter-spacing: -1px;
}

.product-name {
  font-size: 36px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -1px;
  text-transform: uppercase;
  color: var(--text-primary);
}

.product-variant {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.geil-oder-tag {
  font-size: 22px;
  font-weight: 900;
  color: var(--accent);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.cta-button {
  background: var(--accent);
  color: #fff;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 14px 28px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: inline-block;
}

.footer-link { font-size: 12px; color: var(--text-secondary); letter-spacing: 1px; }
.benefit-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; margin-bottom: 10px; }
.benefit-title { font-size: 20px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; }
.benefit-detail { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
.humor-text { font-size: 16px; line-height: 1.6; color: var(--text-secondary); }
.humor-konsequenz { font-size: 15px; color: var(--text-primary); padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.humor-konsequenz:last-child { border-bottom: none; }
```

- [ ] **Step 3: Clean Style (Minimal/White)**

`templates/styles/clean.css`:

```css
:root {
  --bg-primary: #f8f8f8;
  --bg-secondary: #ffffff;
  --accent: #1a1a2e;
  --accent-soft: #16213e;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-accent: #1a1a2e;
  --badge-bg: #1a1a2e;
  --badge-text: #ffffff;
  --card-bg: rgba(26,26,46,0.05);
  --border: rgba(26,26,46,0.15);
}

body {
  margin: 0;
  font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

.bg-gradient {
  background: linear-gradient(135deg, #f8f8f8 0%, #ffffff 50%, #f0f0f0 100%);
}

.brand-tag { background: var(--badge-bg); color: var(--badge-text); font-weight: 900; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; padding: 4px 12px; border-radius: 2px; display: inline-block; }
.discount-badge { background: var(--accent); color: #fff; font-weight: 900; font-size: 52px; border-radius: 8px; padding: 8px 16px; line-height: 1; letter-spacing: -1px; }
.product-name { font-size: 36px; font-weight: 900; line-height: 1.1; letter-spacing: -1px; text-transform: uppercase; color: var(--text-primary); }
.product-variant { font-size: 18px; color: var(--text-secondary); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
.geil-oder-tag { font-size: 22px; font-weight: 900; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; }
.cta-button { background: var(--accent); color: #fff; font-weight: 900; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; padding: 14px 28px; border-radius: 4px; border: none; cursor: pointer; display: inline-block; }
.footer-link { font-size: 12px; color: var(--text-secondary); letter-spacing: 1px; }
.benefit-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; margin-bottom: 10px; }
.benefit-title { font-size: 20px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; }
.benefit-detail { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
.humor-text { font-size: 16px; line-height: 1.6; color: var(--text-secondary); }
.humor-konsequenz { font-size: 15px; color: var(--text-primary); padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
```

---

### Task 2: HTML Slide-Templates

**Files:**
- Create: `templates/slide1-hero.html`, `templates/slide2-benefits.html`, `templates/slide3-cta.html`, `templates/slide4-humor.html`

- [ ] **Step 1: Slide 1 — Hero**

`templates/slide1-hero.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080">
<title>Slide 1</title>
<link rel="stylesheet" href="{{STYLE_PATH}}">
<style>
* { box-sizing: border-box; }
html, body { width: 1080px; height: {{HEIGHT}}px; overflow: hidden; }
.slide {
  width: 1080px;
  height: {{HEIGHT}}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 60px 40px;
  position: relative;
}
.product-image-area {
  position: absolute;
  right: 0;
  top: 0;
  width: 45%;
  height: 100%;
  overflow: hidden;
}
.product-image-area img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  padding: 60px 40px;
}
.product-image-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 65%;
  height: 100%;
  background: linear-gradient(to right, var(--bg-primary) 55%, transparent 100%);
}
.content {
  position: relative;
  z-index: 2;
  max-width: 55%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.top-section { display: flex; flex-direction: column; gap: 20px; padding-top: 10px; }
.middle-section { display: flex; flex-direction: column; gap: 16px; }
.bottom-section { display: flex; flex-direction: column; gap: 8px; }
.scarcity { font-size: 13px; color: var(--text-secondary); letter-spacing: 1px; text-transform: uppercase; }
.divider { width: 40px; height: 2px; background: var(--accent); margin: 8px 0; }
</style>
</head>
<body class="bg-gradient">
<div class="slide">
  {{#if PRODUKTBILD_URL}}
  <div class="product-image-area">
    <img src="{{PRODUKTBILD_URL}}" alt="{{PRODUKTNAME}}" onerror="this.style.display='none'">
  </div>
  <div class="product-image-overlay"></div>
  {{/if}}
  <div class="content">
    <div class="top-section">
      <div><span class="brand-tag">TOP DEAL</span></div>
      <div>
        <div class="product-name">{{HEADLINE}}</div>
        <div class="product-variant">{{SUBHEADLINE}}</div>
      </div>
    </div>
    <div class="middle-section">
      <div class="discount-badge">{{RABATT}}</div>
      <div class="scarcity">{{VERFUEGBARKEIT}}</div>
      <div class="divider"></div>
      <div class="geil-oder-tag">Geil oder?</div>
    </div>
    <div class="bottom-section">
      <div><span class="cta-button">JETZT DEAL ANSEHEN</span></div>
      <div class="footer-link">🔗 Link im Profil • @geiloder.deals</div>
    </div>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 2: Slide 2 — Benefits**

`templates/slide2-benefits.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080">
<title>Slide 2</title>
<link rel="stylesheet" href="{{STYLE_PATH}}">
<style>
* { box-sizing: border-box; }
html, body { width: 1080px; height: {{HEIGHT}}px; overflow: hidden; }
.slide {
  width: 1080px;
  height: {{HEIGHT}}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px;
}
.section-tag { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; }
.section-title { font-size: 34px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 30px; }
.benefits { display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: center; }
.footer { padding-top: 20px; }
</style>
</head>
<body class="bg-gradient">
<div class="slide">
  <div>
    <div class="section-tag">Warum ist das geil?</div>
    <div class="section-title">WARUM DER DEAL<br>GEIL IST</div>
  </div>
  <div class="benefits">
    <div class="benefit-card">
      <div class="benefit-title">{{BENEFIT_1}}</div>
      <div class="benefit-detail">{{BENEFIT_1_DETAIL}}</div>
    </div>
    <div class="benefit-card">
      <div class="benefit-title">{{BENEFIT_2}}</div>
      <div class="benefit-detail">{{BENEFIT_2_DETAIL}}</div>
    </div>
    <div class="benefit-card">
      <div class="benefit-title">{{BENEFIT_3}}</div>
      <div class="benefit-detail">{{BENEFIT_3_DETAIL}}</div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-link">🔗 Link im Profil • @geiloder.deals</div>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 3: Slide 3 — CTA**

`templates/slide3-cta.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080">
<title>Slide 3</title>
<link rel="stylesheet" href="{{STYLE_PATH}}">
<style>
* { box-sizing: border-box; }
html, body { width: 1080px; height: {{HEIGHT}}px; overflow: hidden; }
.slide {
  width: 1080px;
  height: {{HEIGHT}}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
  gap: 28px;
}
.live-tag { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: var(--text-secondary); }
.live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-right: 6px; }
.deal-title { font-size: 40px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; line-height: 1.1; }
.deal-detail { font-size: 20px; color: var(--text-secondary); }
.divider-line { width: 60px; height: 2px; background: var(--accent); }
.follow-text { font-size: 16px; color: var(--text-secondary); line-height: 1.6; }
.handle { color: var(--accent); font-weight: 700; }
.link-hint { font-size: 13px; color: var(--text-secondary); }
</style>
</head>
<body class="bg-gradient">
<div class="slide">
  <div class="live-tag"><span class="live-dot"></span>DEAL LIVE</div>
  <div class="deal-title">{{RABATT}} AUF<br>{{HEADLINE}}</div>
  <div class="divider-line"></div>
  <div><span class="cta-button">{{CTA}}</span></div>
  <div class="link-hint">Link im Profil oder in der Story</div>
  <div class="follow-text">
    Folge <span class="handle">@geiloder.deals</span><br>
    für tägliche Fitness-Deals
  </div>
</div>
</body>
</html>
```

- [ ] **Step 4: Slide 4 — Humor**

`templates/slide4-humor.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080">
<title>Slide 4</title>
<link rel="stylesheet" href="{{STYLE_PATH}}">
<style>
* { box-sizing: border-box; }
html, body { width: 1080px; height: {{HEIGHT}}px; overflow: hidden; }
.slide {
  width: 1080px;
  height: {{HEIGHT}}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px;
}
.intro-text { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 10px; }
.sub-intro { font-size: 15px; color: var(--text-secondary); margin-bottom: 30px; }
.consequences { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 0; }
.konsequenz-number { font-size: 11px; color: var(--text-accent); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; font-weight: 700; }
.footer-area { display: flex; flex-direction: column; gap: 12px; padding-top: 20px; }
.footer-cta { font-size: 18px; font-weight: 900; color: var(--text-primary); text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body class="bg-gradient">
<div class="slide">
  <div>
    <div class="intro-text">{{HUMOR_INTRO}}</div>
    <div class="sub-intro">dann warten diese Schicksale auf dich:</div>
  </div>
  <div class="consequences">
    <div class="humor-konsequenz">
      <div class="konsequenz-number">01</div>
      {{HUMOR_KONSEQUENZ_1}}
    </div>
    <div class="humor-konsequenz">
      <div class="konsequenz-number">02</div>
      {{HUMOR_KONSEQUENZ_2}}
    </div>
    <div class="humor-konsequenz">
      <div class="konsequenz-number">03</div>
      {{HUMOR_KONSEQUENZ_3}}
    </div>
  </div>
  <div class="footer-area">
    <div class="footer-cta">{{HUMOR_CTA}}</div>
    <div class="footer-link">🔗 Deal im Profil oder in der Story • Folge @geiloder.deals</div>
  </div>
</div>
</body>
</html>
```

---

### Task 3: Template-Renderer

**Files:**
- Create: `scripts/render-slides.ts`, `scripts/lib/uploader.ts`

- [ ] **Step 1: Supabase Uploader**

`scripts/lib/uploader.ts`:

```typescript
import { createServiceClient } from '../../src/lib/supabase/server'
import { readFileSync } from 'fs'
import path from 'path'

export async function uploadSlideToStorage(
  dealId: string,
  slideNumber: number,
  format: 'feed' | 'story',
  pngBuffer: Buffer
): Promise<string> {
  const supabase = createServiceClient()
  const fileName = `slide${slideNumber}_${format}.png`
  const storagePath = `deals/${dealId}/${fileName}`

  const { error } = await supabase.storage
    .from('assets')
    .upload(storagePath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadVideoToStorage(
  dealId: string,
  format: 'reel' | 'story',
  videoBuffer: Buffer
): Promise<string> {
  const supabase = createServiceClient()
  const fileName = `video_${format}.mp4`
  const storagePath = `deals/${dealId}/${fileName}`

  const { error } = await supabase.storage
    .from('assets')
    .upload(storagePath, videoBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
  return data.publicUrl
}
```

- [ ] **Step 2: Template-Rendering-Funktion**

`scripts/render-slides.ts`:

```typescript
import 'dotenv/config'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { createServiceClient } from '../src/lib/supabase/server'
import { uploadSlideToStorage } from './lib/uploader'
import type { Deal, DealCopy, DealKategorie, PostAssets } from '../src/types'

const TEMPLATES_DIR = path.join(process.cwd(), 'templates')
const STYLES_DIR = path.join(TEMPLATES_DIR, 'styles')
const TEMP_DIR = path.join(process.cwd(), '.tmp-renders')

const FEED_SIZE = { width: 1080, height: 1350 }
const STORY_SIZE = { width: 1080, height: 1920 }

function getStyleForKategorie(kategorie: DealKategorie): string {
  if (['supplements', 'fitness'].includes(kategorie)) {
    return path.join(STYLES_DIR, 'supplement.css')
  }
  if (['home-gym', 'gadgets'].includes(kategorie)) {
    return path.join(STYLES_DIR, 'gym.css')
  }
  return path.join(STYLES_DIR, 'clean.css')
}

function fillTemplate(template: string, vars: Record<string, string>, size: { width: number; height: number }, stylePath: string): string {
  let html = template

  // Größe
  html = html.replace(/\{\{HEIGHT\}\}/g, size.height.toString())

  // Style-Pfad (absoluter file:// Pfad für Playwright)
  html = html.replace(/\{\{STYLE_PATH\}\}/g, `file://${stylePath}`)

  // Variablen ersetzen
  for (const [key, value] of Object.entries(vars)) {
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escaped)
  }

  // Conditional blocks {{#if VAR}}...{{/if}}
  html = html.replace(/\{\{#if ([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return vars[varName] ? content : ''
  })

  // Nicht ersetzte Variablen leeren
  html = html.replace(/\{\{[^}]+\}\}/g, '')

  return html
}

async function renderSlide(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  deal: Deal,
  copy: DealCopy,
  slideNumber: 1 | 2 | 3 | 4,
  size: { width: number; height: number }
): Promise<Buffer> {
  const templateFile = path.join(TEMPLATES_DIR, `slide${slideNumber}-${
    slideNumber === 1 ? 'hero' : slideNumber === 2 ? 'benefits' : slideNumber === 3 ? 'cta' : 'humor'
  }.html`)

  const template = readFileSync(templateFile, 'utf-8')
  const stylePath = getStyleForKategorie(deal.kategorie)

  const vars: Record<string, string> = {
    PRODUKTNAME: deal.produktname,
    MARKE: deal.marke ?? deal.shop,
    HEADLINE: copy.headline,
    SUBHEADLINE: copy.subheadline,
    BENEFIT_1: copy.benefit_1,
    BENEFIT_1_DETAIL: copy.benefit_1_detail,
    BENEFIT_2: copy.benefit_2,
    BENEFIT_2_DETAIL: copy.benefit_2_detail,
    BENEFIT_3: copy.benefit_3,
    BENEFIT_3_DETAIL: copy.benefit_3_detail,
    CTA: copy.cta,
    HUMOR_INTRO: copy.humor_intro,
    HUMOR_KONSEQUENZ_1: copy.humor_konsequenz_1,
    HUMOR_KONSEQUENZ_2: copy.humor_konsequenz_2,
    HUMOR_KONSEQUENZ_3: copy.humor_konsequenz_3,
    HUMOR_CTA: copy.humor_cta,
    RABATT: deal.rabatt_prozent ? `-${Math.round(deal.rabatt_prozent)}%` : 'DEAL',
    VERFUEGBARKEIT: deal.verfuegbarkeit ? `Noch ${deal.verfuegbarkeit} verfügbar` : '',
    PRODUKTBILD_URL: deal.produktbild_url ?? '',
  }

  const html = fillTemplate(template, vars, size, stylePath)

  // Temp-Datei schreiben (Playwright öffnet file://)
  mkdirSync(TEMP_DIR, { recursive: true })
  const tempFile = path.join(TEMP_DIR, `render_${deal.id}_${slideNumber}_${size.width}x${size.height}.html`)
  writeFileSync(tempFile, html)

  const page = await browser.newPage()
  await page.setViewportSize(size)
  await page.goto(`file://${tempFile}`)
  await page.waitForLoadState('networkidle')

  // Warte auf Produktbild falls vorhanden
  if (deal.produktbild_url) {
    await page.waitForTimeout(500)
  }

  const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, ...size } })
  await page.close()

  return buffer as Buffer
}

async function renderAllSlides(deal: Deal, copy: DealCopy, browser: Awaited<ReturnType<typeof chromium.launch>>): Promise<PostAssets> {
  const feedAssets: string[] = []
  const storyAssets: string[] = []

  for (const slideNumber of [1, 2, 3, 4] as const) {
    console.log(`    Rendering slide ${slideNumber} (feed)...`)
    const feedBuffer = await renderSlide(browser, deal, copy, slideNumber, FEED_SIZE)
    const feedUrl = await uploadSlideToStorage(deal.id, slideNumber, 'feed', feedBuffer)
    feedAssets.push(feedUrl)

    console.log(`    Rendering slide ${slideNumber} (story)...`)
    const storyBuffer = await renderSlide(browser, deal, copy, slideNumber, STORY_SIZE)
    const storyUrl = await uploadSlideToStorage(deal.id, slideNumber, 'story', storyBuffer)
    storyAssets.push(storyUrl)
  }

  return { slides: feedAssets, story: storyAssets }
}

async function renderApprovedDeals() {
  const supabase = createServiceClient()

  // Deals mit Copy aber noch nicht rendered
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'approved')
    .not('copy_data', 'is', null)
    .order('deal_score', { ascending: false })
    .limit(20)

  if (error) throw error

  const deals = (data ?? []) as Deal[]
  console.log(`Rendering ${deals.length} deals...`)

  if (deals.length === 0) {
    console.log('No deals to render.')
    return
  }

  const browser = await chromium.launch({ headless: true })

  try {
    for (const deal of deals) {
      console.log(`  Rendering: ${deal.produktname.slice(0, 50)}...`)
      const copy = deal.copy_data as DealCopy

      try {
        const assets = await renderAllSlides(deal, copy, browser)

        // Post-Eintrag erstellen
        await supabase.from('posts').insert({
          deal_id: deal.id,
          plattform: 'instagram',
          post_type: 'carousel',
          status: 'pending',
          assets,
        })

        await supabase.from('deals').update({ status: 'rendered' }).eq('id', deal.id)
        console.log(`  ✓ Rendered: ${deal.produktname.slice(0, 40)}`)
      } catch (renderError) {
        console.error(`  ✗ Render error for ${deal.id}:`, renderError)
      }
    }
  } finally {
    await browser.close()
  }

  console.log('Rendering complete.')
}

renderApprovedDeals().catch(console.error)
```

- [ ] **Step 3: package.json Script**

```json
"render": "tsx scripts/render-slides.ts"
```

- [ ] **Step 4: Test-Render ausführen**

```bash
npm run render
```

Expected output:
```
Rendering 2 deals...
  Rendering: More Creatine+ Gummies Green Apple...
    Rendering slide 1 (feed)...
    Rendering slide 1 (story)...
    Rendering slide 2 (feed)...
    ...
  ✓ Rendered: More Creatine+ Gummies Green Apple
Rendering complete.
```

- [ ] **Step 5: Ergebnis in Supabase Storage prüfen**

Supabase Dashboard → Storage → assets → deals/{deal_id}/: 8 PNG-Dateien sollen sichtbar sein (4 feed + 4 story).

- [ ] **Step 6: Visuellen Check machen**

Eine PNG-URL aus Storage kopieren und im Browser öffnen. Slide soll aussehen wie:
- Dunkler Hintergrund (supplement style)
- Produktname in CAPS
- Rabatt-Badge
- "Geil oder?" Text
- CTA Button

---

### Task 4: Commit

- [ ] **Step 1: Commit**

```bash
git add -A
git commit -m "feat: add HTML/CSS slide templates with Playwright renderer"
```

---

### Task 5: ChatGPT-Prompt-Generator

**Files:**
- Create: `src/lib/chatgpt-prompt.ts`

- [ ] **Step 1: Prompt-Generator-Funktion**

`src/lib/chatgpt-prompt.ts`:

```typescript
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
```

- [ ] **Step 2: Type-Check**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

---

**Plan abgeschlossen wenn:**
- `npm run render` läuft ohne Fehler
- Supabase Storage enthält Story-PNGs pro gerenderten Deal (`story/` Ordner)
- Deals haben `status='rendered'`
- PNGs sehen visuell korrekt aus (im Browser öffnen)
- `generateChatGptPrompt()` exportiert korrekt (Test: in Node REPL importieren)
- `npx tsc --noEmit` → keine Fehler
