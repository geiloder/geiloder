import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300
export const metadata = { title: 'Gymwear-Deals' }

export default async function GymwearPage() {
  const deals = await getApprovedDeals({ limit: 48, kategorie: 'gymwear' })
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">👕 Gymwear-Deals</h1>
      <CategoryNav active="/gymwear" />
      <DealGrid deals={deals} />
    </div>
  )
}
