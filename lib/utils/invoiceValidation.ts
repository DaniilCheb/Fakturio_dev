import { GuestInvoice, InvoiceItem } from '../types/invoice'

export interface ValidationErrors {
  invoice_number?: string
  issued_on?: string
  due_date?: string
  currency?: string
  payment_method?: string
  fromName?: string
  fromStreet?: string
  fromZip?: string
  fromIban?: string
  toName?: string
  toAddress?: string
  toZip?: string
  items?: string
  [key: string]: string | undefined
}

/**
 * Validate IBAN format
 * Supports international IBANs with mod-97 checksum validation
 * Format: 2 letter country code + 2 check digits + bank account number (up to 30 chars)
 * IBAN is optional - only validates format if provided
 */
export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  // IBAN is optional - if empty, it's valid
  if (!iban || !iban.trim()) {
    return { valid: true }
  }
  
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  // Check minimum length (smallest IBANs are 15 chars, e.g. Norway)
  if (cleanIBAN.length < 15) {
    return { valid: false, error: 'IBAN is too short' }
  }
  
  // Check maximum length (34 characters max)
  if (cleanIBAN.length > 34) {
    return { valid: false, error: 'IBAN is too long' }
  }
  
  // Check format: 2 letters + 2 digits + alphanumeric
  const formatRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/
  if (!formatRegex.test(cleanIBAN)) {
    return { valid: false, error: 'Invalid IBAN format. Must start with country code (e.g., CH, DE) followed by digits' }
  }
  
  // IBAN checksum validation (mod 97)
  // Move first 4 chars to end and convert letters to numbers (A=10, B=11, etc.)
  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4)
  const numericIBAN = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  )
  
  // Calculate mod 97 for large number (handle as string to avoid integer overflow)
  let remainder = 0
  for (let i = 0; i < numericIBAN.length; i++) {
    remainder = (remainder * 10 + parseInt(numericIBAN[i], 10)) % 97
  }
  
  if (remainder !== 1) {
    return { valid: false, error: 'Invalid IBAN checksum. Please verify your IBAN number' }
  }
  
  return { valid: true }
}

/**
 * Validate a single invoice item
 * Note: um (unit of measure) is now optional - it's a label, not a multiplier
 */
function validateItem(item: InvoiceItem): boolean {
  const qty = parseFloat(String(item.quantity)) || 0
  const price = parseFloat(String(item.pricePerUm)) || 0
  const description = String(item.description || '').trim()
  
  return qty > 0 && price > 0 && description.length > 0
}

/**
 * Validate guest invoice data
 * All fields are required except:
 * - description (optional)
 * - to_info.uid (optional)
 */
export function validateInvoice(invoice: Partial<GuestInvoice>): {
  isValid: boolean
  errors: ValidationErrors
} {
  const errors: ValidationErrors = {}

  // Invoice header fields
  if (!invoice.invoice_number || !invoice.invoice_number.trim()) {
    errors.invoice_number = 'Invoice number is required'
  }

  if (!invoice.issued_on) {
    errors.issued_on = 'Issued date is required'
  }

  if (!invoice.due_date) {
    errors.due_date = 'Due date is required'
  }

  if (!invoice.currency) {
    errors.currency = 'Currency is required'
  }

  if (!invoice.payment_method) {
    errors.payment_method = 'Payment method is required'
  }

  // From section (all required)
  if (!invoice.from_info?.name || !invoice.from_info.name.trim()) {
    errors.fromName = 'Your name is required'
  }

  if (!invoice.from_info?.street || !invoice.from_info.street.trim()) {
    errors.fromStreet = 'Street is required'
  }

  if (!invoice.from_info?.zip || !invoice.from_info.zip.trim()) {
    errors.fromZip = 'ZIP / City is required'
  }

  // IBAN validation with format checking (optional - only validates if provided)
  if (invoice.from_info?.iban) {
    const ibanValidation = validateIBAN(invoice.from_info.iban)
    if (!ibanValidation.valid) {
      errors.fromIban = ibanValidation.error
    }
  }

  // To section (UID is optional, others required)
  if (!invoice.to_info?.name || !invoice.to_info.name.trim()) {
    errors.toName = 'Name is required'
  }

  if (!invoice.to_info?.address || !invoice.to_info.address.trim()) {
    errors.toAddress = 'Address is required'
  }

  if (!invoice.to_info?.zip || !invoice.to_info.zip.trim()) {
    errors.toZip = 'ZIP / City is required'
  }

  // Items validation - at least one valid item required
  if (!invoice.items || invoice.items.length === 0) {
    errors.items = 'At least one item is required'
  } else {
    const hasValidItem = invoice.items.some(item => validateItem(item))
    if (!hasValidItem) {
      errors.items = 'At least one valid item is required (with quantity, unit, price, and description)'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

