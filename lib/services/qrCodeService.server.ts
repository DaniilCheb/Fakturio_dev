/**
 * Server-Side QR Code Generation
 * Generates QR codes as PNG buffers for email attachments
 * Uses qrcode library (no browser dependencies)
 */

import QRCode from 'qrcode'
import type { GuestInvoice } from '../types/invoice'

/**
 * Build Swiss QR Bill payment string (SPC format)
 * This is the official format that Swiss banking apps can scan
 */
function buildSwissPaymentString(invoice: GuestInvoice): string | null {
  const fromInfo = invoice.from_info
  const toInfo = invoice.to_info

  // Validate required fields
  if (!fromInfo?.iban) {
    return null
  }

  // Clean IBAN
  const iban = fromInfo.iban.replace(/\s/g, '').toUpperCase()

  // Parse zip and city
  const parseZipCity = (combined: string): { zip: string; city: string } => {
    if (!combined) return { zip: '', city: '' }
    const trimmed = combined.trim()
    const match = trimmed.match(/^(\d{4,6})\s+(.+)$/)
    if (match) {
      return { zip: match[1], city: match[2] }
    }
    if (/^\d+$/.test(trimmed)) {
      return { zip: trimmed, city: '' }
    }
    return { zip: '', city: trimmed }
  }

  const fromZipCity = parseZipCity(fromInfo.zip || '')
  const toZipCity = parseZipCity(toInfo?.zip || '')

  // Build SPC payment string
  // Format: SPC\n0200\n1\nIBAN\nK\nName\nAddress\nZip City\n\n\nCH\n\n\n\n\n\n\nAmount\nCurrency\n\n\n\n\n\nReference\nMessage\nEPD
  const lines = [
    'SPC', // QR Type
    '0200', // Version
    '1', // Coding Type (UTF-8)
    iban, // IBAN
    'K', // Address Type (K=Combined)
    fromInfo.name || 'Unknown', // Creditor Name
    fromInfo.street || '', // Creditor Address
    `${fromZipCity.zip} ${fromZipCity.city}`.trim() || '0000 Unknown', // Creditor Zip + City
    '', // Creditor Country (empty for combined)
    '', // Creditor Country (empty for combined)
    'CH', // Country code
    '', // Ultimate Creditor Name
    '', // Ultimate Creditor Address
    '', // Ultimate Creditor Zip + City
    '', // Ultimate Creditor Country
    '', // Ultimate Creditor Country
    invoice.total.toFixed(2), // Amount
    invoice.currency || 'CHF', // Currency
    '', // Ultimate Debtor Name
    '', // Ultimate Debtor Address
    '', // Ultimate Debtor Zip + City
    '', // Ultimate Debtor Country
    '', // Ultimate Debtor Country
    '', // Reference (empty for QR-IBAN)
    `Invoice ${invoice.invoice_number}`, // Additional Information
    'EPD', // Trailer
  ]

  return lines.join('\n')
}

/**
 * Generate Swiss QR code as PNG buffer (server-side)
 * Returns Buffer for email attachments
 */
export async function generateSwissQRCodeBuffer(
  invoice: GuestInvoice
): Promise<Buffer | null> {
  try {
    const paymentString = buildSwissPaymentString(invoice)
    
    if (!paymentString) {
      console.warn('[QR Code Server] Cannot build Swiss payment string')
      return null
    }

    // Generate QR code as PNG buffer
    const buffer = await QRCode.toBuffer(paymentString, {
      type: 'png',
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    return buffer
  } catch (error) {
    console.error('[QR Code Server] Error generating QR code:', error)
    return null
  }
}

/**
 * Generate simple QR code as fallback (if Swiss QR requirements not met)
 */
export async function generateSimpleQRCodeBuffer(
  text: string
): Promise<Buffer | null> {
  try {
    const buffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    return buffer
  } catch (error) {
    console.error('[QR Code Server] Error generating simple QR code:', error)
    return null
  }
}

/**
 * Generate appropriate QR code for invoice (server-side)
 * Returns Buffer for email attachments
 */
export async function generateInvoiceQRCodeBuffer(
  invoice: GuestInvoice
): Promise<Buffer | null> {
  // Try Swiss QR first
  const swissBuffer = await generateSwissQRCodeBuffer(invoice)
  if (swissBuffer) {
    return swissBuffer
  }

  // Fallback to simple QR with payment info
  const paymentInfo = [
    `Invoice: ${invoice.invoice_number || 'N/A'}`,
    `Amount: ${invoice.currency || 'CHF'} ${(invoice.total || 0).toFixed(2)}`,
    invoice.from_info?.iban ? `IBAN: ${invoice.from_info.iban}` : '',
    invoice.due_date ? `Due: ${invoice.due_date}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return generateSimpleQRCodeBuffer(paymentInfo)
}




