import { Skeleton } from "@/app/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Profile Form Skeleton */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl p-6 mb-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Bank Accounts Skeleton */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl p-6 mb-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border border-design-border-default rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button Skeleton */}
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  )
}

