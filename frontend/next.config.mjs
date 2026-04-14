/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript: allow build with pre-existing type mismatches
  // TODO: Gradually fix all type errors then set to false
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable Next.js image optimization
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Standalone output for Docker / production deployment
  output: 'standalone',

  // Hide Next.js version fingerprint
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Production security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      {
        // Cache static assets for 1 year
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Redirect root to dashboard
  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: false },
    ];
  },
}

export default nextConfig
