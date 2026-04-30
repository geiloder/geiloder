import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { PostAssets } from '@/types'

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

  for (let i = 1; i <= 4; i++) {
    const file = formData.get(`slide${i}`) as File | null
    if (!file) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'image/jpeg'
    const extension = contentType.includes('png') ? 'png' : 'jpg'
    const storagePath = `deals/${dealId}/carousel_slide${i}.${extension}`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType, upsert: true })

    if (error) {
      return NextResponse.json({ error: `Slide ${i} upload failed: ${error.message}` }, { status: 500 })
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    slideUrls.push(data.publicUrl)
  }

  if (slideUrls.length !== 4) {
    return NextResponse.json({ error: 'Exactly 4 slides required' }, { status: 400 })
  }

  const assets: PostAssets = { slides: slideUrls }
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
