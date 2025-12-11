const STORAGE_KEY = 'fakturio_invoice_sequence'

/**
 * Get current year
 */
function getCurrentYear(): string {
  return new Date().getFullYear().toString()
}

/**
 * Get next invoice number in format YYYY-NN
 */
export function getNextInvoiceNumber(): string {
  const currentYear = getCurrentYear()
  
  // Get stored sequence from localStorage
  const stored = localStorage.getItem(STORAGE_KEY)
  let sequence = 1
  
  if (stored) {
    try {
      const data = JSON.parse(stored)
      // If same year, increment sequence
      if (data.year === currentYear) {
        sequence = data.sequence + 1
      }
      // If different year, reset to 1
    } catch {
      // Invalid data, start fresh
    }
  }
  
  // Save updated sequence
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    year: currentYear,
    sequence: sequence
  }))
  
  // Format: YYYY-NN (e.g., 2025-01, 2025-02)
  const paddedSequence = sequence.toString().padStart(2, '0')
  return `${currentYear}-${paddedSequence}`
}

/**
 * Generate a unique invoice ID
 */
export function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

