'use client'

import { GuestInvoice } from '../types/invoice'

/**
 * Swiss QR Code data interface matching swissqrbill library
 */
export interface SwissQRData {
  creditor: {
    name: string
    address: string
    zip: string | number
    city: string
    country: string
    account: string // IBAN
  }
  debtor?: {
    name: string
    address: string
    zip: string | number
    city: string
    country: string
  }
  amount?: number
  currency: 'CHF' | 'EUR'
  reference?: string
  message?: string
}

/**
 * Validate Swiss IBAN format (CH or LI)
 * Swiss IBANs are 21 characters: CH + 2 check digits + 5 bank code + 12 account number
 */
export function validateSwissIBAN(iban: string): boolean {
  if (!iban) return false
  
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  // Check length (21 characters for CH/LI)
  if (cleanIBAN.length !== 21) return false
  
  // Check country code (CH or LI)
  if (!cleanIBAN.startsWith('CH') && !cleanIBAN.startsWith('LI')) return false
  
  // Basic format check: 2 letters + 19 alphanumeric
  const formatRegex = /^(CH|LI)[0-9]{2}[A-Z0-9]{17}$/
  if (!formatRegex.test(cleanIBAN)) return false
  
  // IBAN checksum validation (mod 97)
  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4)
  const numericIBAN = rearranged.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  )
  
  // Calculate mod 97 for large number
  let remainder = 0
  for (let i = 0; i < numericIBAN.length; i++) {
    remainder = (remainder * 10 + parseInt(numericIBAN[i], 10)) % 97
  }
  
  return remainder === 1
}

/**
 * Check if IBAN is a QR-IBAN (requires QR reference)
 */
export function isQRIBAN(iban: string): boolean {
  if (!iban) return false
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase()
  
  // QR-IBANs have IID (bank identifier) in range 30000-31999
  if (!cleanIBAN.startsWith('CH') && !cleanIBAN.startsWith('LI')) return false
  if (cleanIBAN.length !== 21) return false
  
  const iid = parseInt(cleanIBAN.slice(4, 9), 10)
  return iid >= 30000 && iid <= 31999
}

/**
 * Parse zip and city from combined string
 * Expected formats: "8000 Zürich" or "8000" or "Zürich"
 */
function parseZipCity(combined: string): { zip: string; city: string } {
  if (!combined) return { zip: '', city: '' }
  
  const trimmed = combined.trim()
  
  // Try to match "ZIP City" format
  const match = trimmed.match(/^(\d{4,6})\s+(.+)$/)
  if (match) {
    return { zip: match[1], city: match[2] }
  }
  
  // If only numbers, assume it's a zip
  if (/^\d+$/.test(trimmed)) {
    return { zip: trimmed, city: '' }
  }
  
  // Otherwise assume it's a city
  return { zip: '', city: trimmed }
}

/**
 * Build Swiss QR data from invoice
 */
export function buildSwissQRData(invoice: GuestInvoice): SwissQRData | null {
  // Validate required fields
  if (!invoice.from_info.iban) {
    console.warn('Cannot generate QR code: IBAN is required')
    return null
  }
  
  if (!validateSwissIBAN(invoice.from_info.iban)) {
    console.warn('Cannot generate QR code: Invalid Swiss IBAN')
    return null
  }
  
  const currency = invoice.currency as 'CHF' | 'EUR'
  if (currency !== 'CHF' && currency !== 'EUR') {
    console.warn('Cannot generate QR code: Currency must be CHF or EUR')
    return null
  }
  
  // Parse creditor (from) info
  const fromZipCity = parseZipCity(invoice.from_info.zip)
  
  // Parse debtor (to) info  
  const toZipCity = parseZipCity(invoice.to_info.zip)
  
  const data: SwissQRData = {
    creditor: {
      name: invoice.from_info.name || invoice.from_info.companyName || '',
      address: invoice.from_info.street || '',
      zip: fromZipCity.zip,
      city: fromZipCity.city,
      country: 'CH', // Default to Switzerland
      account: invoice.from_info.iban.replace(/\s/g, '').toUpperCase()
    },
    currency,
    amount: invoice.total,
    message: `Invoice ${invoice.invoice_number}`
  }
  
  // Add debtor if available
  if (invoice.to_info.name) {
    data.debtor = {
      name: invoice.to_info.name,
      address: invoice.to_info.address || '',
      zip: toZipCity.zip,
      city: toZipCity.city,
      country: 'CH'
    }
  }
  
  return data
}

/**
 * Generate Swiss QR code as SVG data URL
 * Uses swissqrbill library for compliant Swiss payment QR codes
 */
export async function generateSwissQRCode(invoice: GuestInvoice): Promise<string | null> {
  try {
    const qrData = buildSwissQRData(invoice)
    if (!qrData) return null
    
    // Dynamic import to avoid SSR issues
    const { SwissQRCode } = await import('swissqrbill/svg')
    
    // Create Swiss QR code (46mm is standard size)
    const qrCode = new SwissQRCode(qrData, 46)
    
    // Get SVG string
    const svgString = qrCode.toString()
    
    // Convert to data URL
    const base64 = btoa(unescape(encodeURIComponent(svgString)))
    const dataUrl = `data:image/svg+xml;base64,${base64}`
    
    return dataUrl
  } catch (error) {
    console.error('Error generating Swiss QR code:', error)
    return null
  }
}

/**
 * Generate a simple QR code fallback using qrcode library
 * Used when Swiss QR requirements aren't met
 */
export async function generateSimpleQRCode(text: string): Promise<string | null> {
  try {
    const QRCode = await import('qrcode')
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return null
  }
}

/**
 * Generate appropriate QR code for invoice
 * Returns Swiss QR if valid, otherwise falls back to simple QR
 */
export async function generateInvoiceQRCode(invoice: GuestInvoice): Promise<{
  dataUrl: string | null
  type: 'swiss' | 'simple' | 'none'
  error?: string
}> {
  // Check if Swiss QR is possible
  if (invoice.from_info.iban && validateSwissIBAN(invoice.from_info.iban)) {
    if (invoice.currency === 'CHF' || invoice.currency === 'EUR') {
      const dataUrl = await generateSwissQRCode(invoice)
      if (dataUrl) {
        return { dataUrl, type: 'swiss' }
      }
    }
  }
  
  // Fallback to simple QR with payment info
  const paymentInfo = [
    `Invoice: ${invoice.invoice_number}`,
    `Amount: ${invoice.currency} ${invoice.total.toFixed(2)}`,
    invoice.from_info.iban ? `IBAN: ${invoice.from_info.iban}` : '',
    `Due: ${invoice.due_date}`
  ].filter(Boolean).join('\n')
  
  const dataUrl = await generateSimpleQRCode(paymentInfo)
  if (dataUrl) {
    return { dataUrl, type: 'simple' }
  }
  
  return { dataUrl: null, type: 'none', error: 'Failed to generate QR code' }
}

