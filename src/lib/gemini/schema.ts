import { z } from 'zod'

export const DealCopySchema = z.object({
  headline: z.string().max(50),
  subheadline: z.string().max(30),
  benefit_1: z.string().max(30),
  benefit_1_detail: z.string().max(60),
  benefit_2: z.string().max(30),
  benefit_2_detail: z.string().max(60),
  benefit_3: z.string().max(30),
  benefit_3_detail: z.string().max(60),
  cta: z.string().max(30),
  caption: z.string().min(50).max(800),
  hashtags: z.array(z.string()).min(3).max(15),
  humor_intro: z.string().max(60),
  humor_konsequenz_1: z.string().max(60),
  humor_konsequenz_2: z.string().max(60),
  humor_konsequenz_3: z.string().max(60),
  humor_cta: z.string().max(50),
})

export type DealCopyOutput = z.infer<typeof DealCopySchema>

export function parseDealCopyResponse(jsonText: string): DealCopyOutput {
  let parsed: unknown
  try {
    const cleaned = jsonText.replace(/^```json\n?|\n?```$/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`JSON parse error: ${jsonText.slice(0, 200)}`)
  }
  return DealCopySchema.parse(parsed)
}
