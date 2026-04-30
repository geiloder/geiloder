import type { PostAssets } from '@/types'

export function buildInstagramPostResetUpdate(assets: PostAssets | null) {
  return {
    status: 'pending' as const,
    posted_at: null,
    external_post_id: null,
    assets: {
      ...(assets?.slides ? { slides: assets.slides } : {}),
      ...(assets?.story ? { story: assets.story } : {}),
      ...(assets?.video ? { video: assets.video } : {}),
      ...(assets?.thumbnail ? { thumbnail: assets.thumbnail } : {}),
    },
  }
}

export function buildPostedDealResetUpdate() {
  return {
    status: 'new' as const,
    posted_at: null,
  }
}
