import { format, parseISO, addDays, startOfYear, endOfYear } from 'date-fns'

/**
 * Format date to Swiss format (dd.MM.yyyy)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'dd.MM.yyyy')
  } catch {
    return ''
  }
}

/**
 * Format date to invoice format (d MMM, yyyy) e.g., "1 Aug, 2023"
 */
export function formatDateInvoice(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'd MMM, yyyy')
  } catch {
    return ''
  }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date | string | null | undefined): string {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

/**
 * Get current date as ISO string
 */
export function getCurrentDateISO(): string {
  return formatDateISO(new Date()) || ''
}

/**
 * Calculate due date from payment terms
 * @param issuedDate - The invoice issue date
 * @param paymentTerms - Payment terms like "14 days", "30 days", etc.
 */
export function calculateDueDate(issuedDate: string | Date, paymentTerms: string): string {
  try {
    const dateObj = typeof issuedDate === 'string' ? parseISO(issuedDate) : issuedDate
    const daysMatch = paymentTerms.match(/(\d+)/)
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 14
    const dueDate = addDays(dateObj, days)
    return formatDateISO(dueDate) || ''
  } catch {
    return ''
  }
}

/**
 * Parse payment terms string to get number of days
 */
export function parsePaymentTerms(paymentTerms: string): number {
  const daysMatch = paymentTerms.match(/(\d+)/)
  return daysMatch ? parseInt(daysMatch[1], 10) : 14
}

