'use client'

import { GuestInvoice } from '../types/invoice'
import InvoicePDF from '@/app/components/invoice/InvoicePDF'
import { pdf } from '@react-pdf/renderer'

/**
 * Generate and download invoice PDF using react-pdf/renderer
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
    const pdfDoc = (
      <InvoicePDF
        invoice={invoice}
        includeQRCode={options?.includeQRCode}
        qrCodeDataUrl={options?.qrCodeDataUrl}
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
    const pdfDoc = (
      <InvoicePDF
        invoice={invoice}
        includeQRCode={options?.includeQRCode}
        qrCodeDataUrl={options?.qrCodeDataUrl}
      />
    )

    return await pdf(pdfDoc).toBlob()
  } catch (error) {
    console.error('Error generating PDF blob:', error)
    throw error
  }
}

