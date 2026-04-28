import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashIp } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params
  const { searchParams } = request.nextUrl

  const source = searchParams.get('source') ?? 'unknown'
  const platform = searchParams.get('platform') ?? source
  const utmCampaign = searchParams.get('utm_campaign') ?? undefined
  const utmContent = searchParams.get('utm_content') ?? undefined

  const supabase = createServiceClient()

  const { data: deal, error } = await supabase
    .from('deals')
    .select('affiliate_link, status, produktname')
    .eq('id', dealId)
    .single()

  if (error || !deal || deal.status === 'rejected' || deal.status === 'expired') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const ipHash = hashIp(ip)
  const userAgent = request.headers.get('user-agent') ?? undefined

  supabase.from('clicks').insert({
    deal_id: dealId,
    source,
    plattform: platform,
    ip_hash: ipHash,
    user_agent: userAgent,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
  }).then()

  let affiliateUrl = deal.affiliate_link as string
  try {
    const url = new URL(affiliateUrl)
    if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign)
    if (utmContent) url.searchParams.set('utm_content', utmContent)
    affiliateUrl = url.toString()
  } catch {
    // URL-Parsing fehlgeschlagen — Original-Link verwenden
  }

  return NextResponse.redirect(affiliateUrl, { status: 302 })
}
