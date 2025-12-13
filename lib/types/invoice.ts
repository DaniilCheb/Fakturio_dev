export interface FromInfo {
  name: string
  street: string
  zip: string
  iban: string
  logo_url?: string
}

export interface ToInfo {
  uid?: string // Optional
  name: string
  address: string
  zip: string
}

export interface InvoiceItem {
  id: string
  quantity: number | string
  um: number | string // unit of measure
  description: string
  pricePerUm: number | string
  vat: number | string // percentage
  total?: number // calculated
}

export interface GuestInvoice {
  id: string
  invoice_number: string
  issued_on: string // ISO date
  due_date: string // ISO date
  currency: string
  payment_method: 'Bank' | 'Card' | 'Cash' | 'Other'
  from_info: FromInfo
  to_info: ToInfo
  description?: string // Optional
  items: InvoiceItem[]
  discount: number | string // percentage
  subtotal: number
  vat_amount: number
  total: number
  created_at: string
  updated_at: string
  qr_code_data_url?: string // Cached Swiss QR code
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'

