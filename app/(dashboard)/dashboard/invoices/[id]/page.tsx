import { notFound } from "next/navigation"
import { getInvoiceById } from "@/lib/services/invoiceService"
import { getProjectById } from "@/lib/services/projectService"
import Header from "@/app/components/Header"
import InvoiceDetailClient from "./InvoiceDetailClient"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await getInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  // Fetch project if invoice has one
  let project = null
  if (invoice.project_id) {
    project = await getProjectById(invoice.project_id)
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <Header title={`Invoice ${invoice.invoice_number || invoice.id}`} />
      <InvoiceDetailClient invoice={invoice} project={project} />
    </div>
  )
}

