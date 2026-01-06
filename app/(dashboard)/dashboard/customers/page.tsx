'use client'

import { useMemo } from 'react'
import { useContacts, useInvoices, useProjects } from '@/lib/hooks/queries'
import { type Contact } from '@/lib/services/contactService'
import CustomersPageContent from './CustomersPageContent'
import { Skeleton } from '@/app/components/ui/skeleton'

export interface CustomerWithStats extends Contact {
  invoiceCount: number
  projectCount: number
  totalAmount: number
}

function CustomersPageSkeleton() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { data: allContacts = [], isLoading: isLoadingContacts } = useContacts()
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: allProjects = [], isLoading: isLoadingProjects } = useProjects()

  const isLoading = isLoadingContacts || isLoadingInvoices || isLoadingProjects

  // Compute stats for each customer
  const customersWithStats = useMemo(() => {
    // Filter to only show customers (not suppliers)
    const customers = allContacts.filter(contact => contact.type === 'customer')

    return customers.map(customer => {
      const customerInvoices = allInvoices.filter(inv => inv.contact_id === customer.id)
      const customerProjects = allProjects.filter(proj => proj.contact_id === customer.id)
      const totalAmount = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)

      return {
        ...customer,
        invoiceCount: customerInvoices.length,
        projectCount: customerProjects.length,
        totalAmount
      }
    })
  }, [allContacts, allInvoices, allProjects])

  if (isLoading) {
    return <CustomersPageSkeleton />
  }

  return (
    <CustomersPageContent 
      initialCustomers={customersWithStats} 
      error={null}
    />
  )
}
