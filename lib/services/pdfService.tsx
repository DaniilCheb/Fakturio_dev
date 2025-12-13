'use client'

import { GuestInvoice } from '../types/invoice'
import InvoicePDF from '@/app/components/invoice/InvoicePDF'
import { pdf, Font } from '@react-pdf/renderer'
import { generateInvoiceQRCode } from './qrCodeService'

// Font registration state
let fontsRegistered = false
let fontsRegistering = false

/**
 * Register Radio Canada Big font for PDF generation
 * Fetches fonts from URLs and converts them to base64 for react-pdf compatibility
 */
async function registerFonts() {
  if (fontsRegistered || fontsRegistering) {
    return
  }

  fontsRegistering = true

  // Try to register fonts, but fail silently if it doesn't work
  // PDF will use Helvetica fallback
  try {
    // Font URLs
    const fontUrls = [
      {
        src: 'https://fonts.gstatic.com/s/radiocanadabig/v24/LYjsdZvomlJ0BKQ6SI9Mq2-N0JbsEFkpGC_l7mMfqJq8.woff2',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/radiocanadabig/v24/LYjhdZvomlJ0BKQ6SI9Mq2-N0JbsEFkpnDBJ0bHxXauLPQ.woff2',
        fontWeight: 500,
      },
      {
        src: 'https://fonts.gstatic.com/s/radiocanadabig/v24/LYjhdZvomlJ0BKQ6SI9Mq2-N0JbsEFkpkDNJ0bHxXauLPQ.woff2',
        fontWeight: 600,
      },
      {
        src: 'https://fonts.gstatic.com/s/radiocanadabig/v24/LYjhdZvomlJ0BKQ6SI9Mq2-N0JbsEFkp7DRJ0bHxXauLPQ.woff2',
        fontWeight: 700,
      },
      {
        src: 'https://fonts.gstatic.com/s/radiocanadabig/v24/LYjhdZvomlJ0BKQ6SI9Mq2-N0JbsEFkpgDdJ0bHxXauLPQ.woff2',
        fontWeight: 800,
      },
    ]

    // Fetch fonts and convert to base64 data URLs
    // Note: react-pdf in browser requires data URLs or local file paths
    const fonts = await Promise.all(
      fontUrls.map(async (font) => {
        try {
          const response = await fetch(font.src)
          if (!response.ok) {
            throw new Error(`Failed to fetch font: ${response.statusText}`)
          }
          const blob = await response.blob()
          // Convert blob to base64
          return new Promise<{ src: string; fontWeight: number } | null>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              // Remove data URL prefix if present and add proper one
              const base64Data = base64.includes(',') 
                ? base64.split(',')[1] 
                : base64
              resolve({
                src: `data:font/woff2;base64,${base64Data}`,
                fontWeight: font.fontWeight,
              })
            }
            reader.onerror = () => {
              console.warn(`Failed to convert font weight ${font.fontWeight} to base64`)
              resolve(null)
            }
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.warn(`Failed to load font weight ${font.fontWeight}, using fallback:`, error)
          return null
        }
      })
    )

    // Wait for all font conversions to complete
    const resolvedFonts = await Promise.all(fonts)
    
    // Filter out failed fonts and register
    const validFonts = resolvedFonts.filter((f): f is NonNullable<typeof f> => f !== null)
    
    if (validFonts.length > 0) {
      try {
        Font.register({
          family: 'Radio Canada Big',
          fonts: validFonts,
        })
        fontsRegistered = true
        console.log(`Successfully registered ${validFonts.length} font weights for Radio Canada Big`)
      } catch (fontError) {
        // Font registration failed (e.g., unsupported format)
        console.warn('Font registration failed, will use Helvetica fallback:', fontError)
        fontsRegistered = false
      }
    } else {
      // If all fonts failed, we'll use Helvetica as fallback
      // The InvoicePDF component uses Helvetica as default
      console.warn('All custom fonts failed to load, PDF will use Helvetica fallback')
    }
  } catch (error) {
    // Silently fail - PDF will use Helvetica which is built into react-pdf
    // Don't log as error since this is expected if WOFF2 isn't supported
    console.debug('Custom font registration skipped, using Helvetica:', error)
  } finally {
    fontsRegistering = false
    // Mark as "registered" even if it failed, so we don't keep trying
    fontsRegistered = true
  }
}

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
    // Ensure fonts are registered before generating PDF
    await registerFonts()
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
    // Ensure fonts are registered before generating PDF
    await registerFonts()
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
