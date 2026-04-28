import Link from 'next/link'

const CATEGORIES = [
  { href: '/deals', label: 'Alle' },
  { href: '/supplements', label: '💊 Supplements' },
  { href: '/fitness', label: '🏋️ Fitness' },
  { href: '/home-gym', label: '🏠 Home Gym' },
  { href: '/gadgets', label: '⚡ Gadgets' },
  { href: '/gymwear', label: '👕 Gymwear' },
]

export function CategoryNav({ active }: { active?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {CATEGORIES.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === href
              ? 'bg-green-400 text-black'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
