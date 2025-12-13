'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-[#e5e5e5] dark:bg-[#333] rounded ${className}`} style={style} />
  )
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

