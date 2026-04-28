import Link from 'next/link'
import { LogoutButton } from '@/components/admin/logout-button'

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
        <LogoutButton />
      </nav>
      <div className="p-6">{children}</div>
    </div>
  )
}
