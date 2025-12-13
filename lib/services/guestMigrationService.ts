/**
 * Guest Migration Service
 * Migrates guest data from localStorage to Supabase on first sign-in
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { GuestInvoice } from '../types/invoice'
import { saveContactWithClient, type CreateContactInput } from './contactService.client'
import { saveBankAccountWithClient, getBankAccountsWithClient, type CreateBankAccountInput } from './bankAccountService.client'
import { saveInvoiceWithClient, type CreateInvoiceInput } from './invoiceService.client'
import { updateUserProfileWithClient, getUserProfileWithClient } from './settingsService.client'

const GUEST_INVOICES_KEY = 'fakturio_guest_invoices'

/**
 * Check if there's guest data to migrate
 */
export function hasGuestData(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem(GUEST_INVOICES_KEY)
    if (!stored) return false
    
    const invoices = JSON.parse(stored) as GuestInvoice[]
    return invoices.length > 0
  } catch {
    return false
  }
}

/**
 * Get guest invoices from localStorage
 */
function getGuestInvoices(): GuestInvoice[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(GUEST_INVOICES_KEY)
    if (!stored) return []
    return JSON.parse(stored) as GuestInvoice[]
  } catch {
    return []
  }
}

/**
 * Clear guest data from localStorage
 */
export function clearGuestData(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(GUEST_INVOICES_KEY)
  } catch {
    // Ignore errors
  }
}

/**
 * Create a unique key for a contact based on name and address
 */
function getContactKey(toInfo: { name: string; address: string; zip: string }): string {
  return `${toInfo.name.toLowerCase().trim()}|${toInfo.address.toLowerCase().trim()}|${toInfo.zip.trim()}`
}

/**
 * Create a unique key for a bank account based on IBAN
 */
function getBankAccountKey(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}

/**
 * Migrate all guest data to Supabase
 */
export async function migrateGuestData(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): Promise<{ invoiceCount: number; contactCount: number; bankAccountCount: number }> {
  const guestInvoices = getGuestInvoices()
  
  if (guestInvoices.length === 0) {
    return { invoiceCount: 0, contactCount: 0, bankAccountCount: 0 }
  }

  // Track created entities to avoid duplicates
  const contactMap = new Map<string, string>() // key -> contact_id
  const bankAccountMap = new Map<string, string>() // iban -> bank_account_id
  
  let contactCount = 0
  let bankAccountCount = 0
  let invoiceCount = 0

  // Get existing bank accounts
  const existingBankAccounts = await getBankAccountsWithClient(supabase, userId)
  for (const account of existingBankAccounts) {
    bankAccountMap.set(getBankAccountKey(account.iban), account.id)
  }

  // Pre-fill profile from first invoice's from_info if profile doesn't exist
  const firstInvoice = guestInvoices[0]
  const existingProfile = await getUserProfileWithClient(supabase, userId)
  
  if (!existingProfile) {
    try {
      const fromInfo = firstInvoice.from_info
      await updateUserProfileWithClient(supabase, userId, {
        email: userEmail,
        name: fromInfo.name || undefined,
        address: fromInfo.street || undefined,
        postal_code: fromInfo.zip || undefined,
        country: 'Switzerland',
      })
    } catch (error) {
      console.warn('Failed to create profile from guest data:', error)
    }
  }

  // Process each guest invoice
  for (const guestInvoice of guestInvoices) {
    try {
      // 1. Create or get contact from to_info
      const contactKey = getContactKey(guestInvoice.to_info)
      let contactId = contactMap.get(contactKey)
      
      if (!contactId) {
        const contactInput: CreateContactInput = {
          type: 'customer',
          name: guestInvoice.to_info.name,
          address: guestInvoice.to_info.address,
          postal_code: guestInvoice.to_info.zip,
          vat_number: guestInvoice.to_info.uid || undefined,
          country: 'Switzerland',
        }
        
        const contact = await saveContactWithClient(supabase, userId, contactInput)
        contactId = contact.id
        contactMap.set(contactKey, contactId)
        contactCount++
      }

      // 2. Create or get bank account from from_info.iban
      const iban = guestInvoice.from_info.iban
      const ibanKey = getBankAccountKey(iban)
      let bankAccountId = bankAccountMap.get(ibanKey)
      
      if (!bankAccountId && iban) {
        const bankAccountInput: CreateBankAccountInput = {
          name: 'Main Account',
          iban: iban,
          is_default: bankAccountMap.size === 0, // First account is default
        }
        
        const bankAccount = await saveBankAccountWithClient(supabase, userId, bankAccountInput)
        bankAccountId = bankAccount.id
        bankAccountMap.set(ibanKey, bankAccountId)
        bankAccountCount++
      }

      // 3. Create invoice
      if (contactId && bankAccountId) {
        // Calculate VAT rate from items (use first item's VAT or default)
        const vatRate = guestInvoice.items.length > 0 
          ? parseFloat(String(guestInvoice.items[0].vat)) || 0
          : 0

        // Calculate payment terms from dates
        const issuedDate = new Date(guestInvoice.issued_on)
        const dueDate = new Date(guestInvoice.due_date)
        const daysDiff = Math.ceil((dueDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24))
        const paymentTerms = `${daysDiff} days`

        const invoiceInput: CreateInvoiceInput = {
          contact_id: contactId,
          bank_account_id: bankAccountId,
          invoice_number: guestInvoice.invoice_number,
          status: 'issued',
          currency: guestInvoice.currency || 'CHF',
          issued_on: guestInvoice.issued_on,
          due_date: guestInvoice.due_date,
          subtotal: guestInvoice.subtotal,
          vat_amount: guestInvoice.vat_amount,
          vat_rate: vatRate,
          total: guestInvoice.total,
          from_info: guestInvoice.from_info,
          to_info: guestInvoice.to_info,
          items: guestInvoice.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            um: item.um,
            description: item.description,
            pricePerUm: item.pricePerUm,
            vat: item.vat,
            total: item.total,
          })),
          notes: guestInvoice.description || undefined,
          payment_terms: paymentTerms,
        }

        await saveInvoiceWithClient(supabase, userId, invoiceInput)
        invoiceCount++
      }
    } catch (error) {
      console.error('Failed to migrate invoice:', guestInvoice.id, error)
      // Continue with other invoices
    }
  }

  return { invoiceCount, contactCount, bankAccountCount }
}

