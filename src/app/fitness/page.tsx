import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300
export const metadata = { title: 'Fitness-Deals' }

export default async function FitnessPage() {
  const deals = await getApprovedDeals({ limit: 48, kategorie: 'fitness' })
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">🏋️ Fitness-Deals</h1>
      <CategoryNav active="/fitness" />
      <DealGrid deals={deals} />
    </div>
  )
}
