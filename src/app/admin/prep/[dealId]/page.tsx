import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import { generateChatGptPrompt } from '@/lib/chatgpt-prompt'
import { formatPrice, formatDiscount } from '@/lib/utils'
import { CopyPromptButton } from '@/components/admin/copy-prompt-button'
import { SlideUploadForm } from '@/components/admin/slide-upload-form'
import { ImageUpdateForm } from '@/components/admin/image-update-form'
import type { Deal, DealCopy } from '@/types'

interface Props {
  params: Promise<{ dealId: string }>
}

export default async function DealPrepPage({ params }: Props) {
  const { dealId } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase.from('deals').select('*').eq('id', dealId).single()
  if (error || !data) notFound()

  const deal = data as Deal
  const copy = deal.copy_data as DealCopy | null

  if (!copy) {
    return (
      <div className="max-w-2xl p-8 bg-zinc-900 rounded-xl border border-zinc-800">
        <p className="text-red-400 font-bold">Kein Copy für diesen Deal generiert.</p>
        <p className="text-zinc-500 text-sm mt-2">Zuerst <code className="text-green-400">npm run generate:copy</code> ausführen.</p>
      </div>
    )
  }

  const prompt = generateChatGptPrompt(deal, copy)

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Deal Prep</h1>
        <p className="text-zinc-500 text-sm mt-1">{deal.produktname}</p>
      </div>

      {/* Bild setzen */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
        <h2 className="font-bold text-white">1. Produktbild setzen</h2>
        <p className="text-zinc-500 text-xs">URL eingeben oder Datei hochladen — wird in Supabase gespeichert und als Produktbild verwendet.</p>
        <ImageUpdateForm dealId={deal.id} currentUrl={deal.produktbild_url ?? null} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Produktbild */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <h2 className="font-bold text-white">2. Produktbild herunterladen</h2>
          {deal.produktbild_url ? (
            <>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={deal.produktbild_url}
                  alt={deal.produktname}
                  fill
                  className="object-contain p-4"
                  sizes="400px"
                />
              </div>
              <a
                href={deal.produktbild_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                ⬇ Produktbild herunterladen
              </a>
              <p className="text-xs text-zinc-500">Dieses Bild in ChatGPT hochladen wenn du den Prompt einfügst.</p>
            </>
          ) : (
            <div className="p-4 bg-zinc-800 rounded-lg text-zinc-500 text-sm">Noch kein Bild gesetzt — oben URL eingeben oder hochladen.</div>
          )}

          <div className="pt-2 border-t border-zinc-800 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">Preis</span>
              <span className="text-white font-bold">{formatPrice(deal.deal_preis)}</span>
            </div>
            {deal.alter_preis && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Alter Preis</span>
                <span className="text-zinc-500 line-through">{formatPrice(deal.alter_preis)}</span>
              </div>
            )}
            {deal.rabatt_prozent && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Rabatt</span>
                <span className="text-green-400 font-bold">{formatDiscount(deal.rabatt_prozent)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-400">Score</span>
              <span className="text-white">{deal.deal_score}</span>
            </div>
          </div>
        </div>

        {/* ChatGPT Prompt */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <h2 className="font-bold text-white">3. ChatGPT-Prompt kopieren</h2>
          <p className="text-zinc-500 text-xs">
            Prompt in ChatGPT einfügen → Produktbild hochladen → 4 Slides generieren lassen → als PNG herunterladen
          </p>
          <CopyPromptButton prompt={prompt} />
          <details className="mt-2">
            <summary className="text-xs text-zinc-500 cursor-pointer">Prompt vorschau</summary>
            <pre className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-800 p-3 rounded-lg max-h-64 overflow-y-auto">
              {prompt}
            </pre>
          </details>
        </div>
      </div>

      {/* Slide Upload */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h2 className="font-bold text-white mb-2">4. GPT-Slides hochladen</h2>
        <p className="text-zinc-500 text-sm mb-4">
          Die 4 von ChatGPT generierten Slides hier hochladen. Reihenfolge: Slide 1 (Hero) → Slide 2 (Benefits) → Slide 3 (CTA) → Slide 4 (Humor).
        </p>
        <SlideUploadForm dealId={deal.id} />
      </div>
    </div>
  )
}
