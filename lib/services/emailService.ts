/**
 * Email Service
 * Handles sending invoices via email using Resend
 */

import { Resend } from 'resend'
import { randomBytes } from 'crypto'
import { createServerSupabaseClient } from '../supabase-server'
import { generateInvoiceQRCodeBuffer } from './qrCodeService.server'
import InvoiceEmail from '../../app/emails/InvoiceEmail'
import type { Invoice } from './invoiceService'

// Lazy initialization of Resend to avoid build-time errors when API key is missing
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

/**
 * Generate a secure view token (32 bytes = 256 bits)
 */
export function generateViewToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Get or create view token for an invoice
 */
export async function getOrCreateViewToken(invoiceId: string): Promise<string> {
  const supabase = await createServerSupabaseClient()

  // Check if token already exists
  const { data: invoice } = await supabase
    .from('invoices')
    .select('view_token')
    .eq('id', invoiceId)
    .single()

  if (invoice?.view_token) {
    return invoice.view_token
  }

  // Generate new token
  const token = generateViewToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 90) // 90 days expiration

  await supabase
    .from('invoices')
    .update({
      view_token: token,
      view_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', invoiceId)

  return token
}

/**
 * Convert Invoice to GuestInvoice format for email
 */
function convertInvoiceToGuestInvoice(invoice: Invoice): any {
  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    issued_on: invoice.issued_on,
    due_date: invoice.due_date,
    currency: invoice.currency,
    total: invoice.total,
    subtotal: invoice.subtotal,
    vat_amount: invoice.vat_amount,
    notes: invoice.notes,
    from_info: invoice.from_info,
    to_info: invoice.to_info,
    items: invoice.items,
    payment_terms: invoice.payment_terms,
  }
}

/**
 * Send invoice via email
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured')
    }

    const supabase = await createServerSupabaseClient()

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    // Fetch project name if project_id exists
    let projectName: string | undefined
    if (invoice?.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', invoice.project_id)
        .single()
      projectName = project?.name
    }

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Get or create view token
    const viewToken = await getOrCreateViewToken(invoiceId)
    const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/view/${viewToken}`

    // Convert to guest invoice format
    const guestInvoice = convertInvoiceToGuestInvoice(invoice)

    // Generate QR code buffer
    const qrBuffer = await generateInvoiceQRCodeBuffer(guestInvoice)

    // Build email attachments
    const attachments = []
    if (qrBuffer) {
      attachments.push({
        filename: 'payment-qr.png',
        content: qrBuffer,
        contentType: 'image/png',
        cid: 'payment-qr', // Content-ID for inline image
      })
    }

    // Get sender email from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name, company_name')
      .eq('id', invoice.user_id)
      .single()

    const senderEmail = profile?.email || process.env.RESEND_FROM_EMAIL || 'invoices@fakturio.ch'
    const senderName = invoice.from_info?.company_name || invoice.from_info?.name || 'Fakturio'

    // Get Resend instance (lazy initialization)
    const resend = getResend()
    if (!resend) {
      throw new Error('Email service is not configured. RESEND_API_KEY is missing.')
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: recipientEmail,
      subject: `Invoice ${invoice.invoice_number} from ${invoice.from_info?.company_name || invoice.from_info?.name || 'Fakturio'}`,
      react: InvoiceEmail({
        invoice: {
          ...guestInvoice,
          project_name: projectName,
        },
        viewUrl,
        recipientName: invoice.to_info?.name,
      }),
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (error) {
      console.error('[Email Service] Resend error:', error)
      throw new Error(error.message || 'Failed to send email')
    }

    // Update invoice with email sent timestamp
    await supabase
      .from('invoices')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', invoiceId)

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('[Email Service] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

