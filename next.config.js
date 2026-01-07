/** @type {import('next').NextConfig} */
const nextConfig = {
  // Path alias is handled by tsconfig.json
  async headers() {
    return [
      {
        source: '/invoice/view/:token*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer', // Don't leak token in referrer
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow', // Don't index invoice pages
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store', // Don't cache
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
