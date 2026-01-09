import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardContent } from "@/app/components/ui/card"
import { ProjectRowSkeleton } from "@/app/components/Skeleton"
import Header from "@/app/components/Header"
import SectionHeader from "@/app/components/SectionHeader"
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
        title="Projects" 
        actions={<Skeleton className="h-10 w-32" />}
      />

      {/* Table Skeleton */}
      <Card className="overflow-hidden">
        <SectionHeader>
          <Skeleton className="h-4 w-32" />
        </SectionHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="px-6 text-[12px] font-normal capitalize !h-auto" style={{ color: 'rgba(61, 61, 61, 1)', paddingTop: '8px', paddingBottom: '8px' }}>
                  Projects
                </TableHead>
                <TableHead className="hidden sm:table-cell px-4 text-[12px] font-normal text-muted-foreground capitalize !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  Time tracked
                </TableHead>
                <TableHead className="hidden sm:table-cell px-6 text-[12px] font-normal text-muted-foreground capitalize !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  Billed
                </TableHead>
                <TableHead className="hidden sm:table-cell px-6 text-[12px] font-normal text-muted-foreground capitalize !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  Hourly rate
                </TableHead>
                <TableHead className="px-6 text-right text-[12px] font-normal text-muted-foreground capitalize !h-auto" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  Time tracking
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <ProjectRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

