'use client'
import { useState } from 'react'

export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="w-full bg-green-400 hover:bg-green-300 text-black font-bold py-3 rounded-lg transition-colors"
    >
      {copied ? '✓ Kopiert!' : '📋 ChatGPT-Prompt kopieren'}
    </button>
  )
}
