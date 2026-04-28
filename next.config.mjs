/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.awin.com' },
      { protocol: 'https', hostname: '**.adcell.de' },
      { protocol: 'https', hostname: '**.amazon.de' },
      { protocol: 'https', hostname: '**.amazon.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.more-nutrition.de' },
      { protocol: 'https', hostname: 'more-nutrition.de' },
      { protocol: 'https', hostname: 'esn.com' },
      { protocol: 'https', hostname: '**.esn.com' },
      // Broad fallback for affiliate CDNs — tighten in production
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig;
