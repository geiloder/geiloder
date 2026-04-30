export interface PublishInstagramCarouselInput {
  accessToken: string
  igUserId: string
  slideUrls: string[]
  storyUrl?: string | null
  caption: string
  fetchImpl?: typeof fetch
}

export interface PublishInstagramCarouselResult {
  carouselContainerId: string
  mediaIds: string[]
  publishedMediaId: string
  storyContainerId?: string
  publishedStoryId?: string
}

export interface PublishInstagramStoryInput {
  accessToken: string
  igUserId: string
  storyUrl: string
  fetchImpl?: typeof fetch
}

export interface PublishInstagramStoryResult {
  storyContainerId: string
  publishedStoryId: string
}

const GRAPH_BASE_URL = 'https://graph.instagram.com/v25.0'

export async function publishInstagramCarousel({
  accessToken,
  igUserId,
  slideUrls,
  storyUrl,
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

  const result: PublishInstagramCarouselResult = {
    carouselContainerId: carousel.id,
    mediaIds,
    publishedMediaId: published.id,
  }

  const storyImageUrl = storyUrl?.trim()
  if (storyImageUrl) {
    const story = await publishInstagramStory({
      accessToken,
      igUserId,
      storyUrl: storyImageUrl,
      fetchImpl,
    })

    result.storyContainerId = story.storyContainerId
    result.publishedStoryId = story.publishedStoryId
  }

  return result
}

export async function publishInstagramStory({
  accessToken,
  igUserId,
  storyUrl,
  fetchImpl = fetch,
}: PublishInstagramStoryInput): Promise<PublishInstagramStoryResult> {
  if (!accessToken.trim()) throw new Error('Instagram access token missing')
  if (!igUserId.trim()) throw new Error('Instagram user id missing')

  const storyImageUrl = storyUrl.trim()
  if (!storyImageUrl) throw new Error('Instagram story url missing')

  const story = await postToInstagram<{ id: string }>(
    fetchImpl,
    `${GRAPH_BASE_URL}/${igUserId}/media`,
    {
      image_url: storyImageUrl,
      media_type: 'STORIES',
      access_token: accessToken,
    },
  )

  const publishedStory = await postToInstagram<{ id: string }>(
    fetchImpl,
    `${GRAPH_BASE_URL}/${igUserId}/media_publish`,
    {
      creation_id: story.id,
      access_token: accessToken,
    },
  )

  return {
    storyContainerId: story.id,
    publishedStoryId: publishedStory.id,
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
