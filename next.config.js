/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'next.config.js:webpack-config-entry',message:'Webpack config entry',data:{workspacePath:process.cwd(),hasSpaces:process.cwd().includes(' '),hasSpecialChars:/[^a-zA-Z0-9\/\-_\.]/.test(process.cwd()),nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const nextConfig = {
  // Path alias is handled by tsconfig.json
  webpack: (config, { isServer, webpack }) => {
    // #region agent log
    const cacheDir = path.join(process.cwd(), '.next', 'cache');
    const cacheExists = fs.existsSync(cacheDir);
    let cacheStats = null;
    try {
      if (cacheExists) {
        cacheStats = fs.statSync(cacheDir);
      }
    } catch (e) {
      // Ignore
    }
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'next.config.js:webpack-cache-check',message:'Cache directory check',data:{cacheDir,cacheExists,isWritable:cacheExists?fs.accessSync(cacheDir,fs.constants.W_OK)?false:true:null,isServer,hasCacheConfig:!!config.cache},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // #region agent log
    try {
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      const nodeModulesExists = fs.existsSync(nodeModulesPath);
      let hasSymlinks = false;
      if (nodeModulesExists) {
        try {
          const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
          hasSymlinks = entries.some(entry => entry.isSymbolicLink());
        } catch (e) {
          // Ignore
        }
      }
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'next.config.js:webpack-symlink-check',message:'Symlink check in node_modules',data:{nodeModulesPath,nodeModulesExists,hasSymlinks},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    } catch (e) {
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'next.config.js:webpack-symlink-check-error',message:'Symlink check error',data:{error:e.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'next.config.js:webpack-config-before',message:'Webpack config before modification',data:{cacheType:config.cache?.type,cacheDirectory:config.cache?.cacheDirectory,hasResolveConfig:!!config.resolve,resolveModules:config.resolve?.modules?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Fix for jszip and other node modules that need to be bundled for client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'next.config.js:webpack-config-after',message:'Webpack config after modification',data:{cacheType:config.cache?.type,cacheDirectory:config.cache?.cacheDirectory,hasResolveConfig:!!config.resolve},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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
