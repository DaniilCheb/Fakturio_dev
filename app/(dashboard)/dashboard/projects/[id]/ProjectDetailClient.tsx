'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent } from '@/app/components/ui/card'
import StatusBadge from '@/app/components/StatusBadge'
import { EditIcon, DeleteIcon } from '@/app/components/Icons'
import BackLink from '@/app/components/BackLink'
import { useConfirmDialog } from '@/app/components/useConfirmDialog'
import { type Project, deleteProjectWithClient } from '@/lib/services/projectService.client'
import { type Invoice, getInvoiceStatus } from '@/lib/services/invoiceService.client'
import { type Contact } from '@/lib/services/contactService.client'
import { formatDate } from '@/lib/utils/dateUtils'
import { formatCurrency } from '@/lib/utils/formatters'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'

interface ProjectDetailClientProps {
  project: Project
  invoices: Invoice[]
  customer: Contact | undefined
}

export default function ProjectDetailClient({ project, invoices, customer }: ProjectDetailClientProps) {
  const router = useRouter()
  const { session } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const { confirm, DialogComponent } = useConfirmDialog()

  const customerName = customer?.company_name || customer?.name || 'Unknown Customer'
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)

  const handleDelete = async () => {
    if (!session) return

    const confirmed = await confirm({
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await deleteProjectWithClient(supabase, userId, project.id)
      router.push('/dashboard/projects')
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (invoice: Invoice) => {
    const status = getInvoiceStatus(invoice)
    const statusMap: Record<string, "paid" | "overdue" | "issued"> = {
      paid: "paid",
      overdue: "overdue",
      pending: "issued"
    }
    return <StatusBadge status={statusMap[status] || "issued"} />
  }

  const actionButtons = (
    <div className="flex items-center gap-6">
      <Link
        href={`/dashboard/projects/${project.id}/edit`}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <EditIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Edit</span>
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors">
          <DeleteIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Delete</span>
      </button>
    </div>
  )

  return (
    <>
      {DialogComponent}
      
      {/* Back Link */}
      <BackLink to="/dashboard/projects" label="Back to Projects" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-[24px] md:text-[32px] text-foreground tracking-tight mb-1">
            {project.name}
          </h1>
          {project.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          )}
        </div>
        {actionButtons}
      </div>

      {/* Project Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Customer
              </p>
              <p className="text-[15px] text-foreground">
                {customerName}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Total Invoiced
              </p>
              <p className="text-[15px] text-foreground font-medium">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Invoices
              </p>
              <p className="text-[15px] text-foreground">
                {invoices.length}
              </p>
            </div>
            {project.hourly_rate && (
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Hourly Rate
                </p>
                <p className="text-[15px] text-foreground font-medium">
                  {formatCurrency(project.hourly_rate, project.currency || 'CHF')} / hour
                </p>
              </div>
            )}
            {project.description && (
              <div className={project.hourly_rate ? "md:col-span-2" : "md:col-span-3"}>
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-[15px] text-foreground">
                  {project.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <div className="px-6 py-3 border-b">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
            Invoices
          </p>
        </div>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No invoices linked to this project yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6">Invoice</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Date</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Amount</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                  >
                    <TableCell className="font-medium px-6">
                      {invoice.invoice_number || `Invoice ${invoice.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="text-[14px] text-muted-foreground px-6">
                      {formatDate(invoice.issued_on || invoice.created_at)}
                    </TableCell>
                    <TableCell className="text-[14px] font-medium px-6">
                      {formatCurrency(invoice.total || 0, invoice.currency)}
                    </TableCell>
                    <TableCell className="px-6">
                      {getStatusBadge(invoice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

