import { describe, expect, test } from 'vitest'
import { buildInstagramPostResetUpdate, buildPostedDealResetUpdate } from './post-reset'
import type { PostAssets } from '@/types'

describe('buildInstagramPostResetUpdate', () => {
  test('clears published Instagram metadata while keeping uploaded slides', () => {
    const assets: PostAssets = {
      slides: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg', 'https://x/4.jpg'],
      instagram: {
        mediaIds: ['item-1', 'item-2', 'item-3', 'item-4'],
        carouselContainerId: 'carousel-1',
        publishedMediaId: 'published-1',
      },
      last_error: 'old error',
    }

    expect(buildInstagramPostResetUpdate(assets)).toEqual({
      status: 'pending',
      posted_at: null,
      external_post_id: null,
      assets: {
        slides: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg', 'https://x/4.jpg'],
      },
    })
  })
})

describe('buildPostedDealResetUpdate', () => {
  test('moves the deal out of public listings', () => {
    expect(buildPostedDealResetUpdate()).toEqual({
      status: 'new',
      posted_at: null,
    })
  })
})
