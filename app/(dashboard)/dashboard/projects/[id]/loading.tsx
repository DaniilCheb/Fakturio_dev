import { Skeleton } from "@/app/components/ui/skeleton"

export default function ProjectDetailLoading() {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

