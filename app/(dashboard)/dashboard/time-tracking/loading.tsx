import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"
import { CalendarSkeleton } from "@/app/components/Skeleton"
import Header from "@/app/components/Header"

export default function Loading() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Time Tracking" 
        actions={<Skeleton className="h-10 w-32" />}
      />

      {/* Calendar Skeleton */}
      <Card>
        <CardContent className="p-6">
          <CalendarSkeleton />
        </CardContent>
      </Card>
    </div>
  )
}

