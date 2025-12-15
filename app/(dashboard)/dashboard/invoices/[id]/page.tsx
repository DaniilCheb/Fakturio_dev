import { notFound } from "next/navigation"
import { getInvoiceByIdWithClient } from "@/lib/services/invoiceService"
import { getProjectByIdWithClient } from "@/lib/services/projectService"
import { createServerSupabaseClient, getCurrentUserId } from "@/lib/supabase-server"
import InvoiceDetailClient from "./InvoiceDetailClient"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Parallelize client creation and user ID fetch
  const [supabase, userId] = await Promise.all([
    createServerSupabaseClient(),
    getCurrentUserId(),
  ])
  
  // Reuse client for invoice query
  const invoice = await getInvoiceByIdWithClient(supabase, userId, id)

  if (!invoice) {
    notFound()
  }

  // Fetch project if invoice has one, reusing the same client
  const project = invoice.project_id 
    ? await getProjectByIdWithClient(supabase, userId, invoice.project_id)
    : null

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <InvoiceDetailClient invoice={invoice} project={project} title={`Invoice ${invoice.invoice_number || invoice.id}`} />
    </div>
  )
}

