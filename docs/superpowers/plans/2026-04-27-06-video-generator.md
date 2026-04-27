# Video Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FFmpeg konvertiert die 4 Slide-PNGs eines Deals automatisch in ein 8-Sekunden MP4-Video (Reels/TikTok/Shorts-Format). Jede Slide wird 2 Sekunden gezeigt mit leichtem Ken-Burns-Zoom-Effekt. Video wird in Supabase Storage hochgeladen.

**Architecture:** FFmpeg (via `fluent-ffmpeg` Node-Wrapper oder direkter `child_process` spawn). Input: 4 PNG-Dateien aus Supabase Storage (lokal gecacht). Output: H.264 MP4, 1080×1920, 30fps. Kein Audio (Instagram/TikTok erlauben Musik-Overlay beim Posten).

**Tech Stack:** FFmpeg, Node.js child_process, TypeScript

---

## Voraussetzung: FFmpeg installieren

- [ ] **macOS:**

```bash
brew install ffmpeg
# Prüfen:
ffmpeg -version
```

Expected: `ffmpeg version 7.x.x ...`

---

## File Structure

```
/
├── scripts/
│   ├── generate-video.ts
│   └── lib/
│       └── ffmpeg.ts
```

---

### Task 1: FFmpeg Video-Generator

**Files:**
- Create: `scripts/lib/ffmpeg.ts`

- [ ] **Step 1: FFmpeg-Hilfsfunktion**

`scripts/lib/ffmpeg.ts`:

```typescript
import { execSync } from 'child_process'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import path from 'path'

const TEMP_DIR = path.join(process.cwd(), '.tmp-video')

export interface VideoOptions {
  slidePaths: string[]   // 4 lokale PNG-Pfade
  outputPath: string     // Output MP4-Pfad
  width: number
  height: number
  durationPerSlide: number // Sekunden pro Slide (default: 2)
}

export function generateVideo(options: VideoOptions): void {
  const {
    slidePaths,
    outputPath,
    width,
    height,
    durationPerSlide = 2,
  } = options

  mkdirSync(path.dirname(outputPath), { recursive: true })

  if (slidePaths.length !== 4) {
    throw new Error(`Expected 4 slides, got ${slidePaths.length}`)
  }

  // Jede Slide: Ken-Burns Zoom (leicht rein zoomen von 1.0 auf 1.05)
  // zoompan Filter: z='min(zoom+0.0004,1.05)' — fährt in 2s von 1.0 auf ~1.05
  // fps=30, d=60 = 60 Frames = 2 Sekunden

  const fps = 30
  const framesPerSlide = fps * durationPerSlide

  // Filtercomplex für 4 Slides
  const filterParts: string[] = slidePaths.map((_, i) => {
    return `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,zoompan=z='min(zoom+0.0004,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${framesPerSlide}:fps=${fps}:s=${width}x${height}[v${i}]`
  })

  const concatInputs = slidePaths.map((_, i) => `[v${i}]`).join('')
  const filtercomplex = [
    ...filterParts,
    `${concatInputs}concat=n=4:v=1:a=0[out]`,
  ].join('; ')

  // Input-Argumente
  const inputArgs = slidePaths.flatMap((p) => ['-loop', '1', '-t', durationPerSlide.toString(), '-i', p])

  const cmd = [
    'ffmpeg',
    '-y', // Überschreiben
    ...inputArgs,
    '-filter_complex', `"${filtercomplex}"`,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-r', fps.toString(),
    outputPath,
  ].join(' ')

  console.log(`    Running FFmpeg...`)
  execSync(cmd, { stdio: 'pipe' })
}

export async function downloadFile(url: string, localPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  mkdirSync(path.dirname(localPath), { recursive: true })
  writeFileSync(localPath, buffer)
}
```

---

### Task 2: Video-Generator-Script

**Files:**
- Create: `scripts/generate-video.ts`

- [ ] **Step 1: Script schreiben**

`scripts/generate-video.ts`:

```typescript
import 'dotenv/config'
import path from 'path'
import { readFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { createServiceClient } from '../src/lib/supabase/server'
import { generateVideo, downloadFile } from './lib/ffmpeg'
import { uploadVideoToStorage } from './lib/uploader'
import type { Deal, Post, PostAssets } from '../src/types'

const TEMP_DIR = path.join(process.cwd(), '.tmp-video')

async function downloadSlides(assets: PostAssets, dealId: string): Promise<string[]> {
  const slides = assets.story ?? assets.slides ?? []
  if (slides.length < 4) throw new Error(`Not enough slides: ${slides.length}`)

  const localPaths: string[] = []

  for (let i = 0; i < 4; i++) {
    const url = slides[i]!
    const localPath = path.join(TEMP_DIR, dealId, `slide${i + 1}.png`)
    await downloadFile(url, localPath)
    localPaths.push(localPath)
  }

  return localPaths
}

async function generateVideoForDeal(deal: Deal, post: Post): Promise<string> {
  const assets = post.assets as PostAssets
  if (!assets) throw new Error('Post has no assets')

  // Story-Format für Reel (1080x1920) preferieren
  const slides = assets.story ?? assets.slides ?? []
  if (slides.length < 4) throw new Error('Less than 4 slides available')

  // Slides herunterladen
  const localSlides = await downloadSlides(assets, deal.id)

  const outputPath = path.join(TEMP_DIR, deal.id, 'reel.mp4')
  mkdirSync(path.join(TEMP_DIR, deal.id), { recursive: true })

  generateVideo({
    slidePaths: localSlides,
    outputPath,
    width: 1080,
    height: 1920,
    durationPerSlide: 2,
  })

  // Upload zu Supabase Storage
  const videoBuffer = readFileSync(outputPath)
  const videoUrl = await uploadVideoToStorage(deal.id, 'reel', videoBuffer)

  // Post-Assets aktualisieren
  const supabase = createServiceClient()
  const updatedAssets: PostAssets = {
    ...assets,
    video: videoUrl,
  }

  await supabase.from('posts').update({ assets: updatedAssets }).eq('id', post.id)

  return videoUrl
}

async function generateVideosForRenderedDeals() {
  const supabase = createServiceClient()

  // Rendered Deals die noch kein Video haben
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      deals!inner(*)
    `)
    .eq('post_type', 'carousel')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error

  const items = (posts ?? []) as Array<Post & { deals: Deal }>
  console.log(`Generating videos for ${items.length} deals...`)

  if (items.length === 0) {
    console.log('No deals need video generation.')
    return
  }

  mkdirSync(TEMP_DIR, { recursive: true })

  let success = 0
  let failed = 0

  for (const item of items) {
    const deal = item.deals
    const post = item as Post
    console.log(`  Generating video: ${deal.produktname.slice(0, 50)}...`)

    try {
      const videoUrl = await generateVideoForDeal(deal, post)
      console.log(`  ✓ Video: ${videoUrl.slice(-50)}`)
      success++
    } catch (err) {
      console.error(`  ✗ Error:`, err)
      failed++
    }
  }

  // Temp-Dateien aufräumen
  try {
    rmSync(TEMP_DIR, { recursive: true, force: true })
  } catch {}

  console.log(`\nVideo generation: ${success} success, ${failed} failed`)
}

generateVideosForRenderedDeals().catch(console.error)
```

- [ ] **Step 2: package.json Script**

```json
"generate:video": "tsx scripts/generate-video.ts"
```

- [ ] **Step 3: Test-Run**

```bash
npm run generate:video
```

Expected output:
```
Generating videos for 2 deals...
  Generating video: More Creatine+ Gummies Green Apple...
    Running FFmpeg...
  ✓ Video: .../deals/abc123/video_reel.mp4
Generating videos for 2 deals...
  ...
```

- [ ] **Step 4: Video prüfen**

Video-URL aus Supabase Storage kopieren und im Browser öffnen/abspielen. Soll sein:
- 8 Sekunden lang
- 4 Slides je 2 Sekunden
- Leichter Zoom-Effekt sichtbar
- 1080×1920 Format

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add FFmpeg video generator for Reels/TikTok/Shorts"
```

---

**Plan abgeschlossen wenn:**
- `npm run generate:video` läuft ohne Fehler
- Supabase Storage enthält `video_reel.mp4` für jeden Deal
- Video spielt korrekt ab (8s, 4 Slides, Zoom-Effekt)
- `npx tsc --noEmit` → keine Fehler
