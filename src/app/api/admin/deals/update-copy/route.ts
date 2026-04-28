import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { DealCopy } from '@/types'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId, copy } = await request.json() as { dealId: string; copy: DealCopy }
  const supabase = createServiceClient()

  await supabase.from('deals').update({ copy_data: copy }).eq('id', dealId)
  return NextResponse.json({ ok: true })
}
