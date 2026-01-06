import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"

export default function InvoiceDetailSkeleton() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Client Info */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>

            {/* Invoice Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right space-y-1">
                <Skeleton className="h-3 w-16 ml-auto" />
                <Skeleton className="h-6 w-32 ml-auto" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


