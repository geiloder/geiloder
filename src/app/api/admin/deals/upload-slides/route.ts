import { NextRequest, NextResponse } from 'next/server'
import { buildManualInstagramPostAssets } from '@/lib/admin/manual-post-assets'
import { createServiceClient } from '@/lib/supabase/server'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const dealId = formData.get('dealId') as string
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const supabase = createServiceClient()
  const slideUrls: string[] = []
  let storyUrl: string | null = null
  const uploadId = `${Date.now()}-${crypto.randomUUID()}`

  for (let i = 1; i <= 4; i++) {
    const file = formData.get(`slide${i}`) as File | null
    if (!file) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'image/jpeg'
    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const storagePath = `deals/${dealId}/manual-carousel/${uploadId}/slide${i}.${extension}`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (error) {
      return NextResponse.json({ error: `Slide ${i} upload failed: ${error.message}` }, { status: 500 })
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    slideUrls.push(data.publicUrl)
  }

  const storyFile = formData.get('story1') as File | null
  if (storyFile) {
    const buffer = Buffer.from(await storyFile.arrayBuffer())
    const contentType = storyFile.type || 'image/jpeg'
    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const storagePath = `deals/${dealId}/manual-carousel/${uploadId}/story1.${extension}`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (error) {
      return NextResponse.json({ error: `Story upload failed: ${error.message}` }, { status: 500 })
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    storyUrl = data.publicUrl
  }

  if (slideUrls.length !== 4) {
    return NextResponse.json({ error: 'Exactly 4 slides required' }, { status: 400 })
  }

  const assets = buildManualInstagramPostAssets({ slideUrls, storyUrl })
  await supabase.from('posts').upsert({
    deal_id: dealId,
    plattform: 'instagram',
    post_type: 'carousel',
    status: 'pending',
    assets,
  }, { onConflict: 'deal_id,plattform,post_type' })

  await supabase.from('deals').update({ status: 'rendered' }).eq('id', dealId)

  return NextResponse.json({ ok: true, slideUrls })
}
