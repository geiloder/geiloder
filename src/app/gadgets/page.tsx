import { DealGrid } from '@/components/deal-grid'
import { CategoryNav } from '@/components/category-nav'
import { getApprovedDeals } from '@/lib/supabase/queries'

export const revalidate = 300
export const metadata = { title: 'Gadget-Deals' }

export default async function GadgetsPage() {
  const deals = await getApprovedDeals({ limit: 48, kategorie: 'gadgets' })
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">⚡ Gadget-Deals</h1>
      <CategoryNav active="/gadgets" />
      <DealGrid deals={deals} />
    </div>
  )
}
