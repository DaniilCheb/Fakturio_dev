import { GuestInvoice } from '../types/invoice'
import { generateInvoiceId } from '../utils/invoiceNumber'

const STORAGE_KEY = 'fakturio_guest_invoices'

/**
 * Get all guest invoices from localStorage
 */
export function getAllGuestInvoices(): GuestInvoice[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as GuestInvoice[]
  } catch {
    return []
  }
}

/**
 * Save invoice to localStorage
 */
export function saveGuestInvoice(invoice: Omit<GuestInvoice, 'id' | 'created_at' | 'updated_at'>): GuestInvoice {
  const invoices = getAllGuestInvoices()
  const now = new Date().toISOString()
  
  const newInvoice: GuestInvoice = {
    ...invoice,
    id: generateInvoiceId(),
    created_at: now,
    updated_at: now
  }
  
  invoices.push(newInvoice)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
  
  return newInvoice
}

/**
 * Update existing invoice in localStorage
 */
export function updateGuestInvoice(id: string, updates: Partial<GuestInvoice>): GuestInvoice | null {
  const invoices = getAllGuestInvoices()
  const index = invoices.findIndex(inv => inv.id === id)
  
  if (index === -1) return null
  
  invoices[index] = {
    ...invoices[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
  return invoices[index]
}

/**
 * Get invoice by ID
 */
export function getGuestInvoiceById(id: string): GuestInvoice | null {
  const invoices = getAllGuestInvoices()
  return invoices.find(inv => inv.id === id) || null
}

/**
 * Delete invoice from localStorage
 */
export function deleteGuestInvoice(id: string): boolean {
  const invoices = getAllGuestInvoices()
  const filtered = invoices.filter(inv => inv.id !== id)
  
  if (filtered.length === invoices.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

