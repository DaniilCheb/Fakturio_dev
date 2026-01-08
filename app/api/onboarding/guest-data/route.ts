import { NextResponse } from 'next/server'
import { getGuestCacheData } from '@/lib/services/guestCacheService'

/**
 * GET /api/onboarding/guest-data
 * Retrieve guest cache data for onboarding pre-fill
 * This is a client-side only operation, but we expose it as an API route
 * for consistency and potential future server-side processing
 */
export async function GET() {
  try {
    // This will only work on client-side, but we can return the structure
    // The actual data will be read from localStorage on the client
    const cacheData = getGuestCacheData()
    
    return NextResponse.json(cacheData)
  } catch (error) {
    console.error('Error retrieving guest cache data:', error)
    return NextResponse.json(
      { 
        profile: null, 
        bank: null, 
        hasData: false,
        source_invoice_id: null,
        last_updated: null,
      },
      { status: 200 } // Return empty data instead of error
    )
  }
}




