import { Skeleton } from "@/app/components/ui/skeleton"
import { Card } from "@/app/components/ui/card"

export default function Loading() {
  return (
    <div className="max-w-[920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Expense Form */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-6">
          {/* Expense Name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Row: Amount, Currency, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* Row: Type and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Footer buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
        <Skeleton className="h-10 w-full sm:w-24 rounded-full" />
        <Skeleton className="h-10 w-full sm:w-40 rounded-full" />
      </div>
    </div>
  )
}

