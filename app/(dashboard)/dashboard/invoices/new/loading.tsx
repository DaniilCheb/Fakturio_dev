import { Skeleton } from "@/app/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Form Sections */}
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Invoice Header Card */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* To Section */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        {/* Payment Information Section */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <Skeleton className="h-11 w-full sm:w-24 rounded-full" />
          <Skeleton className="h-11 w-full sm:w-32 rounded-full" />
          <Skeleton className="h-11 w-full sm:w-32 rounded-full" />
        </div>
      </div>
    </div>
  )
}

