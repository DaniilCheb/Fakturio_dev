import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"

export default function Loading() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header with Actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Expense Info Card */}
      <Card>
        {/* Amount Display */}
        <div className="p-6 border-b">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Details Grid */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>

        {/* Receipt Section */}
        <div className="p-6">
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="p-4 bg-[#F7F5F2] dark:bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

