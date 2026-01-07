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
import type { Expense } from "@/lib/services/expenseService.client"

interface ExpensesChartProps {
  expenses: Expense[]
  accountCurrency?: string
}

type TimePeriod = "this-year" | "last-12-months" | `year-${number}`

const chartConfig = {
  amount: {
    label: "Amount",
    color: "#46937e", // Teal color (matching invoices)
  },
} satisfies ChartConfig

function formatCurrency(amount: number, currency = "CHF"): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Get expense date helper
function getExpenseDate(expense: Expense): Date {
  if (expense.date) {
    return new Date(expense.date)
  }
  return new Date(expense.created_at)
}

// Get the amount in account currency
function getExpenseAmountInAccountCurrency(expense: Expense, accountCurrency: string): number {
  const expenseCurrency = expense.currency || accountCurrency
  const expenseAmount = parseFloat(String(expense.amount)) || 0
  
  // If currency matches account currency, use amount directly
  if (expenseCurrency === accountCurrency) {
    return expenseAmount
  }
  
  // Use stored converted amount if available
  if (expense.amount_in_account_currency !== undefined && expense.amount_in_account_currency !== null) {
    return parseFloat(String(expense.amount_in_account_currency)) || 0
  }
  
  // Convert using stored exchange rate if available
  if (expense.exchange_rate !== undefined && expense.exchange_rate !== null) {
    return expenseAmount * parseFloat(String(expense.exchange_rate))
  }
  
  // Fallback: use original amount (may be in wrong currency for old data)
  return expenseAmount
}

// Convert recurring expense to monthly equivalent
function getMonthlyEquivalent(expense: Expense, accountCurrency: string): number {
  const amount = getExpenseAmountInAccountCurrency(expense, accountCurrency)
  
  if (expense.type !== "recurring" || !expense.frequency) {
    return amount // One-time or asset expenses are counted as-is
  }
  
  // Convert based on frequency
  switch (expense.frequency) {
    case "Weekly":
      return amount * 4.33 // Average weeks per month
    case "Monthly":
      return amount
    case "Quarterly":
      return amount / 3
    case "Yearly":
      return amount / 12
    default:
      return amount // 'Other' or unknown - treat as monthly
  }
}

export default function ExpensesChart({ expenses, accountCurrency = "CHF" }: ExpensesChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("this-year")
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)

  // Get available years from expenses
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years = new Set<number>()
    
    expenses.forEach((exp) => {
      const year = getExpenseDate(exp).getFullYear()
      if (year !== currentYear) {
        years.add(year)
      }
    })
    
    return Array.from(years).sort((a, b) => b - a)
  }, [expenses])

  // Calculate monthly data based on selected time period
  const { monthlyData, periodExpenses } = useMemo(() => {
    const now = new Date()
    const months: { month: string; monthFull: string; amount: number }[] = []
    let startDate: Date
    let targetYear: number | undefined

    const calculateMonthTotal = (date: Date) => {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      return expenses.reduce((sum, exp) => {
        const expDate = getExpenseDate(exp)
        const expMonthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`
        
        // For one-time and asset expenses, only count in the month they occurred
        if (exp.type !== "recurring") {
          if (expMonthKey === monthKey) {
            return sum + getExpenseAmountInAccountCurrency(exp, accountCurrency)
          }
          return sum
        }
        
        // For recurring expenses, check if the expense started before or during this month
        const expStartDate = new Date(expDate.getFullYear(), expDate.getMonth(), 1)
        const currentMonthDate = new Date(date.getFullYear(), date.getMonth(), 1)
        
        if (expStartDate <= currentMonthDate) {
          return sum + getMonthlyEquivalent(exp, accountCurrency)
        }
        return sum
      }, 0)
    }

    if (timePeriod.startsWith("year-")) {
      targetYear = parseInt(timePeriod.replace("year-", ""))
      startDate = new Date(targetYear, 0, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(targetYear, i, 1)
        const monthLabel = date.toLocaleDateString("en-US", { month: "short" })
        const monthLabelFull = date.toLocaleDateString("en-US", { month: "long" })
        const monthTotal = calculateMonthTotal(date)
        months.push({ month: monthLabel, monthFull: monthLabelFull, amount: monthTotal })
      }
    } else if (timePeriod === "this-year") {
      const currentYear = now.getFullYear()
      startDate = new Date(currentYear, 0, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1)
        const monthLabel = date.toLocaleDateString("en-US", { month: "short" })
        const monthLabelFull = date.toLocaleDateString("en-US", { month: "long" })
        const monthTotal = calculateMonthTotal(date)
        months.push({ month: monthLabel, monthFull: monthLabelFull, amount: monthTotal })
      }
    } else {
      // Last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthLabel = date.toLocaleDateString("en-US", { month: "short" })
        const monthLabelFull = date.toLocaleDateString("en-US", { month: "long" })
        const monthTotal = calculateMonthTotal(date)
        months.push({ month: monthLabel, monthFull: monthLabelFull, amount: monthTotal })
      }
    }

    // Filter expenses for the selected period
    const filtered = expenses.filter((exp) => {
      const expDate = getExpenseDate(exp)
      if (timePeriod.startsWith("year-")) {
        const targetYear = parseInt(timePeriod.replace("year-", ""))
        return expDate.getFullYear() === targetYear
      }
      if (timePeriod === "this-year") {
        return expDate.getFullYear() === now.getFullYear()
      }
      return expDate >= startDate
    })

    return { monthlyData: months, periodExpenses: filtered }
  }, [expenses, timePeriod, accountCurrency])

  const totalAmount = monthlyData.reduce((sum, month) => sum + month.amount, 0)
  
  // Calculate monthly average based on time period
  const now = new Date()
  let monthlyAverage: number
  if (timePeriod === "this-year") {
    // For current year, divide by current month (1-12)
    const currentMonth = now.getMonth() + 1
    monthlyAverage = totalAmount / currentMonth
  } else {
    // For past years and last-12-months, divide by 12
    monthlyAverage = totalAmount / 12
  }

  const getTimePeriodLabel = (period: TimePeriod) => {
    if (period === "this-year") return "This Year"
    if (period === "last-12-months") return "Last 12 Months"
    return period.replace("year-", "")
  }

  const displayAmount = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.amount ?? 0 
    : totalAmount
  
  const displayLabel = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.monthFull ?? "Total Expenses" 
    : "Total Expenses"

  return (
    <Card className="overflow-hidden">
      <SectionHeader>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-0 text-[12px] font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors focus:outline-none">
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
            <p className="text-[14px] text-muted-foreground font-light transition-all duration-150">
              {displayLabel}
            </p>
            <p className="text-[28px] md:text-[32px] font-semibold tracking-tight transition-all duration-150">
              {formatCurrency(displayAmount, accountCurrency)}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[14px] text-muted-foreground font-light">Monthly Average</p>
            <p className="text-[28px] md:text-[32px] font-semibold tracking-tight">
              {formatCurrency(monthlyAverage, accountCurrency)}
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
                  formatter={(value) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{formatCurrency(Number(value), accountCurrency)}</span>
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

