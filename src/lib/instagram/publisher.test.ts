import { describe, expect, test, vi } from 'vitest'
import { publishInstagramCarousel } from './publisher'

describe('publishInstagramCarousel', () => {
  test('creates carousel item containers, a carousel container, then publishes it', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'item-1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'item-2' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'item-3' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'item-4' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'carousel-1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'published-1' }))

    const result = await publishInstagramCarousel({
      accessToken: 'token',
      igUserId: '1784',
      slideUrls: ['https://x/1.png', 'https://x/2.png', 'https://x/3.png', 'https://x/4.png'],
      caption: 'caption',
      fetchImpl: fetchMock,
    })

    expect(result).toEqual({
      carouselContainerId: 'carousel-1',
      mediaIds: ['item-1', 'item-2', 'item-3', 'item-4'],
      publishedMediaId: 'published-1',
    })
    expect(fetchMock).toHaveBeenCalledTimes(6)
    expect(requestBody(fetchMock, 0)).toMatchObject({
      image_url: 'https://x/1.png',
      is_carousel_item: 'true',
    })
    expect(requestBody(fetchMock, 4)).toMatchObject({
      media_type: 'CAROUSEL',
      children: 'item-1,item-2,item-3,item-4',
      caption: 'caption',
    })
    expect(requestBody(fetchMock, 5)).toMatchObject({
      creation_id: 'carousel-1',
    })
  })

  test('publishes only the carousel', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'item-1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'item-2' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'item-3' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'item-4' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'carousel-1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'published-1' }))

    const result = await publishInstagramCarousel({
      accessToken: 'token',
      igUserId: '1784',
      slideUrls: ['https://x/1.png', 'https://x/2.png', 'https://x/3.png', 'https://x/4.png'],
      caption: 'caption',
      fetchImpl: fetchMock,
    })

    expect(result).toEqual({
      carouselContainerId: 'carousel-1',
      mediaIds: ['item-1', 'item-2', 'item-3', 'item-4'],
      publishedMediaId: 'published-1',
    })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  test('rejects anything other than 4 slides for this MVP workflow', async () => {
    await expect(publishInstagramCarousel({
      accessToken: 'token',
      igUserId: '1784',
      slideUrls: ['https://x/1.png'],
      caption: 'caption',
      fetchImpl: vi.fn(),
    })).rejects.toThrow('Exactly 4 slides required')
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, callIndex: number) {
  const init = fetchMock.mock.calls[callIndex][1] as RequestInit
  return Object.fromEntries(init.body as URLSearchParams)
}
