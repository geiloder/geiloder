'use client'
import Image from 'next/image'
import { useState, useRef } from 'react'

interface Props {
  dealId: string
  currentUrl: string | null
}

export function ImageUpdateForm({ dealId, currentUrl }: Props) {
  const [url, setUrl] = useState(currentUrl ?? '')
  const [preview, setPreview] = useState(currentUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUrlSave(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setSuccess(false)
    const res = await fetch('/api/admin/deals/update-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, imageUrl: url.trim() }),
    })
    if (res.ok) {
      setPreview(url.trim())
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setSuccess(false)
    const form = new FormData()
    form.append('dealId', dealId)
    form.append('image', file)
    const res = await fetch('/api/admin/deals/update-image', { method: 'POST', body: form })
    if (res.ok) {
      const { url: newUrl } = await res.json()
      setUrl(newUrl)
      setPreview(newUrl)
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 max-w-xs">
          <Image src={preview} alt="" fill className="object-contain p-4" sizes="300px" unoptimized />
        </div>
      )}

      <form onSubmit={handleUrlSave} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/product.jpg"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
        >
          {loading ? '...' : 'URL speichern'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
        >
          {loading ? '...' : '⬆ Bild hochladen'}
        </button>
        <span className="text-xs text-zinc-500">oder Datei direkt hochladen (JPG, PNG, WebP)</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {success && <p className="text-green-400 text-sm">✓ Bild aktualisiert</p>}
    </div>
  )
}
