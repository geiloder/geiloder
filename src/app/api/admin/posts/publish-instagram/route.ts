import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import dotenv from 'dotenv'
import { publishInstagramCarousel } from '@/lib/instagram/publisher'
import { createServiceClient } from '@/lib/supabase/server'
import type { Deal, DealCopy, Post, PostAssets } from '@/types'

export const runtime = 'nodejs'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

function loadLocalSecrets() {
  const secretsPath = resolve(process.cwd(), '.secrets.local')
  if (existsSync(secretsPath)) {
    dotenv.config({ path: secretsPath, override: false })
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  loadLocalSecrets()

  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim()
  const igUserId = process.env.META_IG_USER_ID?.trim()
  if (!accessToken || !igUserId) {
    return NextResponse.json({
      error: 'Instagram Zugang fehlt. Bitte META_INSTAGRAM_ACCESS_TOKEN und META_IG_USER_ID setzen.',
    }, { status: 500 })
  }

  const body = await request.json().catch(() => null) as { dealId?: string } | null
  const dealId = body?.dealId
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: dealData, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single()

  if (dealError || !dealData) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
  }

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

  const deal = dealData as Deal
  const post = postData as Post | null
  const assets = post?.assets as PostAssets | null
  const slideUrls = assets?.slides ?? []

  if (!post || slideUrls.length !== 4) {
    return NextResponse.json({ error: 'Bitte zuerst genau 4 Slides hochladen.' }, { status: 400 })
  }

  if (post.status === 'posted') {
    return NextResponse.json({ ok: true, alreadyPosted: true, externalPostId: post.external_post_id })
  }

  try {
    const result = await publishInstagramCarousel({
      accessToken,
      igUserId,
      slideUrls,
      caption: buildCaption(deal.copy_data),
    })

    await supabase.from('posts').update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_post_id: result.publishedMediaId,
      assets: {
        ...assets,
        instagram: {
          mediaIds: result.mediaIds,
          carouselContainerId: result.carouselContainerId,
          publishedMediaId: result.publishedMediaId,
        },
      },
    }).eq('id', post.id)

    await supabase.from('deals').update({
      status: 'posted',
      posted_at: new Date().toISOString(),
    }).eq('id', deal.id)

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    await supabase.from('posts').update({
      status: 'failed',
      assets: {
        ...assets,
        last_error: error instanceof Error ? error.message : 'Instagram publish failed',
      },
    }).eq('id', post.id)

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Instagram publish failed',
    }, { status: 500 })
  }
}

function buildCaption(copy: DealCopy | null): string {
  if (!copy) return ''

  const caption = copy.caption.trim()
  const hashtags = (copy.hashtags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.startsWith('#') ? tag : `#${tag}`)
    .join(' ')

  return [caption, hashtags].filter(Boolean).join('\n\n')
}
