import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Geil oder? — Täglich Deals, die wirklich geil sind',
    template: '%s | Geil oder?',
  },
  description: 'Täglich kuratierte Deals aus Fitness, Supplements, Home Gym und mehr.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geiloder.vercel.app'
  ),
  openGraph: {
    siteName: 'Geil oder?',
    locale: 'de_DE',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
