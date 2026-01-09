'use client'

import { Suspense, useState, useMemo } from "react"
import { Plus, FileText, Download, Trash2, Search, X } from "lucide-react"
import Link from "next/link"
import { useSession, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useInvoices } from "@/lib/hooks/queries"
import { Card, CardContent } from "@/app/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Button } from "@/app/components/ui/button"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import SectionHeader from "@/app/components/SectionHeader"
import { useConfirmDialog } from "@/app/components/useConfirmDialog"
import InvoiceRow from "./InvoiceRow"
import type { Invoice } from "@/lib/services/invoiceService"
import { formatDate } from "@/lib/utils/dateUtils"
import { generateInvoicePDFBlob } from "@/lib/services/pdfService"
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { getBankAccountsWithClient } from "@/lib/services/bankAccountService.client"
import type { GuestInvoice } from "@/lib/types/invoice"
import type { SupabaseClient } from "@supabase/supabase-js"

// Convert Invoice to GuestInvoice format for PDF generation
async function convertInvoiceToGuestInvoice(
  invoice: Invoice,
  supabase: SupabaseClient | null,
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
      console.warn('Failed to fetch IBAN from bank account:', error)
    }
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

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-[18px] font-semibold mb-2">
        No invoices yet
      </h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-sm mb-6">
        Create your first invoice to start tracking your business income.
      </p>
      <Button variant="default" asChild>
        <Link href="/dashboard/invoices/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Link>
      </Button>
    </div>
  )
}

// Loading skeleton for table
function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <SectionHeader>
        <Skeleton className="h-4 w-32" />
      </SectionHeader>
      <CardContent className="p-0">
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Invoices table component
function InvoicesTableContent({ 
  initialInvoices,
  filterFn 
}: { 
  initialInvoices?: Invoice[]
  filterFn?: (invoice: Invoice) => boolean
}) {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useConfirmDialog()
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Use React Query hook for real-time updates, fallback to initial data for SSR
  const { data: invoicesData, isLoading } = useInvoices()
  // Prefer React Query data when available (it's the live data), otherwise use initial data
  // invoicesData can be an empty array (no invoices) or undefined (not loaded yet)
  const allInvoices = invoicesData !== undefined ? invoicesData : (initialInvoices || [])
  // Apply filter function if provided
  const invoices = filterFn ? allInvoices.filter(filterFn) : allInvoices

  // Extract unique years from invoices
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    invoices.forEach(invoice => {
      if (invoice.issued_on) {
        const year = new Date(invoice.issued_on).getFullYear()
        if (!isNaN(year)) {
          years.add(year)
        }
      }
    })
    return Array.from(years).sort((a, b) => b - a) // Sort descending
  }, [invoices])

  // Create year filter options
  const yearOptions = useMemo(() => {
    const options = [{ value: "all", label: "All time" }]
    availableYears.forEach(year => {
      options.push({ value: year.toString(), label: year.toString() })
    })
    return options
  }, [availableYears])

  // Filter invoices by selected year
  const filteredInvoices = useMemo(() => {
    if (selectedYear === "all") {
      return invoices
    }
    const year = parseInt(selectedYear)
    return invoices.filter(invoice => {
      if (!invoice.issued_on) return false
      const invoiceYear = new Date(invoice.issued_on).getFullYear()
      return invoiceYear === year
    })
  }, [invoices, selectedYear])

  // Filter invoices by search query
  const searchFilteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return filteredInvoices
    const query = searchQuery.toLowerCase().trim()
    return filteredInvoices.filter(invoice => {
      const clientName = invoice.to_info?.name || ""
      const invoiceNumber = invoice.invoice_number || ""
      const notes = invoice.notes || ""
      return (
        clientName.toLowerCase().includes(query) ||
        invoiceNumber.toLowerCase().includes(query) ||
        notes.toLowerCase().includes(query)
      )
    })
  }, [filteredInvoices, searchQuery])

  // Sort by issued date, newest first
  const sortedInvoices = useMemo(() => {
    return [...searchFilteredInvoices].sort((a, b) => {
      const dateA = new Date(a.issued_on || 0)
      const dateB = new Date(b.issued_on || 0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [searchFilteredInvoices])

  // Toggle invoice selection
  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoiceIds(prev => {
      const next = new Set(prev)
      if (next.has(invoiceId)) {
        next.delete(invoiceId)
      } else {
        next.add(invoiceId)
      }
      return next
    })
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(new Set(sortedInvoices.map(invoice => invoice.id)))
    } else {
      setSelectedInvoiceIds(new Set())
    }
  }

  // Check if all invoices are selected
  const allSelected = sortedInvoices.length > 0 && selectedInvoiceIds.size === sortedInvoices.length

  // Export selected invoices to CSV and PDFs in a ZIP
  const handleExportSelected = async () => {
    if (selectedInvoiceIds.size === 0) return

    const selectedInvoices = sortedInvoices.filter(inv => selectedInvoiceIds.has(inv.id))
    
    setIsExporting(true)
    try {
      // Show loading toast
      toast.loading(`Generating ${selectedInvoices.length} invoice PDF(s)...`)
      
      // Dynamically import JSZip
      const JSZipModule = await import('jszip')
      const JSZip = JSZipModule.default || JSZipModule
      const zip = new JSZip()
      
      // Get Supabase client and user ID for fetching IBAN if needed
      const supabase = session ? createClientSupabaseClient(session) : null
      const userId = session?.user?.id || ""
      
      // Create CSV content
      const headers = ['Invoice Number', 'Client', 'Date', 'Amount', 'Currency', 'Status']
      const rows = selectedInvoices.map(invoice => {
        const clientName = invoice.to_info?.name || 'Unknown Client'
        const status = invoice.status || 'draft'
        return [
          invoice.invoice_number || '',
          clientName,
          formatDate(invoice.issued_on),
          (invoice.total || 0).toString(),
          invoice.currency || 'CHF',
          status
        ]
      })

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      // Add CSV to ZIP
      zip.file('invoices.csv', csvContent)
      
      // Generate PDFs for each invoice
      for (const invoice of selectedInvoices) {
        try {
          // Convert invoice to GuestInvoice format
          const guestInvoice = await convertInvoiceToGuestInvoice(invoice, supabase, userId)
          
          // Generate PDF blob
          const pdfBlob = await generateInvoicePDFBlob(guestInvoice, {
            includeQRCode: true,
          })
          
          // Add PDF to ZIP with a safe filename
          const safeInvoiceNumber = (invoice.invoice_number || `invoice-${invoice.id}`).replace(/[^a-zA-Z0-9-_]/g, '_')
          zip.file(`invoices/${safeInvoiceNumber}.pdf`, pdfBlob)
        } catch (error) {
          console.error(`Error generating PDF for invoice ${invoice.invoice_number}:`, error)
          // Continue with other invoices even if one fails
        }
      }
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download ZIP file
      const link = document.createElement('a')
      const url = URL.createObjectURL(zipBlob)
      link.setAttribute('href', url)
      link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.zip`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success(`Exported ${selectedInvoices.length} invoice(s) with PDFs`)
    } catch (error) {
      console.error('Error exporting invoices:', error)
      toast.dismiss()
      toast.error('Failed to export invoices. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Delete selected invoices
  const handleDeleteSelected = async () => {
    if (!session || selectedInvoiceIds.size === 0) return

    const selectedInvoices = sortedInvoices.filter(inv => selectedInvoiceIds.has(inv.id))
    if (selectedInvoices.length === 0) return

    const confirmed = await confirm({
      title: "Delete Invoices",
      message: `Are you sure you want to delete ${selectedInvoices.length} invoice${selectedInvoices.length === 1 ? '' : 's'}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      // Delete invoices one by one
      for (const invoiceId of Array.from(selectedInvoiceIds)) {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Failed to delete invoice ${invoiceId}`)
        }
      }

      // Invalidate queries to refresh the list
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ['invoices', user.id] })
      } else {
        await queryClient.invalidateQueries({ queryKey: ['invoices'] })
      }

      // Clear selection
      setSelectedInvoiceIds(new Set())
      toast.success(`Deleted ${selectedInvoices.length} invoice(s)`)
    } catch (error) {
      console.error("Error deleting invoices:", error)
      toast.error("Failed to delete invoices. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (sortedInvoices.length === 0) {
    return (
      <Card className="overflow-hidden">
        <SectionHeader 
          title="Invoices"
          actions={
            <div className="flex items-center gap-2">
              <div className="relative h-8">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="list-search-input w-[200px] pl-8 pr-8 text-[13px] bg-transparent shadow-none rounded-md focus-visible:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px] h-[32px] text-[13px] bg-transparent shadow-none px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
        <CardContent className="p-0">
          <EmptyState />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {DialogComponent}
      <Card className="overflow-hidden">
        <SectionHeader 
          title="Invoices"
          actions={
            <div className="flex items-center gap-2">
              {selectedInvoiceIds.size > 0 && (
                <>
                  <Button
                    onClick={handleExportSelected}
                    disabled={isExporting}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    <Download className="h-4 w-4" style={{ marginRight: '2px' }} />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                  <Button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" style={{ marginRight: '2px' }} />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
              <div className="relative h-8">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="list-search-input w-[200px] pl-8 pr-8 text-[13px] bg-transparent shadow-none rounded-md focus-visible:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px] h-[32px] text-[13px] bg-transparent shadow-none px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
        <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[13px] font-normal px-4 w-12 !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-[13px] font-normal pl-6 pr-4 !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>Client</TableHead>
              <TableHead className="hidden sm:table-cell text-[13px] font-normal px-4 !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>Date</TableHead>
              <TableHead className="hidden sm:table-cell text-[13px] font-normal px-4 !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>Amount</TableHead>
              <TableHead className="hidden sm:table-cell text-[13px] font-normal px-4 !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>Status</TableHead>
              <TableHead className="text-right text-[13px] font-normal px-3.5 !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.map((invoice) => (
              <InvoiceRow 
                key={invoice.id} 
                invoice={invoice as any}
                checkbox={{
                  checked: selectedInvoiceIds.has(invoice.id),
                  onCheckedChange: () => toggleInvoiceSelection(invoice.id)
                }}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  )
}

export default function InvoicesTable({ 
  invoices,
  filterFn 
}: { 
  invoices?: Invoice[]
  filterFn?: (invoice: Invoice) => boolean
}) {
  return <InvoicesTableContent initialInvoices={invoices} filterFn={filterFn} />
}

