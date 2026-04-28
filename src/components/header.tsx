import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-white">
          Geil oder?
        </Link>
        <nav className="hidden md:flex gap-6 text-sm text-zinc-400">
          <Link href="/deals" className="hover:text-white transition-colors">Alle Deals</Link>
          <Link href="/supplements" className="hover:text-white transition-colors">Supplements</Link>
          <Link href="/fitness" className="hover:text-white transition-colors">Fitness</Link>
          <Link href="/home-gym" className="hover:text-white transition-colors">Home Gym</Link>
          <Link href="/gadgets" className="hover:text-white transition-colors">Gadgets</Link>
        </nav>
      </div>
    </header>
  )
}
