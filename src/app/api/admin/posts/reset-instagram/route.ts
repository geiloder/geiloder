import { NextRequest, NextResponse } from 'next/server'
import { buildInstagramPostResetUpdate, buildPostedDealResetUpdate } from '@/lib/admin/post-reset'
import { createServiceClient } from '@/lib/supabase/server'
import type { Post, PostAssets } from '@/types'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { dealId?: string } | null
  const dealId = body?.dealId
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('deal_id', dealId)
    .eq('plattform', 'instagram')
    .eq('post_type', 'carousel')
    .maybeSingle()

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 })
  }

  if (!postData) {
    return NextResponse.json({ error: 'Instagram-Post nicht gefunden' }, { status: 404 })
  }

  const post = postData as Post
  const externalPostId = post.external_post_id

  const { error: updatePostError } = await supabase
    .from('posts')
    .update(buildInstagramPostResetUpdate(post.assets as PostAssets | null))
    .eq('id', post.id)

  if (updatePostError) {
    return NextResponse.json({ error: updatePostError.message }, { status: 500 })
  }

  const { error: updateDealError } = await supabase
    .from('deals')
    .update(buildPostedDealResetUpdate())
    .eq('id', dealId)

  if (updateDealError) {
    return NextResponse.json({ error: updateDealError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    externalPostId,
    manualInstagramDeletionRequired: Boolean(externalPostId),
  })
}
