'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  dealId: string
  initialReady?: boolean
  initialPosted?: boolean
}

const SLIDE_LABELS = ['Slide 1 – Hero', 'Slide 2 – Benefits', 'Slide 3 – CTA', 'Slide 4 – Humor']

export function SlideUploadForm({ dealId, initialReady = false, initialPosted = false }: Props) {
  const [files, setFiles] = useState<(File | null)[]>([null, null, null, null])
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(initialReady)
  const [posted, setPosted] = useState(initialPosted)
  const [posting, setPosting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function handleFile(index: number, file: File | null) {
    if (!file) return
    const newFiles = [...files]
    newFiles[index] = file
    setFiles(newFiles)

    const newPreviews = [...previews]
    newPreviews[index] = URL.createObjectURL(file)
    setPreviews(newPreviews)
  }

  function startSlideReplacement() {
    setFiles([null, null, null, null])
    setPreviews([null, null, null, null])
    setError('')
    setDone(false)
  }

  async function handleUpload() {
    if (files.some((f) => !f)) {
      setError('Bitte alle 4 Slides hochladen')
      return
    }

    setUploading(true)
    setError('')
    setNotice('')

    try {
      const formData = new FormData()
      formData.set('dealId', dealId)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue
        const optimized = await optimizeSlide(file, i)
        formData.set(`slide${i + 1}`, optimized)
      }

      const firstSlide = files[0]
      if (firstSlide) {
        formData.set('story1', await createStoryFromSlide(firstSlide))
      }

      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 60_000)

      const res = await fetch('/api/admin/deals/upload-slides', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      window.clearTimeout(timeout)

      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json().catch(() => null) as { error?: string } | null
        setError(data?.error ?? 'Upload fehlgeschlagen')
      }
    } catch (err) {
      setError(err instanceof Error && err.name === 'AbortError'
        ? 'Upload dauert zu lange. Bitte Seite neu laden und erneut versuchen.'
        : 'Upload fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.')
    } finally {
      setUploading(false)
    }
  }

  async function handlePublish() {
    setPosting(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch('/api/admin/posts/publish-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })

      if (res.ok) {
        setPosted(true)
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Instagram-Post fehlgeschlagen')
      }
    } catch {
      setError('Instagram-Post fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setPosting(false)
    }
  }

  async function handleResetPublishedPost() {
    const confirmed = window.confirm(
      'Diesen Post in der App zurücksetzen? Er verschwindet von der Website. Den Instagram-Post musst du danach in Instagram selbst löschen.',
    )
    if (!confirmed) return

    setResetting(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch('/api/admin/posts/reset-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })
      const data = await res.json().catch(() => null) as {
        error?: string
        manualInstagramDeletionRequired?: boolean
      } | null

      if (res.ok) {
        setPosted(false)
        startSlideReplacement()
        setNotice(data?.manualInstagramDeletionRequired
          ? 'Aus der Website entfernt. Bitte den Instagram-Post zusätzlich direkt in Instagram löschen und lade danach neue Slides hoch.'
          : 'Post wurde in der App zurückgesetzt. Du kannst jetzt neue Slides hochladen.')
      } else {
        setError(data?.error ?? 'Zurücksetzen fehlgeschlagen')
      }
    } catch {
      setError('Zurücksetzen fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setResetting(false)
    }
  }

  if (done) {
    return (
      <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-lg text-center space-y-3">
        <div>
          <p className="text-green-400 font-bold text-lg">
            {posted ? '✓ Auf Instagram gepostet' : '✓ Slides hochgeladen'}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            {posted ? 'Der Carousel-Post ist veröffentlicht.' : 'Deal ist jetzt ready zum Posten.'}
          </p>
        </div>

        {notice && <p className="text-yellow-300 text-sm">{notice}</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!posted && (
          <div className="space-y-2">
            <button
              onClick={handlePublish}
              disabled={posting}
              className="w-full bg-green-400 hover:bg-green-300 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-40"
            >
              {posting ? 'Poste auf Instagram...' : 'Auf Instagram posten'}
            </button>
            <button
              onClick={startSlideReplacement}
              disabled={posting}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-lg transition-colors disabled:opacity-40"
            >
              Andere Slides hochladen
            </button>
          </div>
        )}

        {posted && (
          <button
            onClick={handleResetPublishedPost}
            disabled={resetting}
            className="w-full bg-red-400/15 hover:bg-red-400/25 text-red-300 border border-red-400/30 font-bold py-3 rounded-lg transition-colors disabled:opacity-40"
          >
            {resetting ? 'Setze zurück...' : 'Post zurücksetzen / von Website entfernen'}
          </button>
        )}

        <a href="/admin/deals?status=rendered" className="inline-block text-sm text-green-400 underline">
          Zurück zur Deal-Liste →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SLIDE_LABELS.map((label, i) => (
          <label key={label} className="cursor-pointer block">
            <div className={`relative aspect-[4/5] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${previews[i] ? 'border-green-400' : 'border-zinc-700 hover:border-zinc-500'}`}>
              {previews[i] ? (
                <Image src={previews[i]!} alt={label} fill className="object-cover rounded-lg" sizes="200px" />
              ) : (
                <div className="text-center p-2">
                  <p className="text-2xl">+</p>
                  <p className="text-xs text-zinc-500 mt-1">{label}</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => handleFile(i, e.target.files?.[0] ?? null)}
            />
          </label>
        ))}
      </div>

      {notice && <p className="text-yellow-300 text-sm">{notice}</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={uploading || files.some((f) => !f)}
        className="w-full bg-green-400 hover:bg-green-300 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-40"
      >
        {uploading ? 'Uploading...' : `${files.filter(Boolean).length}/4 Slides hochladen`}
      </button>
    </div>
  )
}

async function optimizeSlide(file: File, index: number): Promise<File> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bild konnte nicht vorbereitet werden')

  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = (canvas.width - width) / 2
  const y = (canvas.height - height) / 2
  ctx.drawImage(image, x, y, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('Bild konnte nicht komprimiert werden')

  return new File([blob], `carousel-slide-${index + 1}.jpg`, { type: 'image/jpeg' })
}

async function createStoryFromSlide(file: File): Promise<File> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Story konnte nicht vorbereitet werden')

  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawCoverImage(ctx, image, canvas.width, canvas.height, {
    filter: 'blur(34px) brightness(0.42) saturate(1.25)',
  })

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, 'rgba(0,0,0,0.42)')
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.08)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const safeTop = 190
  const safeBottom = 390
  const maxWidth = canvas.width - 96
  const maxHeight = canvas.height - safeTop - safeBottom
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height)
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const x = Math.round((canvas.width - width) / 2)
  const y = Math.round(safeTop + (maxHeight - height) / 2)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
  ctx.shadowBlur = 42
  ctx.shadowOffsetY = 18
  roundRect(ctx, x, y, width, height, 26)
  ctx.fillStyle = '#050505'
  ctx.fill()
  ctx.clip()
  ctx.drawImage(image, x, y, width, height)
  ctx.restore()

  ctx.strokeStyle = 'rgba(163, 255, 18, 0.22)'
  ctx.lineWidth = 3
  roundRect(ctx, x + 1.5, y + 1.5, width - 3, height - 3, 24)
  ctx.stroke()

  drawStoryProfileCta(ctx, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) throw new Error('Story konnte nicht komprimiert werden')

  return new File([blob], 'story-slide-1.jpg', { type: 'image/jpeg' })
}

function drawStoryProfileCta(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
  const width = 760
  const height = 116
  const x = (canvasWidth - width) / 2
  const y = canvasHeight - 320

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 12
  roundRect(ctx, x, y, width, height, 34)
  ctx.fillStyle = 'rgba(5, 5, 5, 0.88)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(163, 255, 18, 0.78)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = '#a3ff12'
  ctx.font = '900 30px Arial, Helvetica, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('NEUER POST LIVE', canvasWidth / 2, y + 39)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 38px Arial, Helvetica, sans-serif'
  ctx.fillText('Zum Beitrag im Profil', canvasWidth / 2, y + 78)
  ctx.restore()
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  options?: { filter?: string },
) {
  const scale = Math.max(canvasWidth / image.width, canvasHeight / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = (canvasWidth - width) / 2
  const y = (canvasHeight - height) / 2

  ctx.save()
  if (options?.filter) ctx.filter = options.filter
  ctx.drawImage(image, x, y, width, height)
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    image.src = src
  })
}
