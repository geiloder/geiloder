import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300

export default async function HomePage() {
  let deals: Awaited<ReturnType<typeof getApprovedDeals>> = []
  let dbError: string | null = null
  try {
    deals = await getApprovedDeals({ limit: 24 })
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Geil oder? <span className="text-zinc-400 font-normal text-lg">Tägliche Deals</span>
        </h1>
        <p className="mt-1 text-zinc-500 text-sm">
          Täglich kuratierte Fitness-Deals. Nicht weil du musst. Sondern weil Vollpreis keine Lösung ist.
        </p>
      </div>

      {dbError && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          DB Error: {dbError}
        </div>
      )}
      <CategoryNav active="/deals" />
      <DealGrid deals={deals} />
    </div>
  )
}
