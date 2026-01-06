'use client'

import Link from "next/link"
import { getInvoiceStatus, type Invoice } from "@/lib/services/invoiceService.client"
import { Badge } from "@/app/components/ui/badge"
import {
  TableCell,
  TableRow,
} from "@/app/components/ui/table"
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

// Invoice row component
export default function InvoiceRow({ invoice }: { invoice: Invoice }) {
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

