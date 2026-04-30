import type { PostAssets } from '@/types'

export function buildManualInstagramPostAssets({
  slideUrls,
  storyUrl,
}: {
  slideUrls: string[]
  storyUrl?: string | null
}): PostAssets {
  return {
    slides: slideUrls,
    ...(storyUrl ? { story: [storyUrl] } : {}),
  }
}
