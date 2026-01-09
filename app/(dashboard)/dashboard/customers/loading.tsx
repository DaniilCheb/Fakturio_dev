import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"
import { CustomerRowSkeleton } from "@/app/components/Skeleton"
import Header from "@/app/components/Header"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"

export default function Loading() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Customers" 
        actions={<Skeleton className="h-10 w-32" />}
      />

      {/* Table Skeleton */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[13px] font-medium px-6">Customer</TableHead>
                <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Projects</TableHead>
                <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Invoices</TableHead>
                <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Amount</TableHead>
                <TableHead className="text-right text-[13px] font-medium px-3.5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <CustomerRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
