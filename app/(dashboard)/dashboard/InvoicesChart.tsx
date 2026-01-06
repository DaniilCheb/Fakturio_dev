'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from "@/app/components/ui/skeleton"
import { Card } from "@/app/components/ui/card"

// Lazy load the chart component with SSR disabled
const DashboardChart = dynamic(() => import('./DashboardChart'), {
  loading: () => (
    <Card className="overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <Skeleton className="h-[180px] w-full" />
      </div>
    </Card>
  ),
  ssr: false,
})

interface Invoice {
  id: string
  issued_on: string
  total: number
  currency: string
}

interface InvoicesChartProps {
  invoices: Invoice[]
  defaultCurrency?: string
}

export default function InvoicesChart({ invoices, defaultCurrency = "CHF" }: InvoicesChartProps) {
  if (invoices.length === 0) {
    return null
  }

  return <DashboardChart invoices={invoices} defaultCurrency={defaultCurrency} />
}

