import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = request.headers.get('content-type') ?? ''
  const supabase = createServiceClient()

  // File upload
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const dealId = formData.get('dealId') as string
    const file = formData.get('image') as File | null

    if (!dealId || !file) return NextResponse.json({ error: 'dealId and image required' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `products/${dealId}/product.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, { contentType: file.type, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    await supabase.from('deals').update({ produktbild_url: data.publicUrl }).eq('id', dealId)

    return NextResponse.json({ ok: true, url: data.publicUrl })
  }

  // URL update
  const { dealId, imageUrl } = await request.json() as { dealId: string; imageUrl: string }
  if (!dealId || !imageUrl) return NextResponse.json({ error: 'dealId and imageUrl required' }, { status: 400 })

  await supabase.from('deals').update({ produktbild_url: imageUrl }).eq('id', dealId)
  return NextResponse.json({ ok: true, url: imageUrl })
}
