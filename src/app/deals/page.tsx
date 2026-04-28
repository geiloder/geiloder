import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300

export const metadata = {
  title: 'Alle Deals',
  description: 'Alle aktuellen Deals. Täglich aktualisiert.',
}

export default async function DealsPage() {
  const deals = await getApprovedDeals({ limit: 48 })
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">Alle Deals</h1>
      <CategoryNav active="/deals" />
      <DealGrid deals={deals} />
    </div>
  )
}
