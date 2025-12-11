/**
 * Format a number to 2 decimal places
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

/**
 * Format currency value with proper formatting
 */
export function formatCurrency(value: number | string | undefined | null, currency: string = 'CHF'): string {
  const formatted = formatNumber(value)
  return `${currency} ${formatted}`
}

/**
 * Format number with Swiss formatting (space as thousand separator)
 */
export function formatSwissNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00'
  
  const parts = num.toFixed(2).split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${integerPart}.${parts[1]}`
}

/**
 * Format currency with Swiss formatting
 */
export function formatSwissCurrency(value: number | string | undefined | null, currency: string = 'CHF'): string {
  const formatted = formatSwissNumber(value)
  return `${currency} ${formatted}`
}

