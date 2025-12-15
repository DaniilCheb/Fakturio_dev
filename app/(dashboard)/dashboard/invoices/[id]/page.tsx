'use client'

import { notFound } from "next/navigation"
import { useParams } from "next/navigation"
import { useInvoice, useProject } from "@/lib/hooks/queries"
import InvoiceDetailClient from "./InvoiceDetailClient"
import InvoiceDetailSkeleton from "./InvoiceDetailSkeleton"

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  
  const { data: invoice, isLoading: isLoadingInvoice } = useInvoice(invoiceId)
  const { data: project, isLoading: isLoadingProject } = useProject(invoice?.project_id)

  if (isLoadingInvoice) {
    return <InvoiceDetailSkeleton />
  }

  if (!invoice) {
    notFound()
  }

  // Show skeleton while project is loading (if invoice has a project)
  if (invoice.project_id && isLoadingProject) {
    return <InvoiceDetailSkeleton />
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <InvoiceDetailClient 
        invoice={invoice} 
        project={project || null} 
        title={`Invoice ${invoice.invoice_number || invoice.id}`} 
      />
    </div>
  )
}

