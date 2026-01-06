'use client'

import { useMemo, useState } from "react"
import Link from "next/link"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Plus } from "lucide-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/components/ui/chart"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface Invoice {
  id: string
  issued_on: string
  total: number
  currency: string
}

interface DashboardInvoicesCardProps {
  invoices: Invoice[]
  defaultCurrency?: string
}

const chartConfig = {
  amount: {
    label: "Amount",
    color: "#46937e", // Teal color
  },
} satisfies ChartConfig

function formatCurrency(amount: number, currency = "CHF"): string {
  const rounded = Math.round(amount)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `${currency} ${formatted}`
}

export default function DashboardInvoicesCard({ invoices, defaultCurrency = "CHF" }: DashboardInvoicesCardProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()

  // Calculate monthly data for current year only (12 months)
  const { monthlyData, periodInvoices } = useMemo(() => {
    const months: { month: string; monthFull: string; amount: number }[] = []
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      const monthTotal = invoices.reduce((sum, inv) => {
        const invDate = new Date(inv.issued_on)
        const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
        return invMonthKey === monthKey ? sum + inv.total : sum
      }, 0)
      
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        monthFull: date.toLocaleDateString("en-US", { month: "long" }),
        amount: monthTotal,
      })
    }

    // Filter invoices for current year
    const filtered = invoices.filter((inv) => {
      const invDate = new Date(inv.issued_on)
      return invDate.getFullYear() === currentYear
    })

    return { monthlyData: months, periodInvoices: filtered }
  }, [invoices, currentYear])

  const totalAmount = periodInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const monthlyAverage = totalAmount / 12

  const displayAmount = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.amount ?? 0 
    : totalAmount
  
  const displayLabel = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.monthFull ?? "Total" 
    : "Total"

  return (
    <Card className="overflow-hidden group">
      <div className="border-b border-border px-5 py-2 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
          {currentYear} INVOICES
        </p>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="opacity-0 group-hover:opacity-100 transition-opacity h-auto py-1.5 px-2 text-[12px]"
        >
          <Link href="/dashboard/invoices/new">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Invoice
          </Link>
        </Button>
      </div>
      <CardContent className="p-5 space-y-5">
        {/* Stats Row */}
        <div className="flex gap-5">
          <div className="flex-1 space-y-1">
            <p className="text-[13px] text-muted-foreground">
              {displayLabel}
            </p>
            <p className="text-[24px] font-medium tracking-tight">
              {formatCurrency(displayAmount, defaultCurrency)}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[13px] text-muted-foreground">Monthly Average</p>
            <p className="text-[24px] font-medium tracking-tight">
              {formatCurrency(monthlyAverage, defaultCurrency)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <ChartContainer config={chartConfig} className="h-[80px] w-full">
          <BarChart
            data={monthlyData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            onMouseMove={(state) => {
              if (state.activeTooltipIndex !== undefined) {
                setHoveredMonth(state.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setHoveredMonth(null)}
          >
            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              hide
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--background))" }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  formatter={(value) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{formatCurrency(Number(value), defaultCurrency)}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar 
              dataKey="amount" 
              fill="var(--color-amount)" 
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

