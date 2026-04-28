import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300
export const metadata = { title: 'Home Gym Deals' }

export default async function HomeGymPage() {
  const deals = await getApprovedDeals({ limit: 48, kategorie: 'home-gym' })
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">🏠 Home Gym Deals</h1>
      <CategoryNav active="/home-gym" />
      <DealGrid deals={deals} />
    </div>
  )
}
