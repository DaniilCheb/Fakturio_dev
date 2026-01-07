'use client'

import { Badge } from '@/app/components/ui/badge'

export type InvoiceStatus = 'paid' | 'overdue' | 'pending' | 'draft' | 'cancelled'
export type ProjectStatus = 'active' | 'inactive'
export type ExpenseType = 'one-time' | 'recurring' | 'asset'

interface StatusBadgeProps {
  variant: InvoiceStatus | ProjectStatus | ExpenseType
  label?: string
  frequency?: string // For recurring expenses
}

export default function StatusBadge({ variant, label, frequency }: StatusBadgeProps) {
  const variants: Record<string, { className: string; label: string }> = {
    // Invoice statuses
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
    draft: { 
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent hover:bg-gray-100",
      label: "Draft" 
    },
    cancelled: { 
      className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 border-transparent hover:bg-gray-100",
      label: "Cancelled" 
    },
    // Project statuses
    active: { 
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100",
      label: "Active" 
    },
    inactive: { 
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent hover:bg-gray-100",
      label: "Inactive" 
    },
    // Expense types
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
    },
  }

  const style = variants[variant] || variants.draft
  const displayLabel = label || style.label

  return (
    <Badge variant="outline" className={style.className}>
      {displayLabel}
    </Badge>
  )
}
