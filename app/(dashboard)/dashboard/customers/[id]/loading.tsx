import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"

export default function CustomerDetailSkeleton() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-3" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-3" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

