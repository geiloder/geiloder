import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import dotenv from 'dotenv'
import { publishInstagramCarousel, publishInstagramStory } from '@/lib/instagram/publisher'
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
  const storyUrl = assets?.story?.[0] ?? null

  if (!post || slideUrls.length !== 4) {
    return NextResponse.json({ error: 'Bitte zuerst genau 4 Slides hochladen.' }, { status: 400 })
  }

  const currentAssets = assets ?? {}
  let instagramAssets = currentAssets.instagram ?? {}
  let publishedMediaId = post.external_post_id ?? instagramAssets.publishedMediaId ?? null

  if (post.status === 'posted' && instagramAssets.publishedStoryId) {
    return NextResponse.json({ ok: true, alreadyPosted: true, externalPostId: publishedMediaId })
  }

  try {
    if (!publishedMediaId) {
      const result = await publishInstagramCarousel({
        accessToken,
        igUserId,
        slideUrls,
        caption: buildCaption(deal.copy_data),
      })

      publishedMediaId = result.publishedMediaId
      instagramAssets = {
        ...instagramAssets,
        mediaIds: result.mediaIds,
        carouselContainerId: result.carouselContainerId,
        publishedMediaId: result.publishedMediaId,
      }

      await supabase.from('posts').update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        external_post_id: result.publishedMediaId,
        assets: withoutLastError({
          ...currentAssets,
          instagram: instagramAssets,
        }),
      }).eq('id', post.id)

      await supabase.from('deals').update({
        status: 'posted',
        posted_at: new Date().toISOString(),
      }).eq('id', deal.id)
    }

    if (storyUrl && !instagramAssets.publishedStoryId) {
      try {
        const storyResult = await publishInstagramStory({
          accessToken,
          igUserId,
          storyUrl,
        })

        instagramAssets = {
          ...instagramAssets,
          storyContainerId: storyResult.storyContainerId,
          publishedStoryId: storyResult.publishedStoryId,
          storySourceUrl: storyUrl,
        }

        await supabase.from('posts').update({
          status: 'posted',
          external_post_id: publishedMediaId,
          assets: withoutLastError({
            ...currentAssets,
            instagram: instagramAssets,
          }),
        }).eq('id', post.id)

        return NextResponse.json({
          ok: true,
          externalPostId: publishedMediaId,
          ...instagramAssets,
        })
      } catch (storyError) {
        const message = storyError instanceof Error ? storyError.message : 'Instagram story publish failed'

        await supabase.from('posts').update({
          status: 'posted',
          external_post_id: publishedMediaId,
          assets: {
            ...currentAssets,
            instagram: instagramAssets,
            last_error: `Story konnte nicht gepostet werden: ${message}`,
          },
        }).eq('id', post.id)

        return NextResponse.json({
          error: `Carousel wurde gepostet, aber die Story konnte nicht veröffentlicht werden: ${message}`,
          externalPostId: publishedMediaId,
          ...instagramAssets,
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      externalPostId: publishedMediaId,
      ...instagramAssets,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instagram publish failed'

    await supabase.from('posts').update({
      status: publishedMediaId ? 'posted' : 'failed',
      external_post_id: publishedMediaId,
      assets: {
        ...currentAssets,
        ...(publishedMediaId ? { instagram: instagramAssets } : {}),
        last_error: message,
      },
    }).eq('id', post.id)

    return NextResponse.json({
      error: message,
      ...(publishedMediaId ? { externalPostId: publishedMediaId } : {}),
    }, { status: 500 })
  }
}

function withoutLastError(assets: PostAssets): PostAssets {
  const cleanAssets: PostAssets = { ...assets }
  delete cleanAssets.last_error
  return cleanAssets
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
