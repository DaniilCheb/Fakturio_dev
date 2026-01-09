'use client'

import { useMemo } from 'react'
import { useContacts, useInvoices, useProjects } from '@/lib/hooks/queries'
import { type Contact } from '@/lib/services/contactService'
import CustomersPageContent from './CustomersPageContent'

export interface CustomerWithStats extends Contact {
  invoiceCount: number
  projectCount: number
  totalAmount: number
}

export default function CustomersPage() {
  const { data: allContacts = [], isLoading: isLoadingContacts } = useContacts()
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: allProjects = [], isLoading: isLoadingProjects } = useProjects()

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

  return (
    <CustomersPageContent 
      initialCustomers={customersWithStats} 
      error={null}
    />
  )
}
