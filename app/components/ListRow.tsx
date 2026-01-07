'use client'

import Link from 'next/link'
import React from 'react'
import { TableCell, TableRow } from '@/app/components/ui/table'
import TableRowLabel from '@/app/components/TableRowLabel'
import StatusBadge, { type InvoiceStatus, type ProjectStatus, type ExpenseType } from '@/app/components/StatusBadge'
import { formatCurrency } from '@/lib/utils/formatters'

// Format currency for display (Swiss format)
function formatCurrencyDisplay(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date for display (invoice format)
function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export type ListRowColumn = 
  | { type: 'text'; value: string | number; muted?: boolean; bold?: boolean; className?: string }
  | { type: 'currency'; value: number; currency?: string; className?: string }
  | { type: 'badge'; variant: InvoiceStatus | ProjectStatus | ExpenseType; label?: string; frequency?: string; className?: string }
  | { type: 'custom'; content: React.ReactNode; className?: string }

export interface ListRowActions {
  onEdit?: () => void
  editHref?: string
  onDelete?: () => void
  onDownload?: () => void
  custom?: React.ReactNode
}

export interface ListRowProps {
  href?: string
  onClick?: (e: React.MouseEvent) => void
  primary: {
    text: string
    label?: string
  }
  columns: ListRowColumn[]
  actions?: ListRowActions
  className?: string
  padding?: 'default' | 'compact'
}

export default function ListRow({
  href,
  onClick,
  primary,
  columns,
  actions,
  className = '',
  padding = 'default',
}: ListRowProps) {
  const paddingClass = padding === 'compact' ? 'px-3.5 py-4' : 'px-6'
  const rowClassName = `group cursor-pointer hover:bg-muted/50 ${className}`

  const handleRowClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e)
    }
  }

  const renderColumn = (column: ListRowColumn, index: number) => {
    const columnClassName = column.className || ''
    switch (column.type) {
      case 'text':
        return (
          <TableCell key={index} className={`text-[14px] ${column.muted ? 'text-muted-foreground' : ''} ${column.bold ? 'font-medium' : ''} ${paddingClass} ${columnClassName}`}>
            {column.value}
          </TableCell>
        )
      case 'currency':
        return (
          <TableCell key={index} className={`text-[14px] font-medium ${paddingClass} ${columnClassName}`}>
            {formatCurrencyDisplay(column.value, column.currency || 'CHF')}
          </TableCell>
        )
      case 'badge':
        return (
          <TableCell key={index} className={`${paddingClass} ${columnClassName}`}>
            <StatusBadge variant={column.variant} label={column.label} frequency={column.frequency} />
          </TableCell>
        )
      case 'custom':
        return (
          <TableCell key={index} className={`${paddingClass} ${columnClassName}`}>
            {column.content}
          </TableCell>
        )
    }
  }

  const renderActions = () => {
    if (!actions) return null

    // Actions can be custom content or will be rendered by parent components
    // This provides a consistent cell structure
    return (
      <TableCell className={`text-right ${paddingClass}`}>
        {actions.custom || null}
      </TableCell>
    )
  }

  const primaryCell = href ? (
    <Link href={href} className="block">
      <TableRowLabel mainText={primary.text} labelText={primary.label} />
    </Link>
  ) : (
    <TableRowLabel mainText={primary.text} labelText={primary.label} />
  )

  return (
    <TableRow className={rowClassName} onClick={onClick ? handleRowClick : undefined}>
      <TableCell className={`font-medium ${paddingClass}`}>
        {primaryCell}
      </TableCell>
      {columns.map((column, index) => renderColumn(column, index))}
      {renderActions()}
    </TableRow>
  )
}

