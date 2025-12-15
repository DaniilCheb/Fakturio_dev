'use client'

import { notFound } from "next/navigation"
import { useParams } from "next/navigation"
import { useContact, useInvoices, useProjects } from "@/lib/hooks/queries"
import CustomerDetailClient from "./CustomerDetailClient"
import CustomerDetailSkeleton from "./loading"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  
  const { data: customer, isLoading: isLoadingCustomer } = useContact(customerId)
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: allProjects = [], isLoading: isLoadingProjects } = useProjects()

  if (isLoadingCustomer || isLoadingInvoices || isLoadingProjects) {
    return <CustomerDetailSkeleton />
  }

  if (!customer) {
    notFound()
  }

  // Filter invoices and projects for this customer
  const customerInvoices = allInvoices.filter(inv => inv.contact_id === customer.id)
  const customerProjects = allProjects.filter(proj => proj.contact_id === customer.id)

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <CustomerDetailClient 
        customer={customer}
        invoices={customerInvoices}
        projects={customerProjects}
      />
    </div>
  )
}

