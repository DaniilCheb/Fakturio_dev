"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { EditIcon, CopyIcon, DeleteIcon, UploadIcon, DownloadIcon } from "@/app/components/Icons"
import { useConfirmDialog } from "@/app/components/useConfirmDialog"
import type { Expense } from "@/lib/services/expenseService.client"
import { formatDate } from "@/lib/utils/dateUtils"
import { formatCurrency } from "@/lib/utils/formatters"

// File icon (specific to this page)
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

interface ExpenseDetailClientProps {
  expense: Expense
  title: string
}

export default function ExpenseDetailClient({ expense: initialExpense, title }: ExpenseDetailClientProps) {
  const router = useRouter()
  const [expense, setExpense] = useState(initialExpense)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { confirm, DialogComponent } = useConfirmDialog()

  const getTypeBadge = (type: string, frequency?: string) => {
    const styles: Record<string, { className: string; label: string }> = {
      'one-time': { 
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100",
        label: "One-time"
      },
      'recurring': { 
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent hover:bg-blue-100",
        label: frequency || "Recurring"
      },
      'asset': { 
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent hover:bg-amber-100",
        label: "Asset"
      }
    }
    
    const style = styles[type] || styles['one-time']
    
    return (
      <Badge variant="outline" className={style.className}>
        {style.label}
      </Badge>
    )
  }

  const handleEdit = () => {
    router.push(`/dashboard/expenses/${expense.id}/edit`)
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/expenses/${expense.id}/duplicate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate expense")
      }

      const duplicated = await response.json()
      router.push(`/dashboard/expenses/${duplicated.id}`)
    } catch (error) {
      console.error("Error duplicating expense:", error)
      alert("Failed to duplicate expense. Please try again.")
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Expense",
      message: `Are you sure you want to delete "${expense.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete expense")
      }

      router.push('/dashboard/expenses')
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert("Failed to delete expense. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUploadClick = () => {
    // TODO: Implement receipt upload
    alert("Receipt upload functionality coming soon")
  }

  const handleDownloadReceipt = () => {
    if (!expense.receipt_url) return
    // TODO: Implement receipt download
    alert("Receipt download functionality coming soon")
  }

  const handleRemoveReceipt = async () => {
    const confirmed = await confirm({
      title: "Remove Receipt",
      message: "Are you sure you want to remove this receipt?",
      confirmText: "Remove",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_url: null }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove receipt")
      }

      const updated = await response.json()
      setExpense(updated)
      router.refresh()
    } catch (error) {
      console.error("Error removing receipt:", error)
      alert("Failed to remove receipt. Please try again.")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const displayCurrency = expense.currency || "CHF"
  const displayAmount = parseFloat(String(expense.amount)) || 0

  const actionButtons = (
    <div className="flex items-center gap-6">
      <button
        onClick={handleEdit}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <EditIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Edit</span>
      </button>
      <button
        onClick={handleDuplicate}
        disabled={isDuplicating}
        className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
          <CopyIcon size={18} />
        </div>
        <span className="text-[11px] font-medium">Duplicate</span>
      </button>
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
      {/* Header with Actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-[24px] md:text-[32px] text-foreground tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            {getTypeBadge(expense.type, expense.frequency)}
            <span className="text-[13px] text-muted-foreground">
              {expense.category || 'Other'}
            </span>
          </div>
        </div>
        {actionButtons}
      </div>

      {/* Expense Info Card */}
      <Card>
        {/* Amount Display */}
        <div className="p-6 border-b">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
          <p className="text-[32px] font-semibold">
            {formatCurrency(displayAmount, displayCurrency)}
          </p>
        </div>

        {/* Details Grid */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {expense.type === 'recurring' ? 'Start Date' : 'Date'}
              </p>
              <p className="text-[14px]">
                {formatDate(expense.date)}
              </p>
            </div>
            {expense.type === 'recurring' && expense.end_date && (
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">End Date</p>
                <p className="text-[14px]">
                  {formatDate(expense.end_date)}
                </p>
              </div>
            )}
            {expense.type === 'recurring' && expense.frequency && (
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Frequency</p>
                <p className="text-[14px]">
                  {expense.frequency}
                </p>
              </div>
            )}
            {expense.type === 'asset' && expense.depreciation_years && (
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Depreciation</p>
                <p className="text-[14px]">
                  {expense.depreciation_years} years
                </p>
              </div>
            )}
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Category</p>
              <p className="text-[14px]">
                {expense.category || 'Other'}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Created</p>
              <p className="text-[14px]">
                {formatDate(expense.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {expense.description && (
          <div className="p-6 border-b">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Description</p>
            <p className="text-[14px] text-foreground whitespace-pre-wrap">
              {expense.description}
            </p>
          </div>
        )}

        {/* Receipt Section */}
        <div className="p-6">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-3">Receipt / Invoice</p>
          
          {expense.receipt_url ? (
            <div className="flex items-center justify-between p-4 bg-[#F7F5F2] dark:bg-[#2a2a2a] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e3f2fd] dark:bg-[#1a3a5c] rounded-lg flex items-center justify-center">
                  <FileIcon />
                </div>
                <div>
                  <p className="text-[14px] font-medium">Receipt</p>
                  <p className="text-[12px] text-muted-foreground">
                    Receipt attached
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="p-2 text-[#555555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-full transition-colors"
                  title="Download"
                >
                  <DownloadIcon />
                </button>
                <button
                  onClick={handleRemoveReceipt}
                  className="p-2 text-[#555555] dark:text-[#aaa] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  title="Remove"
                >
                  <DeleteIcon size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="w-full p-6 border-2 border-dashed border-[#e0e0e0] dark:border-[#444] rounded-lg hover:border-[#b0b0b0] dark:hover:border-[#555] transition-colors flex flex-col items-center gap-2 text-[#666666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white"
            >
              <UploadIcon />
              <span className="text-[14px] font-medium">
                {uploading ? 'Uploading...' : 'Upload receipt'}
              </span>
              <span className="text-[12px]">PDF, max 5MB</span>
            </button>
          )}
        </div>
      </Card>
    </>
  )
}

