import { getAllGuestInvoices } from '../services/guestInvoiceService'

/**
 * Get next invoice number in YYYY-NN format for guest invoices
 * Always starts with current year and increments sequence (e.g., 2025-01, 2025-02)
 */
export function getNextInvoiceNumber(): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    const currentYear = new Date().getFullYear()
    return `${currentYear}-01`
  }

  const invoices = getAllGuestInvoices()
  const currentYear = new Date().getFullYear()
  
  // Find all invoice numbers for the current year
  const yearInvoices = invoices
    .map(inv => inv.invoice_number || '')
    .filter(num => {
      // Match YYYY-NN format
      const match = num.match(/^(\d{4})-(\d{2})$/)
      return match && parseInt(match[1], 10) === currentYear
    })
  
  // Extract the sequence numbers
  const sequenceNumbers = yearInvoices
    .map(num => {
      const parts = num.split('-')
      return parts.length >= 2 ? parseInt(parts[1], 10) : 0
    })
    .filter(n => !isNaN(n) && n > 0)
  
  // Find the highest number
  const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0
  
  // Generate next number with zero padding
  const nextSequence = maxSequence + 1
  const paddedSequence = nextSequence.toString().padStart(2, '0')
  
  return `${currentYear}-${paddedSequence}`
}

/**
 * Generate a unique invoice ID
 */
export function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

