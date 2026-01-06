'use client'

import Header from '@/app/components/Header'
import CustomersList from './CustomersList'
import AddCustomerButton from './AddCustomerButton'
import type { CustomerWithStats } from './page'

interface CustomersPageContentProps {
  initialCustomers: CustomerWithStats[]
  error: string | null
}

export default function CustomersPageContent({ 
  initialCustomers, 
  error 
}: CustomersPageContentProps) {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Customers"
        actions={<AddCustomerButton />}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Customers List */}
      <CustomersList 
        initialCustomers={initialCustomers} 
      />
    </div>
  )
}
