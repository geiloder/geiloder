export interface PublishInstagramCarouselInput {
  accessToken: string
  igUserId: string
  slideUrls: string[]
  caption: string
  fetchImpl?: typeof fetch
}

export interface PublishInstagramCarouselResult {
  carouselContainerId: string
  mediaIds: string[]
  publishedMediaId: string
}

const GRAPH_BASE_URL = 'https://graph.instagram.com/v25.0'

export async function publishInstagramCarousel({
  accessToken,
  igUserId,
  slideUrls,
  caption,
  fetchImpl = fetch,
}: PublishInstagramCarouselInput): Promise<PublishInstagramCarouselResult> {
  if (!accessToken.trim()) throw new Error('Instagram access token missing')
  if (!igUserId.trim()) throw new Error('Instagram user id missing')
  if (slideUrls.length !== 4) throw new Error('Exactly 4 slides required')

  const mediaIds: string[] = []

  for (const slideUrl of slideUrls) {
    const response = await postToInstagram<{ id: string }>(
      fetchImpl,
      `${GRAPH_BASE_URL}/${igUserId}/media`,
      {
        image_url: slideUrl,
        is_carousel_item: 'true',
        access_token: accessToken,
      },
    )
    mediaIds.push(response.id)
  }

  const carousel = await postToInstagram<{ id: string }>(
    fetchImpl,
    `${GRAPH_BASE_URL}/${igUserId}/media`,
    {
      media_type: 'CAROUSEL',
      children: mediaIds.join(','),
      caption: caption.slice(0, 2200),
      access_token: accessToken,
    },
  )

  const published = await postToInstagram<{ id: string }>(
    fetchImpl,
    `${GRAPH_BASE_URL}/${igUserId}/media_publish`,
    {
      creation_id: carousel.id,
      access_token: accessToken,
    },
  )

  return {
    carouselContainerId: carousel.id,
    mediaIds,
    publishedMediaId: published.id,
  }
}

async function postToInstagram<T extends object>(
  fetchImpl: typeof fetch,
  url: string,
  body: Record<string, string>,
): Promise<T> {
  const response = await fetchImpl(url, {
    method: 'POST',
    body: new URLSearchParams(body),
  })

  const json = await response.json() as T | { error?: { message?: string } }
  if (!response.ok || 'error' in json) {
    const message = 'error' in json ? json.error?.message : undefined
    throw new Error(message ?? 'Instagram API request failed')
  }

  return json as T
}
