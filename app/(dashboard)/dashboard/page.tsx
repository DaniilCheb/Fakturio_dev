import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import Header from "@/app/components/Header"
import { getInvoices, type Invoice } from "@/lib/services/invoiceService"
import InvoicesChart from "./InvoicesChart"
import InvoicesTable from "./InvoicesTable"

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

// Server component that fetches invoices
async function InvoicesData() {
  const invoices = await getInvoices()

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
    <>
      {/* Stats & Chart */}
      <InvoicesChart invoices={chartInvoices} defaultCurrency={defaultCurrency} />

      {/* Invoices Table */}
      <InvoicesTable invoices={sortedInvoices} />
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
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

      {/* Stream invoices data with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <InvoicesData />
      </Suspense>
    </div>
  )
}
