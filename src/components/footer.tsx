import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 text-sm text-zinc-500">
          <div>
            <p className="font-bold text-white mb-1">Geil oder?</p>
            <p>Täglich Deals, die wirklich geil sind.</p>
          </div>
          <div className="flex flex-col gap-1">
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
            <Link href="/affiliate-hinweis" className="hover:text-white transition-colors">Affiliate-Hinweis</Link>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-600">
          Diese Seite enthält Affiliate-Links. Wenn du über einen Link kaufst, erhalten wir ggf. eine Provision. Für dich ändert sich der Preis nicht. Preise können sich ändern. Angaben ohne Gewähr.
        </div>
      </div>
    </footer>
  )
}
