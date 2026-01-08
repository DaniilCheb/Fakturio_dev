/**
 * Simple in-memory rate limiter
 * For production, consider upgrading to Upstash Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup() {
    const now = Date.now()
    // Use Array.from to avoid iteration issues with TypeScript target
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }

  limit(identifier: string): { success: boolean; remaining: number; reset: number } {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return {
        success: true,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetTime,
      }
    }

    entry.count++
    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Rate limiter for Zefix API: 10 requests per 60 seconds per IP
export const zefixRateLimiter = new RateLimiter(10, 60000)

