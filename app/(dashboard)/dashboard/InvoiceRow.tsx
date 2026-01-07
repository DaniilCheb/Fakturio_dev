'use client'

import { getInvoiceStatus, type Invoice } from "@/lib/services/invoiceService.client"
import ListRow, { type ListRowColumn } from "@/app/components/ListRow"
import InvoiceRowActions from "./InvoiceRowActions"

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// Invoice row component
export default function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const displayStatus = getInvoiceStatus(invoice)
  const clientName = invoice.to_info?.name || "Unknown Client"

  const columns: ListRowColumn[] = [
    { type: 'text', value: formatDate(invoice.issued_on), muted: true, className: 'hidden sm:table-cell' },
    { type: 'currency', value: invoice.total, currency: invoice.currency, className: 'hidden sm:table-cell' },
    { type: 'badge', variant: displayStatus, className: 'hidden sm:table-cell' },
  ]

  return (
    <ListRow
      href={`/dashboard/invoices/${invoice.id}`}
      primary={{
        text: clientName,
        label: `#${invoice.invoice_number}`,
      }}
      columns={columns}
      actions={{
        custom: <InvoiceRowActions invoice={invoice} />,
      }}
    />
  )
}



