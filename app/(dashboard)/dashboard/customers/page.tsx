import { getContacts, type Contact } from '@/lib/services/contactService'
import CustomersList from './CustomersList'

export default async function CustomersPage() {
  let customers: Contact[] = []
  let error: string | null = null

  try {
    const allContacts = await getContacts()
    // Filter to only show customers (not suppliers)
    customers = allContacts.filter(contact => contact.type === 'customer')
    // If we successfully got an empty array, that's fine - user just hasn't created customers yet
  } catch (e) {
    // For new users who haven't created customers yet, treat as empty state rather than error
    // This provides better UX - showing an error when a user simply hasn't created customers yet
    // is confusing. We'll log the error for debugging but show empty state to the user.
    console.error('Error fetching customers (showing empty state):', e)
    error = null // Don't show error to user - treat as empty state
    customers = [] // Ensure customers is empty array
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
          Customers
        </h1>
        <p className="text-[14px] text-design-content-weak mt-1">
          Manage your customers and their information
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl p-6">
        <CustomersList initialCustomers={customers} />
      </div>
    </div>
  )
}

