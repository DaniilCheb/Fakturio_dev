import { z } from 'zod'

/**
 * Validation schema for updating an invoice
 */
export const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'issued', 'paid', 'overdue', 'cancelled']).optional(),
  invoice_number: z.string().min(1).max(50).optional(),
  issued_on: z.string().date().optional(),
  due_date: z.string().date().optional(),
  paid_date: z.string().date().nullable().optional(),
  currency: z.string().length(3).optional(), // ISO 4217 currency code
  contact_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  bank_account_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  from_info: z.record(z.string(), z.any()).optional(),
  to_info: z.record(z.string(), z.any()).optional(),
  items: z.array(z.record(z.string(), z.any())).optional(),
  subtotal: z.number().min(0).optional(),
  vat_amount: z.number().min(0).optional(),
  vat_rate: z.number().min(0).max(100).optional(),
  total: z.number().min(0).optional(),
  exchange_rate: z.number().positive().optional(),
  amount_in_account_currency: z.number().min(0).optional(),
  payment_terms: z.string().max(500).optional(),
})

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>

