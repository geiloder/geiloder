# Admin Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passwort-geschütztes Admin-Dashboard auf `/admin/`. Zeigt alle Deals mit Status, Score, Copy-Preview. Ermöglicht Approve/Reject. Für Carousel-Deals (Score ≥70): "Deal Prep"-Ansicht mit Produktbild-Download + fertigem ChatGPT-Prompt zum Kopieren + Upload-Feld für die 4 GPT-generierten Slides.

**Architecture:** Next.js Middleware für Password-Protection (simples Cookie-basiertes Auth ohne externe Services). Server Components laden Daten. Client Components für interaktive Buttons. API Routes für Approve/Reject/Update-Actions.

**Tech Stack:** Next.js 14, Tailwind, shadcn/ui, Supabase Service Role

---

## File Structure

```
/src/app/
├── admin/
│   ├── layout.tsx           # Admin-Layout mit Auth-Check
│   ├── page.tsx             # Dashboard-Übersicht
│   ├── deals/
│   │   └── page.tsx         # Deal-Management-Tabelle
│   └── login/
│       └── page.tsx         # Login-Seite
/src/app/api/
├── admin/
│   ├── auth/route.ts        # Login-Handler
│   ├── deals/
│   │   ├── approve/route.ts
│   │   ├── reject/route.ts
│   │   └── update-copy/route.ts
```

---

### Task 1: Admin Auth (Cookie-basiert)

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/api/admin/auth/route.ts`, `src/middleware.ts`

- [ ] **Step 1: Login Page**

`src/app/admin/login/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Falsches Passwort')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
        <h1 className="text-2xl font-black text-white mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-400"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-400 hover:bg-green-300 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Auth API Route**

`src/app/api/admin/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json() as { password: string }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('admin_session')
  return response
}
```

- [ ] **Step 3: Middleware für Auth-Schutz**

`src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin-Bereich schützen (außer Login-Seite)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session')
    const isValid = session?.value === process.env.ADMIN_PASSWORD

    if (!isValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

### Task 2: Admin API Routes (Approve/Reject/Update)

**Files:**
- Create: `src/app/api/admin/deals/approve/route.ts`, `src/app/api/admin/deals/reject/route.ts`, `src/app/api/admin/deals/update-copy/route.ts`

- [ ] **Step 1: Approve-Route**

`src/app/api/admin/deals/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function checkAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  return session?.value === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dealId } = await request.json() as { dealId: string }
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('deals')
    .update({ status: 'approved' })
    .eq('id', dealId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Reject-Route**

`src/app/api/admin/deals/reject/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId } = await request.json() as { dealId: string }
  const supabase = createServiceClient()

  await supabase.from('deals').update({ status: 'rejected' }).eq('id', dealId)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Copy-Update-Route**

`src/app/api/admin/deals/update-copy/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { DealCopy } from '@/types'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId, copy } = await request.json() as { dealId: string; copy: DealCopy }
  const supabase = createServiceClient()

  await supabase.from('deals').update({ copy_data: copy }).eq('id', dealId)
  return NextResponse.json({ ok: true })
}
```

---

### Task 3: Admin Layout

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Admin Layout**

`src/app/admin/layout.tsx`:

```typescript
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-black text-white">🎛 Admin</Link>
          <Link href="/admin/deals" className="text-sm text-zinc-400 hover:text-white">Deals</Link>
          <Link href="/admin/analytics" className="text-sm text-zinc-400 hover:text-white">Analytics</Link>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Website</Link>
        </div>
        <form action="/api/admin/auth" method="DELETE">
          <button className="text-xs text-zinc-500 hover:text-white">Logout</button>
        </form>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  )
}
```

---

### Task 4: Admin Dashboard (Übersicht)

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Dashboard**

`src/app/admin/page.tsx`:

```typescript
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

async function getStats() {
  const supabase = createServiceClient()

  const [newDeals, approvedDeals, renderedDeals, todayClicks] = await Promise.all([
    supabase.from('deals').select('id', { count: 'exact' }).eq('status', 'new'),
    supabase.from('deals').select('id', { count: 'exact' }).eq('status', 'approved'),
    supabase.from('deals').select('id', { count: 'exact' }).eq('status', 'rendered'),
    supabase.from('clicks').select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  return {
    new: newDeals.count ?? 0,
    approved: approvedDeals.count ?? 0,
    rendered: renderedDeals.count ?? 0,
    todayClicks: todayClicks.count ?? 0,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-white">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Neue Deals', value: stats.new, color: 'text-yellow-400', href: '/admin/deals?status=new' },
          { label: 'Approved', value: stats.approved, color: 'text-blue-400', href: '/admin/deals?status=approved' },
          { label: 'Gerendert', value: stats.rendered, color: 'text-green-400', href: '/admin/deals?status=rendered' },
          { label: 'Klicks heute', value: stats.todayClicks, color: 'text-purple-400', href: '/admin/analytics' },
        ].map(({ label, value, color, href }) => (
          <Link key={label} href={href} className="block p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h2 className="font-bold text-white mb-3">Pipeline ausführen</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Diese Scripts werden normalerweise automatisch via GitHub Actions ausgeführt. Hier kannst du sie manuell triggern.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: '1. Import Feeds', cmd: 'npm run import:awin' },
            { label: '2. Deals scoren', cmd: 'npm run score' },
            { label: '3. Copy generieren', cmd: 'npm run generate:copy' },
            { label: '4. Slides rendern', cmd: 'npm run render' },
          ].map(({ label, cmd }) => (
            <div key={label} className="p-3 bg-zinc-800 rounded-lg">
              <p className="font-medium text-zinc-200">{label}</p>
              <code className="text-xs text-green-400 mt-1 block">{cmd}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### Task 5: Deal-Management-Tabelle

**Files:**
- Create: `src/app/admin/deals/page.tsx`, `src/components/admin/deal-row.tsx`

- [ ] **Step 1: Deal-Row Komponente (Client)**

`src/components/admin/deal-row.tsx`:

```typescript
'use client'
import Image from 'next/image'
import { useState } from 'react'
import { formatPrice, formatDiscount } from '@/lib/utils'
import type { Deal } from '@/types'

interface DealRowProps {
  deal: Deal
  onStatusChange: (id: string, status: string) => void
}

export function DealRow({ deal, onStatusChange }: DealRowProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch(`/api/admin/deals/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: deal.id }),
    })
    onStatusChange(deal.id, action === 'approve' ? 'approved' : 'rejected')
    setLoading(null)
  }

  const statusColors: Record<string, string> = {
    new: 'bg-yellow-400/10 text-yellow-400',
    approved: 'bg-blue-400/10 text-blue-400',
    rendered: 'bg-green-400/10 text-green-400',
    scheduled: 'bg-purple-400/10 text-purple-400',
    posted: 'bg-zinc-400/10 text-zinc-400',
    rejected: 'bg-red-400/10 text-red-400',
    expired: 'bg-zinc-600/10 text-zinc-600',
  }

  const copy = deal.copy_data

  return (
    <>
      <tr className="border-b border-zinc-800 hover:bg-zinc-900/50">
        {/* Bild */}
        <td className="p-3 w-16">
          {deal.produktbild_url ? (
            <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-800">
              <Image src={deal.produktbild_url} alt="" fill className="object-contain p-1" sizes="48px" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-xl">🛍️</div>
          )}
        </td>
        {/* Name */}
        <td className="p-3">
          <p className="text-sm font-medium text-white line-clamp-2">{deal.produktname}</p>
          <p className="text-xs text-zinc-500">{deal.shop} · {deal.kategorie}</p>
        </td>
        {/* Preis */}
        <td className="p-3 text-right">
          <p className="text-sm font-bold text-white">{formatPrice(deal.deal_preis)}</p>
          {deal.rabatt_prozent && (
            <p className="text-xs text-green-400">{formatDiscount(deal.rabatt_prozent)}</p>
          )}
        </td>
        {/* Score */}
        <td className="p-3 text-center">
          <span className={`text-sm font-bold ${(deal.deal_score ?? 0) >= 70 ? 'text-green-400' : (deal.deal_score ?? 0) >= 50 ? 'text-yellow-400' : 'text-zinc-500'}`}>
            {deal.deal_score ?? '–'}
          </span>
        </td>
        {/* Status */}
        <td className="p-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[deal.status] ?? ''}`}>
            {deal.status}
          </span>
        </td>
        {/* Assets */}
        <td className="p-3">
          {copy && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {expanded ? '▲ Copy' : '▼ Copy'}
            </button>
          )}
        </td>
        {/* Actions */}
        <td className="p-3">
          <div className="flex gap-2">
            {deal.status === 'new' || deal.status === 'rejected' ? (
              <button
                onClick={() => handleAction('approve')}
                disabled={!!loading}
                className="text-xs px-2 py-1 bg-green-400 text-black font-bold rounded hover:bg-green-300 disabled:opacity-50"
              >
                {loading === 'approve' ? '...' : '✓ Approve'}
              </button>
            ) : null}
            {deal.status !== 'rejected' && deal.status !== 'expired' ? (
              <button
                onClick={() => handleAction('reject')}
                disabled={!!loading}
                className="text-xs px-2 py-1 bg-red-400/20 text-red-400 font-bold rounded hover:bg-red-400/30 disabled:opacity-50"
              >
                {loading === 'reject' ? '...' : '✗'}
              </button>
            ) : null}
          </div>
        </td>
      </tr>

      {/* Expanded: Copy Preview */}
      {expanded && copy && (
        <tr className="border-b border-zinc-800 bg-zinc-900/30">
          <td colSpan={7} className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-zinc-400 font-bold mb-1">Slide 1 (Hero)</p>
                <p className="text-white">{copy.headline}</p>
                <p className="text-zinc-500">{copy.subheadline}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold mb-1">Slide 2 (Benefits)</p>
                <p className="text-green-400">{copy.benefit_1}</p>
                <p className="text-zinc-400">{copy.benefit_1_detail}</p>
                <p className="text-green-400 mt-1">{copy.benefit_2}</p>
                <p className="text-zinc-400">{copy.benefit_2_detail}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold mb-1">Slide 4 (Humor)</p>
                <p className="text-white">{copy.humor_konsequenz_1}</p>
                <p className="text-white">{copy.humor_konsequenz_2}</p>
                <p className="text-white">{copy.humor_konsequenz_3}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold mb-1">Caption</p>
                <p className="text-zinc-300 line-clamp-4">{copy.caption}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
```

- [ ] **Step 2: Deal-Management-Seite**

`src/app/admin/deals/page.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { DealRow } from '@/components/admin/deal-row'
import type { Deal, DealStatus } from '@/types'

const STATUS_FILTERS: { value: DealStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Neu' },
  { value: 'approved', label: 'Approved' },
  { value: 'rendered', label: 'Gerendert' },
  { value: 'posted', label: 'Gepostet' },
  { value: 'rejected', label: 'Abgelehnt' },
]

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch('/api/admin/deals/list?' + new URLSearchParams(statusFilter !== 'all' ? { status: statusFilter } : {}))
      const data = await res.json() as { deals: Deal[] }
      setDeals(data.deals ?? [])
      setLoading(false)
    }
    load()
  }, [statusFilter])

  function handleStatusChange(id: string, newStatus: string) {
    setDeals((prev) => prev.map((d) => d.id === id ? { ...d, status: newStatus as DealStatus } : d))
  }

  const filtered = statusFilter === 'all' ? deals : deals.filter((d) => d.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Deals ({filtered.length})</h1>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value as DealStatus | 'all')}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              statusFilter === value ? 'bg-green-400 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-zinc-500 text-center py-10">Lädt...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-xs text-zinc-500">
              <tr>
                <th className="p-3">Bild</th>
                <th className="p-3">Produkt</th>
                <th className="p-3 text-right">Preis</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3">Status</th>
                <th className="p-3">Copy</th>
                <th className="p-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((deal) => (
                <DealRow key={deal.id} deal={deal} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Deal-List API Route für Admin**

`src/app/api/admin/deals/list/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')

  const supabase = createServiceClient()
  let query = supabase
    .from('deals')
    .select('*')
    .order('deal_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deals: data ?? [] })
}
```

---

### Task 6: Test und Deploy

- [ ] **Step 1: Type-Check**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Step 2: Admin-Dashboard testen**

```bash
npm run dev
```

1. http://localhost:3000/admin/login öffnen → Passwort eingeben
2. Redirect zu /admin → Dashboard mit Stats
3. /admin/deals → Deal-Tabelle
4. Approve-Button klicken → Status ändert sich

- [ ] **Step 3: Auth prüfen**

```bash
curl http://localhost:3000/admin
```

Expected: Redirect zu `/admin/login` (302)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add password-protected admin dashboard with deal management"
git push
```

---

### Task 7: Deal Prep — ChatGPT-Prompt + Slide-Upload

Das Herzstück des manuellen GPT-Workflows. Für jeden Carousel-Deal (Score ≥70) bekommst du hier alles was du brauchst.

**Files:**
- Create: `src/app/admin/prep/[dealId]/page.tsx`
- Create: `src/app/api/admin/deals/upload-slides/route.ts`
- Modify: `src/components/admin/deal-row.tsx` (Prep-Button hinzufügen)

- [ ] **Step 1: Upload-Slides API Route**

`src/app/api/admin/deals/upload-slides/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { PostAssets } from '@/types'

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const dealId = formData.get('dealId') as string
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

  const supabase = createServiceClient()
  const slideUrls: string[] = []

  for (let i = 1; i <= 4; i++) {
    const file = formData.get(`slide${i}`) as File | null
    if (!file) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const storagePath = `deals/${dealId}/carousel_slide${i}.png`

    const { error } = await supabase.storage
      .from('assets')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      return NextResponse.json({ error: `Slide ${i} upload failed: ${error.message}` }, { status: 500 })
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(storagePath)
    slideUrls.push(data.publicUrl)
  }

  if (slideUrls.length !== 4) {
    return NextResponse.json({ error: 'Exactly 4 slides required' }, { status: 400 })
  }

  // Post-Eintrag für Carousel anlegen
  const assets: PostAssets = { slides: slideUrls }
  await supabase.from('posts').upsert({
    deal_id: dealId,
    plattform: 'instagram',
    post_type: 'carousel',
    status: 'pending',
    assets,
  }, { onConflict: 'deal_id,plattform,post_type' })

  // Deal-Status auf rendered setzen
  await supabase.from('deals').update({ status: 'rendered' }).eq('id', dealId)

  return NextResponse.json({ ok: true, slideUrls })
}
```

- [ ] **Step 2: Deal Prep Page**

`src/app/admin/prep/[dealId]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { generateChatGptPrompt } from '@/lib/chatgpt-prompt'
import { formatPrice, formatDiscount } from '@/lib/utils'
import { SlideUploadForm } from '@/components/admin/slide-upload-form'
import type { Deal, DealCopy } from '@/types'
import Image from 'next/image'

interface Props {
  params: Promise<{ dealId: string }>
}

export default async function DealPrepPage({ params }: Props) {
  const { dealId } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase.from('deals').select('*').eq('id', dealId).single()
  if (error || !data) notFound()

  const deal = data as Deal
  const copy = deal.copy_data as DealCopy | null
  if (!copy) return <div className="text-red-400 p-8">Kein Copy für diesen Deal generiert. Zuerst npm run generate:copy ausführen.</div>

  const prompt = generateChatGptPrompt(deal, copy)

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Deal Prep</h1>
        <p className="text-zinc-500 text-sm mt-1">{deal.produktname}</p>
      </div>

      {/* Deal Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Produktbild */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <h2 className="font-bold text-white">1. Produktbild herunterladen</h2>
          {deal.produktbild_url ? (
            <>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
                <Image src={deal.produktbild_url} alt={deal.produktname} fill className="object-contain p-4" sizes="400px" />
              </div>
              <a
                href={deal.produktbild_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                ⬇ Produktbild herunterladen
              </a>
              <p className="text-xs text-zinc-500">Dieses Bild in ChatGPT hochladen wenn du den Prompt einfügst.</p>
            </>
          ) : (
            <div className="p-4 bg-zinc-800 rounded-lg text-zinc-500 text-sm">Kein Produktbild verfügbar.</div>
          )}

          {/* Deal-Infos */}
          <div className="pt-2 border-t border-zinc-800 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-zinc-400">Preis</span><span className="text-white font-bold">{formatPrice(deal.deal_preis)}</span></div>
            {deal.alter_preis && <div className="flex justify-between"><span className="text-zinc-400">Alter Preis</span><span className="text-zinc-500 line-through">{formatPrice(deal.alter_preis)}</span></div>}
            {deal.rabatt_prozent && <div className="flex justify-between"><span className="text-zinc-400">Rabatt</span><span className="text-green-400 font-bold">{formatDiscount(deal.rabatt_prozent)}</span></div>}
            <div className="flex justify-between"><span className="text-zinc-400">Score</span><span className="text-white">{deal.deal_score}</span></div>
          </div>
        </div>

        {/* ChatGPT Prompt */}
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <h2 className="font-bold text-white">2. ChatGPT-Prompt kopieren</h2>
          <p className="text-zinc-500 text-xs">Prompt in ChatGPT einfügen → Produktbild hochladen → 4 Slides generieren lassen → als PNG herunterladen</p>
          <CopyPromptButton prompt={prompt} />
          <details className="mt-2">
            <summary className="text-xs text-zinc-500 cursor-pointer">Prompt vorschau</summary>
            <pre className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-800 p-3 rounded-lg max-h-64 overflow-y-auto">{prompt}</pre>
          </details>
        </div>
      </div>

      {/* Slide Upload */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h2 className="font-bold text-white mb-2">3. GPT-Slides hochladen</h2>
        <p className="text-zinc-500 text-sm mb-4">Die 4 von ChatGPT generierten Slides hier hochladen. Reihenfolge: Slide 1 (Hero) → Slide 2 (Benefits) → Slide 3 (CTA) → Slide 4 (Humor).</p>
        <SlideUploadForm dealId={deal.id} />
      </div>
    </div>
  )
}

// Client-Komponente für Clipboard
function CopyPromptButton({ prompt }: { prompt: string }) {
  'use client'
  // Rendered als Server Component — braucht eigene Datei für 'use client'
  // Wird in Task 7 Step 3 als separate Datei ausgelagert
  return (
    <div className="p-3 bg-zinc-800 rounded-lg text-xs text-zinc-400">
      Prompt wird in Step 3 als Client-Komponente gebaut
    </div>
  )
}
```

- [ ] **Step 3: CopyButton + SlideUploadForm als Client-Komponenten**

`src/components/admin/copy-prompt-button.tsx`:

```typescript
'use client'
import { useState } from 'react'

export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="w-full bg-green-400 hover:bg-green-300 text-black font-bold py-3 rounded-lg transition-colors"
    >
      {copied ? '✓ Kopiert!' : '📋 ChatGPT-Prompt kopieren'}
    </button>
  )
}
```

`src/components/admin/slide-upload-form.tsx`:

```typescript
'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface Props {
  dealId: string
}

export function SlideUploadForm({ dealId }: Props) {
  const [files, setFiles] = useState<(File | null)[]>([null, null, null, null])
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null])
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function handleFile(index: number, file: File | null) {
    if (!file) return
    const newFiles = [...files]
    newFiles[index] = file
    setFiles(newFiles)

    const newPreviews = [...previews]
    newPreviews[index] = URL.createObjectURL(file)
    setPreviews(newPreviews)
  }

  async function handleUpload() {
    if (files.some((f) => !f)) {
      setError('Bitte alle 4 Slides hochladen')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.set('dealId', dealId)
    files.forEach((f, i) => { if (f) formData.set(`slide${i + 1}`, f) })

    const res = await fetch('/api/admin/deals/upload-slides', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setDone(true)
    } else {
      const data = await res.json() as { error: string }
      setError(data.error ?? 'Upload fehlgeschlagen')
    }
    setUploading(false)
  }

  if (done) {
    return (
      <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-lg text-center">
        <p className="text-green-400 font-bold text-lg">✓ Slides hochgeladen</p>
        <p className="text-zinc-400 text-sm mt-1">Deal ist jetzt ready zum Posten.</p>
        <a href="/admin/deals?status=rendered" className="mt-3 inline-block text-sm text-green-400 underline">Zurück zur Deal-Liste →</a>
      </div>
    )
  }

  const SLIDE_LABELS = ['Slide 1 – Hero', 'Slide 2 – Benefits', 'Slide 3 – CTA', 'Slide 4 – Humor']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SLIDE_LABELS.map((label, i) => (
          <label key={label} className="cursor-pointer block">
            <div className={`relative aspect-[4/5] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${previews[i] ? 'border-green-400' : 'border-zinc-700 hover:border-zinc-500'}`}>
              {previews[i] ? (
                <Image src={previews[i]!} alt={label} fill className="object-cover rounded-lg" sizes="200px" />
              ) : (
                <div className="text-center p-2">
                  <p className="text-2xl">+</p>
                  <p className="text-xs text-zinc-500 mt-1">{label}</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => handleFile(i, e.target.files?.[0] ?? null)}
            />
          </label>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={uploading || files.some((f) => !f)}
        className="w-full bg-green-400 hover:bg-green-300 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-40"
      >
        {uploading ? 'Uploading...' : `${files.filter(Boolean).length}/4 Slides hochladen`}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Deal Prep Page finalisieren (CopyButton einbauen)**

`src/app/admin/prep/[dealId]/page.tsx` — `CopyPromptButton` aus der separaten Datei importieren:

```typescript
// Ersetze die inline CopyPromptButton Funktion durch:
import { CopyPromptButton } from '@/components/admin/copy-prompt-button'
import { SlideUploadForm } from '@/components/admin/slide-upload-form'
```

- [ ] **Step 5: "Prep" Button in DealRow hinzufügen**

In `src/components/admin/deal-row.tsx` — in der Actions-Spalte ergänzen:

```typescript
// Nach dem Approve-Button:
{(deal.deal_score ?? 0) >= 70 && deal.status === 'approved' && (
  <a
    href={`/admin/prep/${deal.id}`}
    className="text-xs px-2 py-1 bg-purple-400/20 text-purple-400 font-bold rounded hover:bg-purple-400/30"
  >
    🎨 GPT
  </a>
)}
```

- [ ] **Step 6: Workflow testen**

```bash
npm run dev
```

1. http://localhost:3000/admin/deals → Carousel-Deal mit Score ≥70 finden
2. "🎨 GPT" Button klicken → Deal Prep Page öffnet sich
3. Produktbild-Download prüfen
4. "ChatGPT-Prompt kopieren" klicken → Prompt ist im Clipboard
5. Test-Upload: 4 beliebige PNGs hochladen
6. Nach Upload: Deal soll `status='rendered'` haben (in Supabase prüfen)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Deal Prep page with ChatGPT prompt generator and slide upload"
git push
```

---

**Plan abgeschlossen wenn:**
- Login mit ADMIN_PASSWORD funktioniert
- /admin/deals zeigt alle Deals
- Approve/Reject ändert Status in Supabase
- "🎨 GPT" Button öffnet Deal Prep Page für Carousel-Deals
- ChatGPT-Prompt wird vollständig angezeigt und ist kopierbar
- Produktbild ist downloadbar
- 4-Slide-Upload funktioniert + Deal bekommt status='rendered'
- Nicht-eingeloggte User werden zu /admin/login redirectet
- `npx tsc --noEmit` → keine Fehler
