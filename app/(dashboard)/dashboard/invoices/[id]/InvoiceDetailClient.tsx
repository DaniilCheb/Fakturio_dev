"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@clerk/nextjs"
import Link from "next/link"
import { Card, CardContent } from "@/app/components/ui/card"
import StatusBadge from "@/app/components/StatusBadge"
import { EditIcon, CopyIcon, PreviewIcon, DownloadIcon } from "@/app/components/Icons"
import { getInvoiceStatus, type Invoice } from "@/lib/services/invoiceService.client"
import { type Project } from "@/lib/services/projectService"
import { formatDate } from "@/lib/utils/dateUtils"
import { formatCurrency } from "@/lib/utils/formatters"
import { generateInvoicePDF, generateInvoicePDFBlob } from "@/lib/services/pdfService"
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { getBankAccountsWithClient } from "@/lib/services/bankAccountService.client"
import type { GuestInvoice } from "@/lib/types/invoice"

// Check Icon (local, as it's specific to this page)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface InvoiceDetailClientProps {
  invoice: Invoice
  project: Project | null
  title: string
}

// Convert Invoice to GuestInvoice format for PDF generation
async function convertInvoiceToGuestInvoice(
  invoice: Invoice,
  supabase: ReturnType<typeof createClientSupabaseClient> | null,
  userId: string
): Promise<GuestInvoice> {
  const fromInfo = invoice.from_info || {}
  let iban = fromInfo.iban || ""
  
  // If IBAN is missing and we have a bank_account_id, fetch it
  if (!iban && invoice.bank_account_id && supabase && userId) {
    try {
      const bankAccounts = await getBankAccountsWithClient(supabase, userId)
      const bankAccount = bankAccounts.find(acc => acc.id === invoice.bank_account_id)
      if (bankAccount?.iban) {
        iban = bankAccount.iban
      }
    } catch (error) {
      console.warn("Failed to fetch IBAN from bank account:", error)
    }
  }
  
  const safeFromInfo = {
    name: fromInfo.name || "",
    street: fromInfo.street || fromInfo.address || "",
    zip: fromInfo.zip || "",
    iban: iban,
    logo_url: fromInfo.logo_url,
  }

  const toInfo = invoice.to_info || {}
  const safeToInfo = {
    name: toInfo.name || "",
    address: toInfo.address || toInfo.street || "",
    zip: toInfo.zip || "",
    uid: toInfo.uid,
  }

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
    payment_method: "Bank",
    from_info: safeFromInfo,
    to_info: safeToInfo,
    description: invoice.notes || "",
    items: safeItems,
    discount: 0,
    subtotal: invoice.subtotal ?? 0,
    vat_amount: invoice.vat_amount ?? 0,
    total: invoice.total ?? 0,
    created_at: invoice.created_at || new Date().toISOString(),
    updated_at: invoice.updated_at || new Date().toISOString(),
  }
}

export default function InvoiceDetailClient({ invoice, project, title }: InvoiceDetailClientProps) {
  const router = useRouter()
  const { session } = useSession()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState(invoice)

  const invoiceStatus = getInvoiceStatus(currentInvoice)
  // Map "pending" to "issued" for StatusBadge component
  const currentStatus: "paid" | "overdue" | "issued" = 
    invoiceStatus === "pending" ? "issued" : invoiceStatus
  
  const getDaysUntilDue = (): number | null => {
    if (!currentInvoice.due_date) return null
    const due = new Date(currentInvoice.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntilDue = getDaysUntilDue()

  const handleMarkAsPaid = async () => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/invoices/${currentInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paid_date: new Date().toISOString().split("T")[0] }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || "Failed to update invoice status"
        console.error("Error updating invoice status:", errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const updated = await response.json()
      setCurrentInvoice(updated)
      router.refresh()
    } catch (error) {
      console.error("Error updating invoice status:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update invoice status. Please try again."
      alert(errorMessage)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleMarkAsIssued = async () => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/invoices/${currentInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "issued", paid_date: null }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || "Failed to update invoice status"
        console.error("Error updating invoice status:", errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const updated = await response.json()
      setCurrentInvoice(updated)
      router.refresh()
    } catch (error) {
      console.error("Error updating invoice status:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update invoice status. Please try again."
      alert(errorMessage)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePreviewPDF = async () => {
    setIsPreviewing(true)
    try {
      const supabase = session ? createClientSupabaseClient(session) : null
      const userId = session?.user?.id || ""
      const guestInvoice = await convertInvoiceToGuestInvoice(currentInvoice, supabase, userId)
      
      const blob = await generateInvoicePDFBlob(guestInvoice, { includeQRCode: true })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error("Error previewing PDF:", error)
      alert("Error previewing PDF. Please try again.")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const supabase = session ? createClientSupabaseClient(session) : null
      const userId = session?.user?.id || ""
      const guestInvoice = await convertInvoiceToGuestInvoice(currentInvoice, supabase, userId)
      
      await generateInvoicePDF(guestInvoice, { includeQRCode: true })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Error downloading PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/invoices/${currentInvoice.id}/duplicate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate invoice")
      }

      const duplicated = await response.json()
      router.push(`/dashboard/invoices/${duplicated.id}`)
    } catch (error) {
      console.error("Error duplicating invoice:", error)
      alert("Failed to duplicate invoice. Please try again.")
    } finally {
      setIsDuplicating(false)
    }
  }

  const currency = currentInvoice.currency || "CHF"

  const actionButtons = (
    <div className="flex items-center gap-6">
      <button
        onClick={() => router.push(`/dashboard/invoices/${currentInvoice.id}/edit`)}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <EditIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Edit</span>
      </button>
      <button
        onClick={handlePreviewPDF}
        disabled={isPreviewing}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <PreviewIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Preview</span>
      </button>
      <button
        onClick={handleDownloadPDF}
        disabled={isDownloading}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <DownloadIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Download</span>
      </button>
      <button
        onClick={handleDuplicate}
        disabled={isDuplicating}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <CopyIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Duplicate</span>
      </button>
      {currentStatus !== "paid" ? (
        <button
          onClick={handleMarkAsPaid}
          disabled={isUpdatingStatus}
          className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center">
            <CheckIcon />
          </div>
          <span className="text-[11px] font-medium text-[#141414] dark:text-white">Mark Paid</span>
        </button>
      ) : (
        <button
          onClick={handleMarkAsIssued}
          disabled={isUpdatingStatus}
          className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
            <CheckIcon />
          </div>
          <span className="text-[11px] font-medium">Mark Issued</span>
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-[24px] md:text-[32px] text-foreground tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStatus} />
            {daysUntilDue !== null && currentStatus !== "paid" && (
              <span className="text-[13px] text-muted-foreground">
                {daysUntilDue > 0
                  ? `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`
                  : daysUntilDue === 0
                    ? "Due today"
                    : `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`}
              </span>
            )}
          </div>
        </div>
        {actionButtons}
      </div>

      {/* Invoice Info Card */}
      <Card>
        {/* Client Info */}
        <div className="p-6 border-b">
          <h2 className="text-[18px] font-semibold mb-3">
            {currentInvoice.to_info?.name || "Client"}
          </h2>
          <div className="text-[14px] text-muted-foreground space-y-1">
            {currentInvoice.to_info?.address && <p>{currentInvoice.to_info.address}</p>}
            {currentInvoice.to_info?.zip && <p>{currentInvoice.to_info.zip}</p>}
            {currentInvoice.to_info?.uid && (
              <p className="mt-2">
                <span className="text-muted-foreground">UID: </span>
                {currentInvoice.to_info.uid}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Issued On
              </p>
              <p className="text-[14px]">
                {formatDate(currentInvoice.issued_on || currentInvoice.created_at)}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Due
              </p>
              <p className="text-[14px]">
                {formatDate(currentInvoice.due_date)}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Invoice Number
              </p>
              <p className="text-[14px]">
                {currentInvoice.invoice_number || "-"}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Issued By
              </p>
              <p className="text-[14px]">
                {currentInvoice.from_info?.name || "-"}
              </p>
            </div>
            {project && (
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Project
                </p>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="text-[14px] hover:underline"
                >
                  {project.name}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <div className="mb-4">
            <div className="grid grid-cols-12 gap-4 pb-2 border-b text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
          </div>
          
          <div className="space-y-3">
            {currentInvoice.items?.map((item: any, index: number) => {
              const qty = parseFloat(item.quantity ?? item.qty ?? 0)
              const price = parseFloat(item.pricePerUm ?? item.price ?? item.price_per_um ?? 0)
              const total = qty * price
              
              return (
                <div key={item.id || index} className="grid grid-cols-12 gap-4 text-[14px]">
                  <div className="col-span-6">
                    {item.description || item.name || "Item"}
                    {item.um && <span className="text-muted-foreground ml-1">({item.um})</span>}
                  </div>
                  <div className="col-span-2 text-right text-muted-foreground">{qty}</div>
                  <div className="col-span-2 text-right text-muted-foreground">
                    {formatCurrency(price, currency)}
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(total, currency)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t flex justify-end">
            <div className="text-right">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Total
              </p>
              <p className="text-[24px] font-semibold">
                {formatCurrency(currentInvoice.total, currency)}
              </p>
            </div>
          </div>
        </div>
      </Card>

    </>
  )
}

