import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import Header from "@/app/components/Header"
import { getInvoices, type Invoice } from "@/lib/services/invoiceService"
import { getUserProfile } from "@/lib/services/settingsService"
import InvoicesChart from "../InvoicesChart"
import InvoicesTable from "../InvoicesTable"

// Server component that fetches invoices
async function InvoicesData() {
  const [invoices, profile] = await Promise.all([
    getInvoices(),
    getUserProfile().catch((error) => {
      // Silently handle JWT expiration or other auth errors - default to CHF
      // This is expected behavior when session expires, we'll use default currency
      if (error?.message?.includes('JWT') || error?.code === 'PGRST303') {
        return null
      }
      // Log other unexpected errors
      console.error('Error fetching profile:', error)
      return null
    })
  ])

  // Get account currency from profile, default to CHF
  const accountCurrency = profile?.account_currency || 'CHF'

  // Sort by issued date, newest first
  const sortedInvoices = [...invoices].sort((a, b) => {
    const dateA = new Date(a.issued_on || 0)
    const dateB = new Date(b.issued_on || 0)
    return dateB.getTime() - dateA.getTime()
  })

  // Prepare invoice data for chart (include conversion data)
  const chartInvoices = sortedInvoices.map((inv) => ({
    id: inv.id,
    issued_on: inv.issued_on,
    total: inv.total,
    currency: inv.currency,
    amount_in_account_currency: inv.amount_in_account_currency,
    exchange_rate: inv.exchange_rate,
  }))

  return (
    <>
      {/* Stats & Chart */}
      <InvoicesChart invoices={chartInvoices} defaultCurrency={accountCurrency} />

      {/* Invoices Table */}
      <InvoicesTable invoices={sortedInvoices} />
    </>
  )
}

export default function InvoicesPage() {
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
      <Suspense fallback={null}>
        <InvoicesData />
      </Suspense>
    </div>
  )
}

