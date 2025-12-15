import { Skeleton } from "@/app/components/ui/skeleton"
import { Card } from "@/app/components/ui/card"

export default function NewCustomerLoading() {
  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Form Skeleton */}
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Company Search Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="border-t border-[#e0e0e0] dark:border-[#333] pt-4">
              <Skeleton className="h-4 w-64 mb-4" />
            </div>
          </div>
        </Card>

        {/* Customer Details Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            {/* Notes textarea */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </Card>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <Skeleton className="h-11 w-full sm:w-24" />
          <Skeleton className="h-11 w-full sm:w-32" />
        </div>
      </div>
    </div>
  )
}

