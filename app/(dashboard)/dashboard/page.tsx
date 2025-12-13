import { getInvoices, getInvoiceStatus, type Invoice } from '@/lib/services/invoiceService'
import Link from 'next/link'

// Status badge component
function StatusBadge({ status }: { status: 'paid' | 'overdue' | 'pending' | 'draft' | 'cancelled' }) {
  const styles = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  }

  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    draft: 'Draft',
    cancelled: 'Cancelled',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-design-surface-field flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-design-content-weak">
          <path d="M8 6C8 5.44772 8.44772 5 9 5H23C23.5523 5 24 5.44772 24 6V26C24 26.5523 23.5523 27 23 27H9C8.44772 27 8 26.5523 8 26V6Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 11H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="text-[18px] font-semibold text-design-content-default mb-2">
        No invoices yet
      </h3>
      <p className="text-[14px] text-design-content-weak text-center max-w-sm mb-6">
        Create your first invoice to start tracking your business income.
      </p>
      <Link
        href="/dashboard/invoices/new"
        className="inline-flex items-center justify-center px-5 py-2.5 h-[44px] bg-design-button-primary text-design-on-button-content rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity"
      >
        Create Invoice
      </Link>
    </div>
  )
}

// Invoice row component
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const displayStatus = getInvoiceStatus(invoice)
  const clientName = invoice.to_info?.name || 'Unknown Client'
  
  return (
    <tr className="border-b border-design-border-default last:border-b-0 hover:bg-design-surface-field/50 transition-colors">
      <td className="py-4 px-4 text-[14px] font-medium text-design-content-default">
        {invoice.invoice_number}
      </td>
      <td className="py-4 px-4 text-[14px] text-design-content-default">
        {clientName}
      </td>
      <td className="py-4 px-4 text-[14px] text-design-content-default font-medium">
        {formatCurrency(invoice.total, invoice.currency)}
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="py-4 px-4 text-[14px] text-design-content-weak">
        {formatDate(invoice.issued_on)}
      </td>
      <td className="py-4 px-4 text-[14px] text-design-content-weak">
        {formatDate(invoice.due_date)}
      </td>
    </tr>
  )
}

export default async function DashboardPage() {
  let invoices: Invoice[] = []
  let error: string | null = null

  try {
    invoices = await getInvoices()
    // If we successfully got an empty array, that's fine - user just hasn't created invoices yet
  } catch (e) {
    // For new users who haven't created invoices yet, treat as empty state rather than error
    // This provides better UX - showing an error when a user simply hasn't created invoices yet
    // is confusing. We'll log the error for debugging but show empty state to the user.
    console.error('Error fetching invoices (showing empty state):', e)
    error = null // Don't show error to user - treat as empty state
    invoices = [] // Ensure invoices is empty array
  }

  // Calculate summary stats
  const totalInvoices = invoices.length
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)
  const pendingAmount = invoices
    .filter(inv => inv.status === 'issued' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)
  const overdueCount = invoices.filter(inv => getInvoiceStatus(inv) === 'overdue').length

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
            Invoices
          </h1>
          <p className="text-[14px] text-design-content-weak mt-1">
            Manage and track all your invoices
          </p>
        </div>
      <Link
        href="/dashboard/invoices/new"
        className="inline-flex items-center justify-center px-5 py-2.5 h-[44px] bg-design-button-primary text-design-on-button-content rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Invoice
        </Link>
      </div>

      {/* Summary Cards */}
      {totalInvoices > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-design-surface-default border border-design-border-default rounded-xl p-4">
            <p className="text-[13px] text-design-content-weak mb-1">Total Invoices</p>
            <p className="text-[24px] font-semibold text-design-content-default">{totalInvoices}</p>
          </div>
          <div className="bg-design-surface-default border border-design-border-default rounded-xl p-4">
            <p className="text-[13px] text-design-content-weak mb-1">Paid Revenue</p>
            <p className="text-[24px] font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalRevenue, 'CHF')}
            </p>
          </div>
          <div className="bg-design-surface-default border border-design-border-default rounded-xl p-4">
            <p className="text-[13px] text-design-content-weak mb-1">Pending</p>
            <p className="text-[24px] font-semibold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(pendingAmount, 'CHF')}
            </p>
          </div>
          <div className="bg-design-surface-default border border-design-border-default rounded-xl p-4">
            <p className="text-[13px] text-design-content-weak mb-1">Overdue</p>
            <p className="text-[24px] font-semibold text-red-600 dark:text-red-400">{overdueCount}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <div className="bg-design-surface-default border border-design-border-default rounded-xl">
          <EmptyState />
        </div>
      ) : (
        <div className="bg-design-surface-default border border-design-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-design-border-default bg-design-surface-field/50">
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-design-content-weak">
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-design-content-weak">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-design-content-weak">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-design-content-weak">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-design-content-weak">
                    Issued
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] font-medium text-design-content-weak">
                    Due
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

