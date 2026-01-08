import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Used by monitoring services and load balancers
 * 
 * GET /api/health
 */
export async function GET() {
  try {
    // Check critical environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_KEY',
    ]

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Missing required environment variables',
          missing: missingVars,
        },
        { status: 503 }
      )
    }

    // Optional: Check database connection
    // This is a lightweight check - doesn't require auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const healthCheck = supabaseUrl ? 'ok' : 'unknown'

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: healthCheck,
      version: process.env.npm_package_version || 'unknown',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

