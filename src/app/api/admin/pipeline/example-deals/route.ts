import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: exampleDeals, error: selectError } = await supabase
    .from('deals')
    .select('id')
    .not('shop', 'eq', 'Open Food Facts')
    .not('affiliate_link', 'ilike', '%openfoodfacts.org%')

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 })

  const ids = (exampleDeals ?? []).map((deal) => deal.id as string)
  if (ids.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Keine Beispiel-Deals gefunden.' })
  }

  const { error: postsError } = await supabase.from('posts').delete().in('deal_id', ids)
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

  const { error: clicksError } = await supabase.from('clicks').delete().in('deal_id', ids)
  if (clicksError) return NextResponse.json({ error: clicksError.message }, { status: 500 })

  const { error: dealsError } = await supabase.from('deals').delete().in('id', ids)
  if (dealsError) return NextResponse.json({ error: dealsError.message }, { status: 500 })

  return NextResponse.json({
    deleted: ids.length,
    message: `${ids.length} Amazon/More/Beispiel-Deals entfernt.`,
  })
}
