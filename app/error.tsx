'use client'

import { useEffect } from 'react'
import Button from '@/app/components/Button'
import { Card } from '@/app/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
    
    // Log to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error)
      })
    }
  }, [error])

  return (
    <div className="min-h-screen bg-design-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-design-content-default mb-2">
            Something went wrong
          </h1>
          <p className="text-design-content-weak">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-design-surface-field rounded-lg text-left">
            <p className="text-sm font-mono text-design-content-weak break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-design-content-weakest mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            variant="primary"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go home
          </Button>
        </div>
      </Card>
    </div>
  )
}

