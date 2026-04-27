import { createServiceClient } from '../../src/lib/supabase/server'

export async function cacheProductImage(
  imageUrl: string,
  dealId: string
): Promise<string | null> {
  if (!imageUrl) return null

  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

    const buffer = Buffer.from(await response.arrayBuffer())

    if (buffer.byteLength < 5000) return null

    const supabase = createServiceClient()
    const storagePath = `products/${dealId}/product.${ext}`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType, upsert: true })

    if (error) {
      console.warn(`Image cache upload failed for ${dealId}: ${error.message}`)
      return null
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    return data.publicUrl
  } catch (err) {
    console.warn(`Image cache failed for ${dealId}:`, err)
    return null
  }
}
