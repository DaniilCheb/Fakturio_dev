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
  console.log('[QR Code] Building Swiss QR data from invoice:', {
    hasFromInfo: !!invoice.from_info,
    hasIban: !!invoice.from_info?.iban,
    currency: invoice.currency,
    total: invoice.total
  })

  // Validate required fields
  if (!invoice.from_info?.iban) {
    console.warn('[QR Code] Cannot generate Swiss QR code: IBAN is required')
    return null
  }
  
  if (!validateSwissIBAN(invoice.from_info.iban)) {
    console.warn('[QR Code] Cannot generate Swiss QR code: Invalid Swiss IBAN', invoice.from_info.iban)
    return null
  }
  
  const currency = invoice.currency as 'CHF' | 'EUR'
  if (currency !== 'CHF' && currency !== 'EUR') {
    console.warn('[QR Code] Cannot generate Swiss QR code: Currency must be CHF or EUR, got:', currency)
    return null
  }
  
  // Parse creditor (from) info
  const fromZipCity = parseZipCity(invoice.from_info.zip || '')
  
  // Parse debtor (to) info  
  const toZipCity = parseZipCity(invoice.to_info?.zip || '')
  
  const data: SwissQRData = {
    creditor: {
      name: invoice.from_info.name || 'Unknown',
      address: invoice.from_info.street || '',
      zip: fromZipCity.zip || '0000',
      city: fromZipCity.city || 'Unknown',
      country: 'CH', // Default to Switzerland
      account: invoice.from_info.iban.replace(/\s/g, '').toUpperCase()
    },
    currency,
    amount: invoice.total,
    message: `Invoice ${invoice.invoice_number}`
  }
  
  // Add debtor if available
  if (invoice.to_info?.name) {
    data.debtor = {
      name: invoice.to_info.name,
      address: invoice.to_info.address || '',
      zip: toZipCity.zip || '0000',
      city: toZipCity.city || 'Unknown',
      country: 'CH'
    }
  }
  
  console.log('[QR Code] Swiss QR data built successfully:', {
    creditor: data.creditor.name,
    account: `${data.creditor.account.substring(0, 4)}...`,
    currency: data.currency,
    amount: data.amount
  })
  
  return data
}

/**
 * Convert SVG string to PNG data URL
 * react-pdf has limited SVG support, so we convert to PNG for better compatibility
 */
async function svgToPngDataUrl(svgString: string, width: number = 200, height: number = 200): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('[QR Code] Cannot convert SVG to PNG in non-browser environment')
    return null
  }

  try {
    // Create an image from the SVG
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('SVG to PNG conversion timeout'))
      }, 5000) // 5 second timeout
      
      img.onload = () => {
        clearTimeout(timeout)
        try {
          // Create a canvas to convert SVG to PNG
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Could not get canvas context'))
            return
          }
          
          // Fill white background (SVG might be transparent)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          
          // Draw the image to canvas
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to PNG data URL
          const pngDataUrl = canvas.toDataURL('image/png')
          URL.revokeObjectURL(url)
          console.log('[QR Code] SVG converted to PNG successfully')
          resolve(pngDataUrl)
        } catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        console.error('[QR Code] Failed to load SVG image:', error)
        reject(new Error('Failed to load SVG image'))
      }
      
      img.src = url
    })
  } catch (error) {
    console.error('[QR Code] Error converting SVG to PNG:', error)
    return null
  }
}

/**
 * Generate Swiss QR code as PNG data URL (for PDF compatibility)
 * Uses swissqrbill library for compliant Swiss payment QR codes
 * Converts SVG to PNG because react-pdf doesn't support SVG
 */
export async function generateSwissQRCode(invoice: GuestInvoice): Promise<string | null> {
  try {
    console.log('[QR Code] generateSwissQRCode called')
    const qrData = buildSwissQRData(invoice)
    if (!qrData) {
      console.warn('[QR Code] buildSwissQRData returned null')
      return null
    }
    
    console.log('[QR Code] Attempting to import swissqrbill/svg...')
    // Dynamic import to avoid SSR issues
    let SwissQRCode
    try {
      const swissqrbillModule = await import('swissqrbill/svg')
      SwissQRCode = swissqrbillModule.SwissQRCode || swissqrbillModule.default?.SwissQRCode || swissqrbillModule.default
      console.log('[QR Code] SwissQRCode imported:', !!SwissQRCode)
    } catch (importError) {
      console.error('[QR Code] Failed to import swissqrbill/svg:', importError)
      return null
    }
    
    if (!SwissQRCode) {
      console.error('[QR Code] SwissQRCode is not available after import')
      return null
    }
    
    console.log('[QR Code] Creating SwissQRCode instance...')
    // Create Swiss QR code (46mm is standard size)
    const qrCode = new SwissQRCode(qrData, 46)
    
    console.log('[QR Code] Converting to SVG string...')
    // Get SVG string
    const svgString = qrCode.toString()
    
    if (!svgString) {
      console.error('[QR Code] toString() returned empty string')
      return null
    }
    
    console.log('[QR Code] Converting SVG to PNG for PDF compatibility...')
    // Convert SVG to PNG data URL (react-pdf doesn't support SVG)
    const pngDataUrl = await svgToPngDataUrl(svgString, 200, 200)
    
    if (!pngDataUrl) {
      console.error('[QR Code] Failed to convert SVG to PNG')
      // Fallback: return SVG data URL (might work in some cases)
      const base64 = btoa(unescape(encodeURIComponent(svgString)))
      const svgDataUrl = `data:image/svg+xml;base64,${base64}`
      console.warn('[QR Code] Falling back to SVG data URL')
      return svgDataUrl
    }
    
    console.log('[QR Code] Swiss QR code generated successfully as PNG, length:', pngDataUrl.length)
    return pngDataUrl
  } catch (error) {
    console.error('[QR Code] Error generating Swiss QR code:', error)
    if (error instanceof Error) {
      console.error('[QR Code] Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    return null
  }
}

/**
 * Generate a simple QR code fallback using qrcode library
 * Used when Swiss QR requirements aren't met
 */
export async function generateSimpleQRCode(text: string): Promise<string | null> {
  try {
    // Dynamic import
    const QRCodeModule = await import('qrcode')
    const QRCode = QRCodeModule.default || QRCodeModule
    
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
    console.error('Error generating simple QR code:', error)
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
  // Debug logging
  console.log('[QR Code] Generating QR code for invoice:', {
    invoiceNumber: invoice.invoice_number,
    currency: invoice.currency,
    hasIban: !!invoice.from_info?.iban,
    iban: invoice.from_info?.iban ? `${invoice.from_info.iban.substring(0, 4)}...` : 'missing',
    total: invoice.total
  })

  // Try Swiss QR first if conditions are met
  if (invoice.from_info?.iban) {
    const isValidIBAN = validateSwissIBAN(invoice.from_info.iban)
    console.log('[QR Code] IBAN validation:', { iban: invoice.from_info.iban, isValid: isValidIBAN })
    
    if (isValidIBAN) {
      const isValidCurrency = invoice.currency === 'CHF' || invoice.currency === 'EUR'
      console.log('[QR Code] Currency check:', { currency: invoice.currency, isValid: isValidCurrency })
      
      if (isValidCurrency) {
        try {
          console.log('[QR Code] Attempting to generate Swiss QR code...')
          const dataUrl = await generateSwissQRCode(invoice)
          if (dataUrl) {
            console.log('[QR Code] Swiss QR code generated successfully')
            return { dataUrl, type: 'swiss' }
          } else {
            console.warn('[QR Code] Swiss QR code generation returned null')
          }
        } catch (error) {
          console.error('[QR Code] Swiss QR generation failed, falling back to simple:', error)
        }
      } else {
        console.warn('[QR Code] Currency not CHF or EUR, cannot generate Swiss QR')
      }
    } else {
      console.warn('[QR Code] IBAN is not a valid Swiss IBAN')
    }
  } else {
    console.warn('[QR Code] No IBAN found in invoice.from_info')
  }
  
  // Always try simple QR as fallback
  try {
    console.log('[QR Code] Attempting to generate simple QR code as fallback...')
    const paymentInfo = [
      `Invoice: ${invoice.invoice_number || 'N/A'}`,
      `Amount: ${invoice.currency || 'CHF'} ${(invoice.total || 0).toFixed(2)}`,
      invoice.from_info?.iban ? `IBAN: ${invoice.from_info.iban}` : '',
      invoice.due_date ? `Due: ${invoice.due_date}` : ''
    ].filter(Boolean).join('\n')
    
    const dataUrl = await generateSimpleQRCode(paymentInfo)
    if (dataUrl) {
      console.log('[QR Code] Simple QR code generated successfully')
      return { dataUrl, type: 'simple' }
    } else {
      console.warn('[QR Code] Simple QR code generation returned null')
    }
  } catch (error) {
    console.error('[QR Code] Simple QR generation failed:', error)
  }
  
  console.error('[QR Code] All QR code generation methods failed')
  return { dataUrl: null, type: 'none', error: 'Failed to generate QR code' }
}
