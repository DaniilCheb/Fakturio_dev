'use client'

import { getInvoiceStatus, type Invoice } from "@/lib/services/invoiceService.client"
import { useInvoices } from "@/lib/hooks/queries"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"

import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import Header from "@/app/components/Header"
import SectionHeader from "@/app/components/SectionHeader"
import DashboardChart from "./DashboardChart"
import InvoiceRowActions from "./InvoiceRowActions"
import TableRowLabel from "@/app/components/TableRowLabel"

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Status badge component using shadcn Badge
function StatusBadge({ status }: { status: "paid" | "overdue" | "pending" | "draft" | "cancelled" }) {
  const variants: Record<typeof status, { className: string; label: string }> = {
    paid: { 
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100",
      label: "Paid" 
    },
    pending: { 
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent hover:bg-yellow-100",
      label: "Issued" 
    },
    overdue: { 
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent hover:bg-red-100",
      label: "Overdue" 
    },
    draft: { 
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent hover:bg-gray-100",
      label: "Draft" 
    },
    cancelled: { 
      className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 border-transparent hover:bg-gray-100",
      label: "Cancelled" 
    },
  }

  const { className, label } = variants[status]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
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

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
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
    </div>
  )
}

// Invoice row component
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const displayStatus = getInvoiceStatus(invoice)
  const clientName = invoice.to_info?.name || "Unknown Client"

  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium px-6">
        <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
          <TableRowLabel 
            mainText={clientName} 
            labelText={`#${invoice.invoice_number}`}
          />
        </Link>
      </TableCell>
      <TableCell className="text-[14px] text-muted-foreground px-6">
        {formatDate(invoice.issued_on)}
      </TableCell>
      <TableCell className="text-[14px] font-medium px-6">
        {formatCurrency(invoice.total, invoice.currency)}
      </TableCell>
      <TableCell className="px-6">
        <StatusBadge status={displayStatus} />
      </TableCell>
      <TableCell className="text-right px-6">
        <InvoiceRowActions invoice={invoice} />
      </TableCell>
    </TableRow>
  )
}

export default function DashboardPage() {
  const { data: invoices = [], isLoading } = useInvoices()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Sort by issued date, newest first
  const sortedInvoices = [...invoices].sort((a, b) => {
    const dateA = new Date(a.issued_on || 0)
    const dateB = new Date(b.issued_on || 0)
    return dateB.getTime() - dateA.getTime()
  })

  // Prepare invoice data for chart (only pass what's needed)
  const chartInvoices = sortedInvoices.map((inv) => ({
    id: inv.id,
    issued_on: inv.issued_on,
    total: inv.total,
    currency: inv.currency,
  }))

  // Get the most common currency
  const currencyCount = sortedInvoices.reduce((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const defaultCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "CHF"

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Invoices" 
        actions={
          <Button variant="default" asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
      />

      {/* Stats & Chart */}
      {sortedInvoices.length > 0 && (
        <DashboardChart invoices={chartInvoices} defaultCurrency={defaultCurrency} />
      )}

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {sortedInvoices.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6">Client</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Date</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Amount</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Status</TableHead>
                  <TableHead className="text-right text-[13px] font-medium px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
