import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geiloder.vercel.app'
  const supabase = createServiceClient()

  const { data: deals } = await supabase
    .from('deals')
    .select('slug, updated_at')
    .in('status', ['approved', 'rendered', 'scheduled', 'posted'])
    .not('slug', 'is', null)
    .limit(1000)

  const dealUrls: MetadataRoute.Sitemap = (deals ?? []).map((d) => ({
    url: `${baseUrl}/deal/${d.slug}`,
    lastModified: new Date(d.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/supplements`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/fitness`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/home-gym`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/gadgets`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/gymwear`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...dealUrls,
  ]
}
