'use client'

import { GuestInvoice } from '../types/invoice'
import InvoicePDF from '@/app/components/invoice/InvoicePDF'
import { pdf } from '@react-pdf/renderer'
import { generateInvoiceQRCode } from './qrCodeService'

// NOTE: Custom font registration has been removed for reliability.
// InvoicePDF uses Helvetica which is built into react-pdf and works consistently
// across all environments (local, production, different browsers).

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
      try {
        const qrResult = await generateInvoiceQRCode(invoice)
        if (qrResult.dataUrl) {
          qrCodeDataUrl = qrResult.dataUrl
        } else {
          // QR code generation failed, but continue without it
          console.warn('QR code generation failed, continuing without QR code:', qrResult.error)
          includeQRCode = false
        }
      } catch (qrError) {
        // QR code generation failed, but continue without it
        console.warn('QR code generation error, continuing without QR code:', qrError)
        includeQRCode = false
      }
    }

    // Validate invoice data before rendering
    if (!invoice.invoice_number) {
      throw new Error('Invoice number is required')
    }
    if (!invoice.from_info || !invoice.from_info.name) {
      throw new Error('From information (company details) is required')
    }
    if (!invoice.to_info || !invoice.to_info.name) {
      throw new Error('To information (client details) is required')
    }
    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Invoice must have at least one item')
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
    // Provide more specific error messages
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to generate PDF. Please check that all invoice fields are filled correctly.')
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
      try {
        const qrResult = await generateInvoiceQRCode(invoice)
        if (qrResult.dataUrl) {
          qrCodeDataUrl = qrResult.dataUrl
        } else {
          // QR code generation failed, but continue without it
          console.warn('QR code generation failed, continuing without QR code:', qrResult.error)
          includeQRCode = false
        }
      } catch (qrError) {
        // QR code generation failed, but continue without it
        console.warn('QR code generation error, continuing without QR code:', qrError)
        includeQRCode = false
      }
    }

    // Validate invoice data before rendering
    if (!invoice.invoice_number) {
      throw new Error('Invoice number is required')
    }
    if (!invoice.from_info || !invoice.from_info.name) {
      throw new Error('From information (company details) is required')
    }
    if (!invoice.to_info || !invoice.to_info.name) {
      throw new Error('To information (client details) is required')
    }
    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Invoice must have at least one item')
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
    // Provide more specific error messages
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to generate PDF. Please check that all invoice fields are filled correctly.')
  }
}
