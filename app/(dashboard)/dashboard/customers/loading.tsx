import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"

export default function Loading() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[13px] font-medium px-6">Customer</TableHead>
                <TableHead className="text-[13px] font-medium px-6">Projects</TableHead>
                <TableHead className="text-[13px] font-medium px-6">Invoices</TableHead>
                <TableHead className="text-[13px] font-medium px-6">Amount</TableHead>
                <TableHead className="text-right text-[13px] font-medium px-3.5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell className="px-6">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-6">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-6">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

