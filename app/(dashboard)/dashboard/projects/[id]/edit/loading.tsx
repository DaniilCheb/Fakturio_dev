import { Skeleton } from "@/app/components/ui/skeleton"

export default function EditProjectLoading() {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

