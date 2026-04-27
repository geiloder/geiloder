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
    ],
  },
}

export default nextConfig;
