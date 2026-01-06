"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChevronDown } from "lucide-react"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Card, CardContent } from "@/app/components/ui/card"
import SectionHeader from "@/app/components/SectionHeader"

interface Invoice {
  id: string
  issued_on: string
  total: number
  currency: string
  amount_in_account_currency?: number
  exchange_rate?: number
}

interface DashboardChartProps {
  invoices: Invoice[]
  defaultCurrency?: string
}

type TimePeriod = "this-year" | "last-12-months" | `year-${number}`

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(168, 67%, 35%)", // Teal color like the original
  },
} satisfies ChartConfig

// Deterministic currency formatter to avoid Intl.NumberFormat SSR/client mismatch
function formatCurrency(amount: number, currency = "CHF"): string {
  const rounded = Math.round(amount)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `${currency} ${formatted}`
}

export default function DashboardChart({ invoices, defaultCurrency = "CHF" }: DashboardChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("this-year")
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)

  // Get available years from invoices
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set<number>()
    
    invoices.forEach((inv) => {
      const year = new Date(inv.issued_on).getFullYear()
      if (year !== currentYear) {
        years.add(year)
      }
    })
    
    return Array.from(years).sort((a, b) => b - a)
  }, [invoices])

  // Calculate monthly data based on selected time period
  const { monthlyData, periodInvoices } = useMemo(() => {
    const now = new Date()
    const months: { month: string; monthFull: string; amount: number; count: number }[] = []
    let startDate: Date
    let targetYear: number | undefined

    if (timePeriod.startsWith("year-")) {
      targetYear = parseInt(timePeriod.replace("year-", ""))
      startDate = new Date(targetYear, 0, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(targetYear, i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        
        const monthTotal = invoices.reduce((sum, inv) => {
          const invDate = new Date(inv.issued_on)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
          if (invMonthKey === monthKey) {
            // Determine the amount to use in account currency
            let amount: number
            if (inv.currency === defaultCurrency) {
              amount = inv.total
            } else if (inv.amount_in_account_currency !== undefined && inv.amount_in_account_currency !== null) {
              amount = inv.amount_in_account_currency
            } else if (inv.exchange_rate !== undefined && inv.exchange_rate !== null) {
              amount = inv.total * inv.exchange_rate
            } else {
              amount = inv.total
            }
            return sum + amount
          }
          return sum
        }, 0)
        
        const monthCount = invoices.filter((inv) => {
          const invDate = new Date(inv.issued_on)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
          return invMonthKey === monthKey
        }).length
        
        months.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          monthFull: date.toLocaleDateString("en-US", { month: "long" }),
          amount: monthTotal,
          count: monthCount,
        })
      }
    } else if (timePeriod === "this-year") {
      const currentYear = now.getFullYear()
      startDate = new Date(currentYear, 0, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        
        const monthTotal = invoices.reduce((sum, inv) => {
          const invDate = new Date(inv.issued_on)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
          if (invMonthKey === monthKey) {
            // Determine the amount to use in account currency
            let amount: number
            if (inv.currency === defaultCurrency) {
              amount = inv.total
            } else if (inv.amount_in_account_currency !== undefined && inv.amount_in_account_currency !== null) {
              amount = inv.amount_in_account_currency
            } else if (inv.exchange_rate !== undefined && inv.exchange_rate !== null) {
              amount = inv.total * inv.exchange_rate
            } else {
              amount = inv.total
            }
            return sum + amount
          }
          return sum
        }, 0)
        
        const monthCount = invoices.filter((inv) => {
          const invDate = new Date(inv.issued_on)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
          return invMonthKey === monthKey
        }).length
        
        months.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          monthFull: date.toLocaleDateString("en-US", { month: "long" }),
          amount: monthTotal,
          count: monthCount,
        })
      }
    } else {
      // Last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        
        const monthTotal = invoices.reduce((sum, inv) => {
          const invDate = new Date(inv.issued_on)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
          if (invMonthKey === monthKey) {
            // Determine the amount to use in account currency
            let amount: number
            if (inv.currency === defaultCurrency) {
              amount = inv.total
            } else if (inv.amount_in_account_currency !== undefined && inv.amount_in_account_currency !== null) {
              amount = inv.amount_in_account_currency
            } else if (inv.exchange_rate !== undefined && inv.exchange_rate !== null) {
              amount = inv.total * inv.exchange_rate
            } else {
              amount = inv.total
            }
            return sum + amount
          }
          return sum
        }, 0)
        
        const monthCount = invoices.filter((inv) => {
          const invDate = new Date(inv.issued_on)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
          return invMonthKey === monthKey
        }).length
        
        months.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          monthFull: date.toLocaleDateString("en-US", { month: "long" }),
          amount: monthTotal,
          count: monthCount,
        })
      }
    }

    // Filter invoices for the selected period
    const filtered = invoices.filter((inv) => {
      const invDate = new Date(inv.issued_on)
      if (timePeriod.startsWith("year-")) {
        const targetYear = parseInt(timePeriod.replace("year-", ""))
        return invDate.getFullYear() === targetYear
      }
      if (timePeriod === "this-year") {
        return invDate.getFullYear() === now.getFullYear()
      }
      return invDate >= startDate
    })

    return { monthlyData: months, periodInvoices: filtered }
  }, [invoices, timePeriod])

  const totalAmount = periodInvoices.reduce((sum, inv) => {
    // Determine the amount to use in account currency
    let amount: number
    if (inv.currency === defaultCurrency) {
      amount = inv.total
    } else if (inv.amount_in_account_currency !== undefined && inv.amount_in_account_currency !== null) {
      amount = inv.amount_in_account_currency
    } else if (inv.exchange_rate !== undefined && inv.exchange_rate !== null) {
      amount = inv.total * inv.exchange_rate
    } else {
      amount = inv.total
    }
    return sum + amount
  }, 0)
  const monthlyAverage = totalAmount / 12

  const getTimePeriodLabel = (period: TimePeriod) => {
    if (period === "this-year") return "This Year"
    if (period === "last-12-months") return "Last 12 Months"
    return period.replace("year-", "")
  }

  const displayAmount = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.amount ?? 0 
    : totalAmount
  
  const displayLabel = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.monthFull ?? "Total Invoiced" 
    : "Total Invoiced"

  return (
    <Card className="overflow-hidden">
      <SectionHeader>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-0 text-[12px] font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors focus:outline-none">
            {getTimePeriodLabel(timePeriod)}
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuItem 
              onClick={() => setTimePeriod("this-year")}
              className={timePeriod === "this-year" ? "font-medium" : ""}
            >
              This Year
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setTimePeriod("last-12-months")}
              className={timePeriod === "last-12-months" ? "font-medium" : ""}
            >
              Last 12 Months
            </DropdownMenuItem>
            {availableYears.map((year) => (
              <DropdownMenuItem
                key={year}
                onClick={() => setTimePeriod(`year-${year}`)}
                className={timePeriod === `year-${year}` ? "font-medium" : ""}
              >
                {year}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SectionHeader>
      <CardContent className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-1">
            <p className="text-[14px] text-muted-foreground transition-all duration-150">
              {displayLabel}
            </p>
            <p className="text-[28px] md:text-[32px] font-semibold tracking-tight transition-all duration-150">
              {formatCurrency(displayAmount, defaultCurrency)}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[14px] text-muted-foreground">Monthly Average</p>
            <p className="text-[28px] md:text-[32px] font-semibold tracking-tight">
              {formatCurrency(monthlyAverage, defaultCurrency)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart
            data={monthlyData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
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
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--background))" }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  formatter={(value, name, item) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.payload.monthFull}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(Number(value), defaultCurrency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.payload.count} invoice{item.payload.count !== 1 ? "s" : ""}
                      </span>
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
