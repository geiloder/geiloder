import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId } = await request.json() as { dealId: string }
  const supabase = createServiceClient()

  await supabase.from('deals').update({ status: 'rejected' }).eq('id', dealId)
  return NextResponse.json({ ok: true })
}
