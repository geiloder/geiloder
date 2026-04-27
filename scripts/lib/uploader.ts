import { createServiceClient } from '../../src/lib/supabase/server'

export async function uploadSlideToStorage(
  dealId: string,
  slideNumber: number,
  format: 'feed' | 'story',
  pngBuffer: Buffer
): Promise<string> {
  const supabase = createServiceClient()
  const storagePath = `deals/${dealId}/slide${slideNumber}_${format}.png`

  const { error } = await supabase.storage
    .from('assets')
    .upload(storagePath, pngBuffer, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadVideoToStorage(
  dealId: string,
  format: 'reel' | 'story',
  videoBuffer: Buffer
): Promise<string> {
  const supabase = createServiceClient()
  const storagePath = `deals/${dealId}/video_${format}.mp4`

  const { error } = await supabase.storage
    .from('assets')
    .upload(storagePath, videoBuffer, { contentType: 'video/mp4', upsert: true })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
  return data.publicUrl
}
