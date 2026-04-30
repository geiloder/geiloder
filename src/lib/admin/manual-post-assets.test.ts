import { describe, expect, test } from 'vitest'
import { buildManualInstagramPostAssets } from './manual-post-assets'

describe('buildManualInstagramPostAssets', () => {
  test('stores manual feed slides and the generated story asset', () => {
    expect(buildManualInstagramPostAssets({
      slideUrls: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg', 'https://x/4.jpg'],
      storyUrl: 'https://x/story.jpg',
    })).toEqual({
      slides: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg', 'https://x/4.jpg'],
      story: ['https://x/story.jpg'],
    })
  })

  test('omits story assets when no story url was created', () => {
    expect(buildManualInstagramPostAssets({
      slideUrls: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg', 'https://x/4.jpg'],
      storyUrl: null,
    })).toEqual({
      slides: ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg', 'https://x/4.jpg'],
    })
  })
})
