'use client'

import { GuestInvoice } from '../types/invoice'
import InvoicePDF from '@/app/components/invoice/InvoicePDF'
import { pdf } from '@react-pdf/renderer'
import { generateInvoiceQRCode } from './qrCodeService'

/**
 * Generate and download invoice PDF using react-pdf/renderer
 * Automatically generates Swiss QR code if possible
 */
export async function generateInvoicePDF(
  invoice: GuestInvoice,
  options?: {
    includeQRCode?: boolean
    qrCodeDataUrl?: string
  }
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in the browser')
  }

  try {
    // Auto-generate QR code if not provided
    let qrCodeDataUrl = options?.qrCodeDataUrl
    let includeQRCode = options?.includeQRCode ?? true // Default to true
    
    if (includeQRCode && !qrCodeDataUrl) {
      const qrResult = await generateInvoiceQRCode(invoice)
      if (qrResult.dataUrl) {
        qrCodeDataUrl = qrResult.dataUrl
      }
    }

    const pdfDoc = (
      <InvoicePDF
        invoice={invoice}
        includeQRCode={includeQRCode}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    )

    const blob = await pdf(pdfDoc).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoice.invoice_number}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Generate invoice PDF as blob (for preview or upload)
 * Automatically generates Swiss QR code if possible
 */
export async function generateInvoicePDFBlob(
  invoice: GuestInvoice,
  options?: {
    includeQRCode?: boolean
    qrCodeDataUrl?: string
  }
): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in the browser')
  }

  try {
    // Auto-generate QR code if not provided
    let qrCodeDataUrl = options?.qrCodeDataUrl
    let includeQRCode = options?.includeQRCode ?? true // Default to true
    
    if (includeQRCode && !qrCodeDataUrl) {
      const qrResult = await generateInvoiceQRCode(invoice)
      if (qrResult.dataUrl) {
        qrCodeDataUrl = qrResult.dataUrl
      }
    }

    const pdfDoc = (
      <InvoicePDF
        invoice={invoice}
        includeQRCode={includeQRCode}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    )

    return await pdf(pdfDoc).toBlob()
  } catch (error) {
    console.error('Error generating PDF blob:', error)
    throw error
  }
}
