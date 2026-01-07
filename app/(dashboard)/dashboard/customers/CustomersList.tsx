'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { 
  deleteContactWithClient, 
  updateContactWithClient,
  type CreateContactInput
} from '@/lib/services/contactService.client'
import AddCustomerModal from './AddCustomerModal'
import { useConfirmDialog } from '@/app/components/useConfirmDialog'
import { EditIcon, DeleteIcon, CustomersIcon } from '@/app/components/Icons'
import { formatCurrency } from '@/lib/utils/formatters'
import ListRow, { type ListRowColumn } from '@/app/components/ListRow'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Button } from '@/app/components/ui/button'
import { FileText } from 'lucide-react'
import type { CustomerWithStats } from './page'

interface CustomersListProps {
  initialCustomers: CustomerWithStats[]
}

// Empty state component
function EmptyState() {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-[18px] font-semibold mb-2">
        No customers yet
      </h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-sm mb-6">
        Add your first customer to start tracking projects and invoices.
      </p>
      <Button variant="default" onClick={() => router.push('/dashboard/customers/new')}>
        <CustomersIcon size={16} className="mr-2" />
        New Customer
      </Button>
    </div>
  )
}

// Customer row component
function CustomerRow({ 
  customer, 
  onEdit, 
  onDelete, 
  isLoading 
}: { 
  customer: CustomerWithStats
  onEdit: () => void
  onDelete: () => void
  isLoading: boolean
}) {
  const displayName = customer.company_name || customer.name || 'N/A'

  const columns: ListRowColumn[] = [
    { type: 'text', value: `${customer.projectCount} ${customer.projectCount !== 1 ? 'projects' : 'project'}`, muted: true, className: 'hidden sm:table-cell' },
    { type: 'text', value: `${customer.invoiceCount} ${customer.invoiceCount !== 1 ? 'invoices' : 'invoice'}`, muted: true, className: 'hidden sm:table-cell' },
    { type: 'currency', value: customer.totalAmount, className: 'hidden sm:table-cell' },
  ]

  const actionsContent = (
    <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit()
        }}
        disabled={isLoading}
        className="h-[46px] w-[46px] sm:h-auto sm:w-auto sm:p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors disabled:opacity-50"
        title="Edit customer"
      >
        <EditIcon size={16} />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete()
        }}
        disabled={isLoading}
        className="h-[46px] w-[46px] sm:h-auto sm:w-auto sm:p-2 flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors disabled:opacity-50"
        title="Delete customer"
      >
        <DeleteIcon size={16} />
      </button>
    </div>
  )

  return (
    <ListRow
      href={`/dashboard/customers/${customer.id}`}
      primary={{
        text: displayName,
        label: customer.email,
      }}
      columns={columns}
      actions={{
        custom: actionsContent,
      }}
    />
  )
}

export default function CustomersList({ 
  initialCustomers
}: CustomersListProps) {
  const { session } = useSession()
  const [customers, setCustomers] = useState<CustomerWithStats[]>(initialCustomers)
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, DialogComponent } = useConfirmDialog()

  // Sync local state when initialCustomers prop changes (e.g., after creating a new customer)
  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

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

      // Preserve existing stats when updating
      const updatedWithStats: CustomerWithStats = {
        ...updated,
        invoiceCount: editingCustomer.invoiceCount,
        projectCount: editingCustomer.projectCount,
        totalAmount: editingCustomer.totalAmount
      }

      setCustomers(prev => prev.map(c => c.id === updated.id ? updatedWithStats : c))
      setEditingCustomer(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update customer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (customerId: string) => {
    if (!session) return
    
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this customer?',
      variant: 'destructive',
    })
    
    if (!confirmed) return

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

  return (
    <>
      {DialogComponent}
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Customers Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Projects</TableHead>
                  <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Invoices</TableHead>
                  <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Amount</TableHead>
                  <TableHead className="text-right text-[13px] font-medium px-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    onEdit={() => setEditingCustomer(customer)}
                    onDelete={() => handleDelete(customer.id)}
                    isLoading={isLoading}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      <AddCustomerModal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSave={handleUpdateCustomer}
        isLoading={isLoading}
        initialData={editingCustomer || undefined}
        isEditing
      />
    </>
  )
}
