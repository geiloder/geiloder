'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  dealId: string
}

const SLIDE_LABELS = ['Slide 1 – Hero', 'Slide 2 – Benefits', 'Slide 3 – CTA', 'Slide 4 – Humor']

export function SlideUploadForm({ dealId }: Props) {
  const [files, setFiles] = useState<(File | null)[]>([null, null, null, null])
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function handleFile(index: number, file: File | null) {
    if (!file) return
    const newFiles = [...files]
    newFiles[index] = file
    setFiles(newFiles)

    const newPreviews = [...previews]
    newPreviews[index] = URL.createObjectURL(file)
    setPreviews(newPreviews)
  }

  async function handleUpload() {
    if (files.some((f) => !f)) {
      setError('Bitte alle 4 Slides hochladen')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.set('dealId', dealId)
    files.forEach((f, i) => { if (f) formData.set(`slide${i + 1}`, f) })

    const res = await fetch('/api/admin/deals/upload-slides', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setDone(true)
    } else {
      const data = await res.json() as { error: string }
      setError(data.error ?? 'Upload fehlgeschlagen')
    }
    setUploading(false)
  }

  if (done) {
    return (
      <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-lg text-center">
        <p className="text-green-400 font-bold text-lg">✓ Slides hochgeladen</p>
        <p className="text-zinc-400 text-sm mt-1">Deal ist jetzt ready zum Posten.</p>
        <a href="/admin/deals?status=rendered" className="mt-3 inline-block text-sm text-green-400 underline">
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
