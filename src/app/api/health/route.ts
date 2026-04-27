import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    return NextResponse.json({
      status: 'ok',
      supabase: url && key ? 'configured' : 'missing env vars',
      node: process.version,
    })
  } catch (e) {
    return NextResponse.json({ status: 'error', message: String(e) }, { status: 500 })
  }
}
