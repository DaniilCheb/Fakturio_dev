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
 * Validate a single invoice item
 */
function validateItem(item: InvoiceItem): boolean {
  const qty = parseFloat(String(item.quantity)) || 0
  const um = parseFloat(String(item.um)) || 0
  const price = parseFloat(String(item.pricePerUm)) || 0
  const description = String(item.description || '').trim()
  
  return qty > 0 && um > 0 && price > 0 && description.length > 0
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

  if (!invoice.from_info?.iban || !invoice.from_info.iban.trim()) {
    errors.fromIban = 'IBAN is required'
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

