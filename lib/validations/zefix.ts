import { z } from 'zod'

/**
 * Validation schema for Zefix search
 */
export const zefixSearchSchema = z.object({
  name: z.string().min(3).max(100),
})

/**
 * Validation schema for Zefix UID lookup
 */
export const zefixUidSchema = z.object({
  uid: z.string().min(1).max(20),
})

