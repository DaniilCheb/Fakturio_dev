'use client'

import React from 'react'
import { Skeleton as BaseSkeleton } from '@/app/components/ui/skeleton'
import { TableRow, TableCell } from '@/app/components/ui/table'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <BaseSkeleton className={className} style={style} />
}

export function InvoiceRowSkeleton() {
  return (
    <div 
      className="grid gap-4 px-6 py-4 border-b border-[#f0f0f0] dark:border-[#333] last:border-none items-center"
      style={{ gridTemplateColumns: '1fr 100px 110px 80px 56px' }}
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

export function ExpenseRowSkeleton() {
  return (
    <div 
      className="grid gap-4 px-6 py-4 border-b border-[#f0f0f0] dark:border-[#333] last:border-none items-center"
      style={{ gridTemplateColumns: '1fr 95px 110px 80px 56px' }}
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="h-[180px] flex items-end justify-between gap-2 px-4">
      {[40, 80, 60, 20, 45, 30, 55, 35, 25, 70, 50, 65].map((height, i) => (
        <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${height}%` }} />
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export function AuthFormSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Social buttons skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-[44px] w-full rounded-full" />
        <Skeleton className="h-[44px] w-full rounded-full" />
      </div>

      {/* Divider skeleton */}
      <div className="flex items-center gap-3 my-4">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-px flex-1" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <Skeleton className="h-[13px] w-12" />
          <Skeleton className="h-[44px] w-full rounded-xl" />
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Skeleton className="h-[13px] w-16" />
          <Skeleton className="h-[44px] w-full rounded-xl" />
        </div>

        {/* Submit button */}
        <Skeleton className="h-[44px] w-full rounded-full mt-2" />
      </div>

      {/* Footer link skeleton */}
      <div className="mt-5 text-center">
        <Skeleton className="h-[14px] w-48 mx-auto" />
      </div>
    </div>
  )
}

// Generic table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-none">
      <Skeleton className="h-4 w-48" />
      {Array.from({ length: columns - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-24 hidden sm:block" />
      ))}
      <div className="flex-1" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  )
}

// Chart card skeleton with stats
export function ChartCardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats row */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      {/* Chart area */}
      <Skeleton className="h-[180px] w-full rounded-lg" />
    </div>
  )
}

// Project row skeleton
export function ProjectRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="px-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell px-4">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden sm:table-cell px-6">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="hidden sm:table-cell px-6">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="px-6 text-right">
        <Skeleton className="h-10 w-28 rounded-full ml-auto" />
      </TableCell>
    </TableRow>
  )
}

// Customer row skeleton
export function CustomerRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="px-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell px-6">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="hidden sm:table-cell px-6">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="hidden sm:table-cell px-6">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="px-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </TableCell>
    </TableRow>
  )
}

// Calendar skeleton for time tracking
export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      {/* Calendar grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-border">
          <Skeleton className="h-10 w-16" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
        {/* Time slots */}
        <div className="space-y-1 p-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-12 w-16" />
              <div className="flex-1 grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, j) => (
                  <Skeleton key={j} className="h-12" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

