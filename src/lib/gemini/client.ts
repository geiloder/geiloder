import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// Lazy: read env at call time, not module load time (dotenv may not have run yet)
function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  })
}

export async function generateWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  const geminiFlash = getModel()
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiFlash.generateContent(prompt)
      const text = result.response.text()
      if (!text) throw new Error('Empty response from Gemini')
      return text
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error
      // Respect API's suggested retry delay if available
      const retryDelaySec = extractRetryDelay(error)
      const waitMs = retryDelaySec ? retryDelaySec * 1000 + 1000 : 10000
      console.warn(`Gemini attempt ${attempt} failed, retrying in ${Math.round(waitMs / 1000)}s...`)
      await new Promise((r) => setTimeout(r, waitMs))
    }
  }
  throw new Error('Gemini: max retries exceeded')
}

function extractRetryDelay(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null
  const details = (error as { errorDetails?: { '@type'?: string; retryDelay?: string }[] }).errorDetails
  if (!Array.isArray(details)) return null
  for (const d of details) {
    if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
      return parseInt(d.retryDelay)
    }
  }
  return null
}
