/**
 * Recurring Invoice Service
 * CRUD operations for recurring invoices
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient, getCurrentUserId } from '../supabase-server'
import { saveInvoiceWithClient } from './invoiceService'
import type { CreateInvoiceInput } from './invoiceService'

export interface RecurringInvoice {
  id: string
  user_id: string
  contact_id?: string
  project_id?: string
  bank_account_id?: string
  currency: string
  from_info: Record<string, any>
  to_info: Record<string, any>
  items: Array<Record<string, any>>
  notes?: string
  payment_terms: string
  vat_rate: number
  subtotal: number
  vat_amount: number
  total: number
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  day_of_month?: number
  next_run_date: string
  end_date?: string
  is_active: boolean
  auto_send: boolean
  last_run_date?: string
  invoices_created: number
  created_at: string
  updated_at: string
}

export interface CreateRecurringInvoiceInput {
  contact_id?: string
  project_id?: string
  bank_account_id?: string
  currency?: string
  from_info: Record<string, any>
  to_info: Record<string, any>
  items: Array<Record<string, any>>
  notes?: string
  payment_terms: string
  vat_rate: number
  subtotal: number
  vat_amount: number
  total: number
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  day_of_month?: number
  next_run_date: string
  end_date?: string
  auto_send?: boolean
}

/**
 * Calculate next run date based on frequency
 */
export function calculateNextRunDate(
  fromDate: string,
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): string {
  const date = new Date(fromDate)
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }
  
  return date.toISOString().split('T')[0]
}

/**
 * Calculate due date from issued date and payment terms
 */
function calculateDueDate(issuedDate: string, paymentTerms: string): string {
  const date = new Date(issuedDate)
  const daysMatch = paymentTerms.match(/(\d+)\s*days?/i)
  const days = daysMatch ? parseInt(daysMatch[1], 10) : 30
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * Get all recurring invoices for current user
 */
export async function getRecurringInvoices(): Promise<RecurringInvoice[]> {
  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recurring invoices:', error)
    throw new Error('Failed to fetch recurring invoices')
  }

  return data || []
}

/**
 * Get recurring invoice by ID
 */
export async function getRecurringInvoiceById(
  id: string
): Promise<RecurringInvoice | null> {
  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching recurring invoice:', error)
    throw new Error('Failed to fetch recurring invoice')
  }

  return data
}

/**
 * Create recurring invoice
 */
export async function createRecurringInvoice(
  input: CreateRecurringInvoiceInput
): Promise<RecurringInvoice> {
  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('recurring_invoices')
    .insert({
      user_id: userId,
      contact_id: input.contact_id,
      project_id: input.project_id,
      bank_account_id: input.bank_account_id,
      currency: input.currency || 'CHF',
      from_info: input.from_info,
      to_info: input.to_info,
      items: input.items,
      notes: input.notes,
      payment_terms: input.payment_terms,
      vat_rate: input.vat_rate,
      subtotal: input.subtotal,
      vat_amount: input.vat_amount,
      total: input.total,
      frequency: input.frequency,
      day_of_month: input.day_of_month,
      next_run_date: input.next_run_date,
      end_date: input.end_date,
      auto_send: input.auto_send || false,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating recurring invoice:', error)
    throw new Error('Failed to create recurring invoice')
  }

  return data
}

/**
 * Update recurring invoice
 */
export async function updateRecurringInvoice(
  id: string,
  updates: Partial<CreateRecurringInvoiceInput>
): Promise<RecurringInvoice> {
  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('recurring_invoices')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating recurring invoice:', error)
    throw new Error('Failed to update recurring invoice')
  }

  return data
}

/**
 * Delete recurring invoice
 */
export async function deleteRecurringInvoice(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('recurring_invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting recurring invoice:', error)
    throw new Error('Failed to delete recurring invoice')
  }
}

/**
 * Generate invoice from recurring template
 */
export async function generateInvoiceFromRecurring(
  recurringId: string
): Promise<string> {
  const recurring = await getRecurringInvoiceById(recurringId)
  
  if (!recurring) {
    throw new Error('Recurring invoice not found')
  }

  if (!recurring.is_active) {
    throw new Error('Recurring invoice is not active')
  }

  const today = new Date().toISOString().split('T')[0]
  if (recurring.next_run_date > today) {
    throw new Error('Recurring invoice is not due yet')
  }

  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  // Create invoice from template
  const invoiceData: CreateInvoiceInput = {
    contact_id: recurring.contact_id!,
    project_id: recurring.project_id,
    bank_account_id: recurring.bank_account_id!,
    status: 'issued',
    currency: recurring.currency,
    issued_on: today,
    due_date: calculateDueDate(today, recurring.payment_terms),
    from_info: recurring.from_info,
    to_info: recurring.to_info,
    items: recurring.items,
    notes: recurring.notes,
    payment_terms: recurring.payment_terms,
    vat_rate: recurring.vat_rate,
    subtotal: recurring.subtotal,
    vat_amount: recurring.vat_amount,
    total: recurring.total,
  }

  const invoice = await saveInvoiceWithClient(supabase, userId, invoiceData)

  // Update recurring invoice
  const nextRunDate = calculateNextRunDate(today, recurring.frequency)
  await updateRecurringInvoice(recurringId, {
    last_run_date: today,
    next_run_date: nextRunDate,
    invoices_created: recurring.invoices_created + 1,
  })

  // Auto-send if enabled
  if (recurring.auto_send && recurring.to_info?.email) {
    try {
      const { sendInvoiceEmail } = await import('./emailService')
      await sendInvoiceEmail(invoice.id, recurring.to_info.email)
    } catch (error) {
      console.error('Error auto-sending invoice:', error)
      // Don't fail the generation if email fails
    }
  }

  return invoice.id
}

