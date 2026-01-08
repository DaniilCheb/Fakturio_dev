'use client'

import { useState, useEffect } from 'react'
import { generateInvoicePDF } from '@/lib/services/pdfService'
import InvoicePreview from '@/app/components/invoice/InvoicePreview'
import { type Invoice } from '@/lib/services/invoiceService.client'
import { type GuestInvoice } from '@/lib/types/invoice'
import { getBankAccountsWithClient } from '@/lib/services/bankAccountService.client'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useSession } from '@clerk/nextjs'

interface PublicInvoiceViewProps {
  invoice: Invoice & {
    projects?: { name: string } | null
  }
}

// Convert Invoice to GuestInvoice format
async function convertInvoiceToGuestInvoice(
  invoice: Invoice,
  supabase: ReturnType<typeof createClientSupabaseClient> | null,
  userId: string | null
): Promise<GuestInvoice> {
  const fromInfo = invoice.from_info || {}
  let iban = fromInfo.iban || ''

  // If IBAN is missing and we have a bank_account_id, try to fetch it
  if (!iban && invoice.bank_account_id && supabase && userId) {
    try {
      const bankAccounts = await getBankAccountsWithClient(supabase, userId)
      const bankAccount = bankAccounts.find(
        (acc) => acc.id === invoice.bank_account_id
      )
      if (bankAccount?.iban) {
        iban = bankAccount.iban
      }
    } catch (error) {
      console.warn('Failed to fetch IBAN from bank account:', error)
    }
  }

  const safeFromInfo = {
    name: fromInfo.name || '',
    street: fromInfo.street || fromInfo.address || '',
    zip: fromInfo.zip || '',
    iban: iban,
    logo_url: fromInfo.logo_url,
    company_name: fromInfo.company_name,
    uid: fromInfo.uid,
  }

  const toInfo = invoice.to_info || {}
  const safeToInfo = {
    name: toInfo.name || '',
    address: toInfo.address || '',
    zip: toInfo.zip || '',
  }

  // Convert items
  const items = (invoice.items || []).map((item: any) => ({
    id: item.id || Math.random().toString(),
    quantity: item.quantity || 1,
    um: item.um || 1,
    description: item.description || '',
    pricePerUm: item.pricePerUm || 0,
    vat: item.vat || 0,
  }))

  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    issued_on: invoice.issued_on,
    due_date: invoice.due_date,
    currency: invoice.currency || 'CHF',
    payment_method: 'Bank' as const,
    from_info: safeFromInfo,
    to_info: safeToInfo,
    description: invoice.notes,
    items: items,
    discount: 0,
    subtotal: invoice.subtotal || 0,
    vat_amount: invoice.vat_amount || 0,
    total: invoice.total || 0,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
  }
}

export default function PublicInvoiceView({ invoice }: PublicInvoiceViewProps) {
  const { session } = useSession()
  const [isDownloading, setIsDownloading] = useState(false)
  const [guestInvoice, setGuestInvoice] = useState<GuestInvoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Convert invoice on mount
  useEffect(() => {
    async function loadInvoice() {
      try {
        const supabase = session
          ? createClientSupabaseClient(session)
          : null
        const userId = session?.user.id || null
        const converted = await convertInvoiceToGuestInvoice(
          invoice,
          supabase,
          userId
        )
        setGuestInvoice(converted)
      } catch (error) {
        console.error('Error converting invoice:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInvoice()
  }, [invoice, session])

  const handleDownload = async () => {
    if (!guestInvoice) return

    setIsDownloading(true)
    try {
      await generateInvoicePDF(guestInvoice)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading || !guestInvoice) {
    return (
      <div className="min-h-screen bg-design-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-design-content-default mx-auto mb-4"></div>
          <p className="text-design-content-weak">Loading invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-design-background">
      {/* Header */}
      <div className="bg-design-surface-default border-b border-design-border-default py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-design-content-default">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-sm text-design-content-weak">
              From{' '}
              {invoice.from_info?.company_name ||
                invoice.from_info?.name ||
                'Unknown'}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-6 py-2 bg-design-button-primary text-design-on-button-content rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-design-surface-default rounded-2xl border border-design-border-default p-8 shadow-lg">
          <InvoicePreview invoice={guestInvoice} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-design-content-weakest">
        Powered by{' '}
        <a
          href="https://fakturio.ch"
          className="text-design-content-weak hover:text-design-content-default"
        >
          Fakturio
        </a>
      </div>
    </div>
  )
}

