/**
 * Standardized API error handling
 * Prevents information leakage in production while providing useful details in development
 */

export interface ApiErrorResponse {
  error: string
  details?: string
  stack?: string
}

/**
 * Create a standardized error response
 * In production, only returns safe error messages
 * In development, includes full error details and stack traces
 */
export function apiError(
  error: unknown,
  fallback = 'An error occurred'
): ApiErrorResponse {
  const isDev = process.env.NODE_ENV === 'development'
  const message = error instanceof Error ? error.message : String(error)

  const response: ApiErrorResponse = {
    error: isDev ? message : fallback,
  }

  // Only include details and stack in development
  if (isDev) {
    if (error instanceof Error && error.stack) {
      response.stack = error.stack
    }
    // Include additional details if available
    if (error instanceof Error && error.cause) {
      response.details = String(error.cause)
    }
  }

  return response
}

/**
 * Create a standardized error response for NextResponse
 */
export function createErrorResponse(
  error: unknown,
  status: number,
  fallback = 'An error occurred'
): Response {
  const errorResponse = apiError(error, fallback)
  return Response.json(errorResponse, { status })
}

