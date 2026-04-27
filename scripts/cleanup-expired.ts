import { config } from 'dotenv'
config({ path: '.env.local' })
import { createServiceClient } from '../src/lib/supabase/server'

async function cleanupExpiredDeals() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('deals')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .not('status', 'eq', 'expired')
    .select('id')

  if (error) {
    console.error('Cleanup error:', error.message)
    return
  }

  console.log(`Marked ${data?.length ?? 0} deals as expired`)
}

cleanupExpiredDeals().catch(console.error)
