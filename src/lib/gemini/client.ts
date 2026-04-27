import Groq from 'groq-sdk'

// Lazy init: read env at call time so dotenv has already run
function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function generateWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  const client = getClient()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      })

      const text = completion.choices[0]?.message?.content
      if (!text) throw new Error('Empty response from Groq')
      return text
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error
      const waitMs = isRateLimitError(error) ? 60000 : 5000
      console.warn(`Groq attempt ${attempt} failed, retrying in ${waitMs / 1000}s...`)
      await new Promise((r) => setTimeout(r, waitMs))
    }
  }
  throw new Error('Groq: max retries exceeded')
}

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const status = (error as { status?: number }).status
  return status === 429
}
