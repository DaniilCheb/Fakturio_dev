'use client'

import { useState } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { 
  saveContactWithClient, 
  deleteContactWithClient, 
  updateContactWithClient,
  type Contact,
  type CreateContactInput
} from '@/lib/services/contactService.client'
import AddCustomerModal from './AddCustomerModal'

interface CustomersListProps {
  initialCustomers: Contact[]
}

export default function CustomersList({ initialCustomers }: CustomersListProps) {
  const { session } = useSession()
  const [customers, setCustomers] = useState<Contact[]>(initialCustomers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddCustomer = async (customerData: CreateContactInput) => {
    if (!session) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      const created = await saveContactWithClient(supabase, userId, {
        ...customerData,
        type: 'customer',
      })

      setCustomers(prev => [created, ...prev])
      setShowAddModal(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add customer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCustomer = async (customerData: CreateContactInput) => {
    if (!session || !editingCustomer) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      const updated = await updateContactWithClient(supabase, userId, editingCustomer.id, {
        ...customerData,
        type: 'customer',
      })

      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
      setEditingCustomer(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update customer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (customerId: string) => {
    if (!session) return
    if (!confirm('Are you sure you want to delete this customer?')) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await deleteContactWithClient(supabase, userId, customerId)
      setCustomers(prev => prev.filter(c => c.id !== customerId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete customer')
    } finally {
      setIsLoading(false)
    }
  }

  // Format address for display
  const formatAddress = (customer: Contact) => {
    const parts = []
    if (customer.address) parts.push(customer.address)
    if (customer.postal_code || customer.city) {
      parts.push([customer.postal_code, customer.city].filter(Boolean).join(' '))
    }
    return parts.join(', ') || 'No address'
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Customers List */}
      {customers.length > 0 ? (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div 
              key={customer.id}
              className="flex items-start justify-between p-4 bg-design-surface-field rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-design-content-default">
                    {customer.name}
                  </p>
                  {customer.company_name && (
                    <span className="text-[13px] text-design-content-weak">
                      ({customer.company_name})
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-design-content-weak mt-1">
                  {formatAddress(customer)}
                </p>
                {customer.email && (
                  <p className="text-[12px] text-design-content-weakest mt-0.5">
                    {customer.email}
                  </p>
                )}
                {customer.vat_number && (
                  <p className="text-[12px] text-design-content-weakest mt-0.5 font-mono">
                    VAT: {customer.vat_number}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setEditingCustomer(customer)}
                  disabled={isLoading}
                  className="text-[13px] text-design-content-weak hover:text-design-content-default transition-colors disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  disabled={isLoading}
                  className="text-[13px] text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-design-content-weak py-8 text-center">
          No customers added yet. Add your first customer to get started.
        </p>
      )}

      {/* Add Customer Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="inline-flex items-center text-[14px] text-design-content-weak hover:text-design-content-default transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Add Customer
      </button>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCustomer}
        isLoading={isLoading}
      />

      {/* Edit Customer Modal */}
      <AddCustomerModal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSave={handleUpdateCustomer}
        isLoading={isLoading}
        initialData={editingCustomer || undefined}
        isEditing
      />
    </div>
  )
}

