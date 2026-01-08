import { z } from 'zod'

/**
 * Validation schema for updating an expense
 */
export const updateExpenseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.enum(['Office', 'Travel', 'Software', 'Equipment', 'Marketing', 'Professional Services', 'Other']).optional(),
  type: z.enum(['one-time', 'recurring', 'asset']).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().length(3).optional(), // ISO 4217 currency code
  vat_amount: z.number().min(0).nullable().optional(),
  vat_rate: z.number().min(0).max(100).nullable().optional(),
  exchange_rate: z.number().positive().optional(),
  amount_in_account_currency: z.number().min(0).optional(),
  date: z.string().date().optional(),
  end_date: z.string().date().nullable().optional(),
  frequency: z.enum(['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Other']).nullable().optional(),
  depreciation_years: z.number().int().positive().max(100).nullable().optional(),
  receipt_url: z.string().url().max(500).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
})

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

