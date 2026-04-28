import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300
export const metadata = {
  title: 'Supplement-Deals',
  description: 'Täglich die besten Supplement-Deals: Protein, Creatine, Pre-Workout und mehr.',
}

export default async function SupplementsPage() {
  const deals = await getApprovedDeals({ limit: 48, kategorie: 'supplements' })
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">💊 Supplement-Deals</h1>
      <CategoryNav active="/supplements" />
      <DealGrid deals={deals} />
    </div>
  )
}
