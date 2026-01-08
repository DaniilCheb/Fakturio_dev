"use client"

import { useState } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { Download, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useConfirmDialog } from "@/app/components/useConfirmDialog"
import { generateInvoicePDF } from "@/lib/services/pdfService"
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { getBankAccountsWithClient } from "@/lib/services/bankAccountService.client"
import { saveInvoiceWithClient } from "@/lib/services/invoiceService.client"
import { toast } from "sonner"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Invoice } from "@/lib/services/invoiceService.client"
import type { GuestInvoice } from "@/lib/types/invoice"

interface InvoiceRowActionsProps {
  invoice: Invoice
}

// Convert Invoice to GuestInvoice format for PDF generation
// If IBAN is missing from from_info, it will be fetched from bank_account_id
async function convertInvoiceToGuestInvoice(
  invoice: Invoice,
  supabase: SupabaseClient | null,
  userId: string
): Promise<GuestInvoice> {
  // Safely extract from_info with defaults
  const fromInfo = invoice.from_info || {}
  let iban = fromInfo.iban || ""
  
  // If IBAN is missing and we have a bank_account_id, fetch it
  if (!iban && invoice.bank_account_id && supabase && userId) {
    try {
      console.log('[InvoiceRowActions] Fetching IBAN from bank account:', invoice.bank_account_id)
      const bankAccounts = await getBankAccountsWithClient(supabase, userId)
      const bankAccount = bankAccounts.find(acc => acc.id === invoice.bank_account_id)
      if (bankAccount?.iban) {
        iban = bankAccount.iban
        console.log('[InvoiceRowActions] IBAN fetched successfully:', iban.substring(0, 4) + '...')
      } else {
        console.warn('[InvoiceRowActions] Bank account not found or has no IBAN')
      }
    } catch (error) {
      console.warn('[InvoiceRowActions] Failed to fetch IBAN from bank account:', error)
      // Continue without IBAN - QR code generation will fail gracefully
    }
  } else if (!iban) {
    console.warn('[InvoiceRowActions] No IBAN found and cannot fetch:', {
      hasBankAccountId: !!invoice.bank_account_id,
      hasSupabase: !!supabase,
      hasUserId: !!userId
    })
  } else {
    console.log('[InvoiceRowActions] IBAN found in from_info:', iban.substring(0, 4) + '...')
  }
  
  const safeFromInfo = {
    name: fromInfo.name || "",
    street: fromInfo.street || fromInfo.address || "",
    zip: fromInfo.zip || "",
    iban: iban,
    logo_url: fromInfo.logo_url,
    company_name: fromInfo.company_name,
    uid: fromInfo.uid,
  }

  // Safely extract to_info with defaults
  const toInfo = invoice.to_info || {}
  const safeToInfo = {
    name: toInfo.name || "",
    address: toInfo.address || toInfo.street || "",
    zip: toInfo.zip || "",
    uid: toInfo.uid,
  }

  // Safely map items
  const safeItems = (invoice.items || []).map((item: any, index: number) => {
    const quantity = Number(item.quantity ?? item.qty ?? 0)
    const um = Number(item.um ?? item.unit ?? 1)
    const pricePerUm = Number(item.pricePerUm ?? item.price ?? item.price_per_um ?? 0)
    const vat = Number(item.vat ?? item.vat_rate ?? invoice.vat_rate ?? 0)
    const calculatedTotal = quantity * um * pricePerUm

    return {
      id: item.id || `item-${index}`,
      quantity,
      um,
      description: item.description || item.name || "",
      pricePerUm,
      vat,
      total: item.total ?? calculatedTotal,
    }
  })

  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number || "",
    issued_on: invoice.issued_on || new Date().toISOString().split("T")[0],
    due_date: invoice.due_date || new Date().toISOString().split("T")[0],
    currency: invoice.currency || "CHF",
    payment_method: "Bank", // Default, could be stored in invoice
    from_info: safeFromInfo,
    to_info: safeToInfo,
    description: invoice.notes || "",
    items: safeItems,
    discount: 0, // Discount is not stored in Invoice type
    subtotal: invoice.subtotal ?? 0,
    vat_amount: invoice.vat_amount ?? 0,
    total: invoice.total ?? 0,
    created_at: invoice.created_at || new Date().toISOString(),
    updated_at: invoice.updated_at || new Date().toISOString(),
  }
}

export default function InvoiceRowActions({ invoice }: InvoiceRowActionsProps) {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { confirm, DialogComponent } = useConfirmDialog()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Invoice",
      message: `Are you sure you want to delete invoice #${invoice.invoice_number}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    
    // Store the invoice data for potential undo
    const deletedInvoice = { ...invoice }
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invoice")
      }

      // Immediately invalidate the query cache to update the UI
      await queryClient.invalidateQueries({ queryKey: ['invoices'] })

      // Show snackbar with undo option
      toast("Invoice deleted", {
        description: `Invoice #${invoice.invoice_number} has been deleted.`,
        action: {
          label: "Undo",
          onClick: async () => {
            await handleUndo(deletedInvoice)
          },
        },
        duration: 5000,
      })
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Failed to delete invoice. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUndo = async (deletedInvoice: Invoice) => {
    if (!session || !user) {
      toast.error("Authentication required to restore invoice")
      return
    }

    try {
      const supabase = createClientSupabaseClient(session)
      
      // Restore the invoice by creating it again with the same data
      await saveInvoiceWithClient(supabase, user.id, {
        contact_id: deletedInvoice.contact_id,
        project_id: deletedInvoice.project_id,
        bank_account_id: deletedInvoice.bank_account_id,
        invoice_number: deletedInvoice.invoice_number,
        status: deletedInvoice.status,
        currency: deletedInvoice.currency,
        issued_on: deletedInvoice.issued_on,
        due_date: deletedInvoice.due_date,
        paid_date: deletedInvoice.paid_date,
        subtotal: deletedInvoice.subtotal,
        vat_amount: deletedInvoice.vat_amount,
        vat_rate: deletedInvoice.vat_rate,
        total: deletedInvoice.total,
        from_info: deletedInvoice.from_info,
        to_info: deletedInvoice.to_info,
        items: deletedInvoice.items,
        notes: deletedInvoice.notes,
        payment_terms: deletedInvoice.payment_terms,
      })

      // Invalidate the query cache to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['invoices'] })
      
      toast.success("Invoice restored", {
        description: `Invoice #${deletedInvoice.invoice_number} has been restored.`,
      })
    } catch (error) {
      console.error("Error restoring invoice:", error)
      toast.error("Failed to restore invoice. Please try again.")
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Get Supabase client and user ID for fetching IBAN if needed
      const supabase = session ? createClientSupabaseClient(session) : null
      const userId = session?.user?.id || ""
      
      // Convert invoice to GuestInvoice format, fetching IBAN if needed
      const guestInvoice = await convertInvoiceToGuestInvoice(invoice, supabase, userId)
      
      // Debug: Log the final invoice structure
      console.log('[InvoiceRowActions] Final GuestInvoice structure:', {
        invoiceNumber: guestInvoice.invoice_number,
        currency: guestInvoice.currency,
        total: guestInvoice.total,
        hasFromInfo: !!guestInvoice.from_info,
        fromInfoIban: guestInvoice.from_info?.iban ? `${guestInvoice.from_info.iban.substring(0, 4)}...` : 'MISSING',
        fromInfoName: guestInvoice.from_info?.name,
        itemsCount: guestInvoice.items.length
      })
      
      // Validate required fields before generating PDF
      if (!guestInvoice.invoice_number) {
        throw new Error("Invoice number is missing")
      }
      if (!guestInvoice.from_info.name) {
        throw new Error("From information (company name) is missing")
      }
      if (!guestInvoice.to_info.name) {
        throw new Error("To information (client name) is missing")
      }
      if (guestInvoice.items.length === 0) {
        throw new Error("Invoice must have at least one item")
      }

      // Generate PDF with QR code, but don't fail if QR code generation fails
      console.log('[InvoiceRowActions] Calling generateInvoicePDF with includeQRCode: true')
      await generateInvoicePDF(guestInvoice, {
        includeQRCode: true,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to generate PDF. Please try again."
      alert(errorMessage)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      {DialogComponent}
      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-[46px] w-[46px] sm:h-8 sm:w-8"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDownload()
          }}
          disabled={isDownloading}
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-[46px] w-[46px] sm:h-8 sm:w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isDeleting}
          title="Delete invoice"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

