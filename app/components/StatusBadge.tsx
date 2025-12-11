'use client'

import React from 'react'

type StatusType = 'issued' | 'paid' | 'overdue'

interface StatusBadgeProps {
  status: StatusType
}

const statusStyles: Record<StatusType, { bg: string; text: string; label: string }> = {
  issued: {
    bg: 'bg-[#e3f2fd] dark:bg-[#1a3a5c]',
    text: 'text-[#1976d2] dark:text-[#64b5f6]',
    label: 'Issued'
  },
  paid: {
    bg: 'bg-[#e8f5e9] dark:bg-[#1b4332]',
    text: 'text-[#2e7d32] dark:text-[#4ade80]',
    label: 'Paid'
  },
  overdue: {
    bg: 'bg-[#ffebee] dark:bg-[#4a1c1c]',
    text: 'text-[#c62828] dark:text-[#f87171]',
    label: 'Overdue'
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.issued
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

