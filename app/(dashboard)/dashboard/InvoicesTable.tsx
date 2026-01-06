'use client'

import { Suspense } from "react"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/app/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import SectionHeader from "@/app/components/SectionHeader"
import InvoiceRow from "./InvoiceRow"
import type { Invoice } from "@/lib/services/invoiceService"

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-[18px] font-semibold mb-2">
        No invoices yet
      </h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-sm mb-6">
        Create your first invoice to start tracking your business income.
      </p>
      <Button variant="default" asChild>
        <Link href="/dashboard/invoices/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Link>
      </Button>
    </div>
  )
}

// Loading skeleton for table
function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <SectionHeader>
        <Skeleton className="h-4 w-32" />
      </SectionHeader>
      <CardContent className="p-0">
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Invoices table component
function InvoicesTableContent({ invoices }: { invoices: Invoice[] }) {
  // Sort by issued date, newest first
  const sortedInvoices = [...invoices].sort((a, b) => {
    const dateA = new Date(a.issued_on || 0)
    const dateB = new Date(b.issued_on || 0)
    return dateB.getTime() - dateA.getTime()
  })

  if (sortedInvoices.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <EmptyState />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[13px] font-medium px-6">Client</TableHead>
              <TableHead className="text-[13px] font-medium px-6">Date</TableHead>
              <TableHead className="text-[13px] font-medium px-6">Amount</TableHead>
              <TableHead className="text-[13px] font-medium px-6">Status</TableHead>
              <TableHead className="text-right text-[13px] font-medium px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice as any} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  return <InvoicesTableContent invoices={invoices} />
}

