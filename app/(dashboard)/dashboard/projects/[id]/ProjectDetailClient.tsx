'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useLoadingBar } from '@/app/components/LoadingBarContext'
import Link from 'next/link'
import { FileText, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/app/components/ui/card'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { EditIcon, DeleteIcon } from '@/app/components/Icons'
import { useConfirmDialog } from '@/app/components/useConfirmDialog'
import { type Project, deleteProjectWithClient } from '@/lib/services/projectService.client'
import { type Invoice, getInvoiceStatus } from '@/lib/services/invoiceService.client'
import { type Contact } from '@/lib/services/contactService.client'
import { type TimeEntry, calculateTimeEntrySummary, deleteTimeEntryWithClient } from '@/lib/services/timeEntryService.client'
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
  timeEntries: TimeEntry[]
}

export default function ProjectDetailClient({ project, invoices, customer, timeEntries }: ProjectDetailClientProps) {
  const router = useRouter()
  const { session } = useSession()
  const queryClient = useQueryClient()
  const { start: startLoadingBar } = useLoadingBar()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingEntries, setIsDeletingEntries] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())
  const { confirm, DialogComponent } = useConfirmDialog()

  const customerName = customer?.company_name || customer?.name || 'Unknown Customer'
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
  
  // Calculate total time tracked
  const totalTimeTracked = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0)

  // Format duration helper
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Get time entry status badge
  const getTimeEntryStatusBadge = (entry: TimeEntry) => {
    const isInvoiced = entry.status === 'invoiced' || entry.invoice_id !== null
    if (isInvoiced) {
      return (
        <Badge 
          variant="outline" 
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100"
        >
          Invoiced
        </Badge>
      )
    }
    return (
      <Badge 
        variant="outline" 
        className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent hover:bg-gray-100"
      >
        Not Issued
      </Badge>
    )
  }

  // Toggle entry selection
  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  // Handle invoice creation from selected entries
  const handleCreateInvoiceFromEntries = () => {
    if (selectedEntryIds.size === 0) return

    const selectedEntries = timeEntries.filter(e => selectedEntryIds.has(e.id))
    if (selectedEntries.length === 0) return

    try {
      // Start loading bar before navigation
      startLoadingBar()
      
      const summary = calculateTimeEntrySummary(selectedEntries, project.name)
      
      const params = new URLSearchParams({
        fromTimeEntries: 'true',
        projectId: project.id,
        entryIds: selectedEntries.map(e => e.id).join(','),
        hours: summary.total_hours.toString(),
        rate: summary.hourly_rate.toString(),
        amount: summary.total_amount.toString(),
        description: `${project.name} - ${summary.total_hours} hours (${summary.date_range.from} to ${summary.date_range.to})`,
      })
      
      router.push(`/dashboard/invoices/new?${params.toString()}`)
    } catch (error) {
      console.error('Error creating invoice from entries:', error)
      alert('Failed to prepare invoice. Please try again.')
    }
  }

  // Handle batch delete of selected entries
  const handleDeleteSelectedEntries = async () => {
    if (!session || selectedEntryIds.size === 0) return

    const selectedEntries = timeEntries.filter(e => selectedEntryIds.has(e.id))
    if (selectedEntries.length === 0) return

    const confirmed = await confirm({
      title: "Delete Time Entries",
      message: `Are you sure you want to delete ${selectedEntries.length} time ${selectedEntries.length === 1 ? 'entry' : 'entries'}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeletingEntries(true)
    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      // Delete entries one by one
      for (const entryId of Array.from(selectedEntryIds)) {
        await deleteTimeEntryWithClient(supabase, userId, entryId)
      }

      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      await queryClient.invalidateQueries({ queryKey: ['timeEntries', 'project', project.id] })

      // Clear selection
      setSelectedEntryIds(new Set())
    } catch (error) {
      console.error("Error deleting time entries:", error)
      alert("Failed to delete time entries. Please try again.")
    } finally {
      setIsDeletingEntries(false)
    }
  }

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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push('/dashboard/projects')
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const getProjectStatusBadge = (status: string) => {
    const isActive = status === 'active'
    const variants = {
      active: { 
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100",
        label: "Active" 
      },
      inactive: { 
        className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent hover:bg-gray-100",
        label: "Inactive" 
      },
    }

    const { className, label } = isActive ? variants.active : variants.inactive

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  const getStatusBadge = (invoice: Invoice) => {
    const status = getInvoiceStatus(invoice)
    const variants: Record<typeof status, { className: string; label: string }> = {
      paid: { 
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100",
        label: "Paid" 
      },
      pending: { 
        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent hover:bg-yellow-100",
        label: "Issued" 
      },
      overdue: { 
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent hover:bg-red-100",
        label: "Overdue" 
      },
    }

    const { className, label } = variants[status] || variants.pending

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
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
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-[24px] md:text-[32px] text-foreground tracking-tight mb-1">
            {project.name}
          </h1>
          {project.status && getProjectStatusBadge(project.status)}
        </div>
        {actionButtons}
      </div>

      {/* Project Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Customer
              </p>
              <p className="text-[15px] text-foreground">
                {customerName}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Time Tracked
              </p>
              <p className="text-[15px] text-foreground font-medium">
                {formatDuration(totalTimeTracked)}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Hourly Rate
              </p>
              <p className="text-[15px] text-foreground font-medium">
                {project.hourly_rate 
                  ? `${formatCurrency(project.hourly_rate, project.currency || 'CHF')} / hour`
                  : <span className="text-muted-foreground">Not set</span>
                }
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Amount
              </p>
              <p className="text-[15px] text-foreground font-medium">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Invoices
              </p>
              <p className="text-[15px] text-foreground">
                {invoices.length}
              </p>
            </div>
            {project.description && (
              <div className="md:col-span-3">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
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

      {/* Time Entries List */}
      <Card>
        <div className="px-6 py-3 border-b flex items-center justify-between">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            Time Entries
          </p>
          {selectedEntryIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCreateInvoiceFromEntries}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                <FileText className="h-4 w-4" style={{ marginRight: '2px' }} />
                Create invoice
              </Button>
              <Button
                onClick={handleDeleteSelectedEntries}
                disabled={isDeletingEntries}
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" style={{ marginRight: '2px' }} />
                {isDeletingEntries ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>
        <CardContent className="p-0">
          {timeEntries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No time entries for this project yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6 w-12">
                    <span className="sr-only">Select</span>
                  </TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Date</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Duration</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Description</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow 
                    key={entry.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="px-6">
                      <Checkbox
                        checked={selectedEntryIds.has(entry.id)}
                        onCheckedChange={() => toggleEntrySelection(entry.id)}
                      />
                    </TableCell>
                    <TableCell className="text-[14px] text-muted-foreground px-6">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="text-[14px] px-6">
                      {formatDuration(entry.duration_minutes)}
                    </TableCell>
                    <TableCell className="text-[14px] px-6">
                      {entry.description || <span className="text-muted-foreground italic">No description</span>}
                    </TableCell>
                    <TableCell className="px-6">
                      {getTimeEntryStatusBadge(entry)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <div className="px-6 py-3 border-b">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
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

