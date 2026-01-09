import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"
import { ChartCardSkeleton, TableRowSkeleton } from "@/app/components/Skeleton"
import Header from "@/app/components/Header"
import SectionHeader from "@/app/components/SectionHeader"

export default function Loading() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Invoices" 
        actions={<Skeleton className="h-10 w-32" />}
      />

      {/* Chart Skeleton */}
      <Card className="overflow-hidden">
        <ChartCardSkeleton />
      </Card>

      {/* Table Skeleton */}
      <Card className="overflow-hidden">
        <SectionHeader>
          <Skeleton className="h-4 w-32" />
        </SectionHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRowSkeleton key={i} columns={5} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

