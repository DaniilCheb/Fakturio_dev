/** @type {import('next').NextConfig} */
const nextConfig = {
  // Path alias is handled by tsconfig.json
  webpack: (config, { isServer }) => {
    // Fix for jszip and other node modules that need to be bundled for client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ]

    // Add HSTS header in production
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      })
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
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
          ...securityHeaders, // Include all security headers
        ],
      },
    ]
  },
}

// Only wrap with Sentry if DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = require("@sentry/nextjs");
  
  module.exports = withSentryConfig(
    nextConfig,
    {
      // Suppresses source map uploading logs during build
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    },
    {
      // Upload a larger set of source maps for better debugging
      widenClientFileUpload: true,
      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: true,
      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
      tunnelRoute: "/monitoring",
      // Hides source maps from generated client bundles
      hideSourceMaps: true,
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
      // Enables automatic instrumentation of Vercel Cron Monitors
      automaticVercelMonitors: true,
    }
  );
} else {
  module.exports = nextConfig;
}
