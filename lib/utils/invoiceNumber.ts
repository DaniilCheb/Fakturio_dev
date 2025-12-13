const STORAGE_KEY = 'fakturio_invoice_sequence'

/**
 * Get next invoice number starting from 1
 */
export function getNextInvoiceNumber(): string {
  // Get stored sequence from localStorage
  const stored = localStorage.getItem(STORAGE_KEY)
  let sequence = 1
  
  if (stored) {
    try {
      const data = JSON.parse(stored)
      sequence = (data.sequence || 0) + 1
    } catch {
      // Invalid data, start fresh
    }
  }
  
  // Save updated sequence
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    sequence: sequence
  }))
  
  // Return simple sequential number (e.g., "1", "2", "3")
  return sequence.toString()
}

/**
 * Generate a unique invoice ID
 */
export function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

