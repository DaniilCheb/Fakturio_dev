import { z } from 'zod'

/**
 * Validation schema for sending invoice email
 */
export const sendInvoiceEmailSchema = z.object({
  recipientEmail: z.string().email().max(255),
})

