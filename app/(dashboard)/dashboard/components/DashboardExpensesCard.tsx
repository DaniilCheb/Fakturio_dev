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
import type { Expense } from "@/lib/services/expenseService.client"

interface DashboardExpensesCardProps {
  expenses: Expense[]
  accountCurrency?: string
}

const chartConfig = {
  amount: {
    label: "Amount",
    color: "#ff812e", // Orange color
  },
} satisfies ChartConfig

function formatCurrency(amount: number, currency = "CHF"): string {
  const rounded = Math.round(amount)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return `${currency} ${formatted}`
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

export default function DashboardExpensesCard({ expenses, accountCurrency = "CHF" }: DashboardExpensesCardProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()

  // Calculate monthly data for current year only (12 months)
  const { monthlyData, periodExpenses } = useMemo(() => {
    const months: { month: string; monthFull: string; amount: number }[] = []
    
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

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1)
      const monthTotal = calculateMonthTotal(date)
      
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        monthFull: date.toLocaleDateString("en-US", { month: "long" }),
        amount: monthTotal,
      })
    }

    // Filter expenses for current year
    const filtered = expenses.filter((exp) => {
      const expDate = getExpenseDate(exp)
      return expDate.getFullYear() === currentYear
    })

    return { monthlyData: months, periodExpenses: filtered }
  }, [expenses, currentYear, accountCurrency])

  const totalAmount = monthlyData.reduce((sum, month) => sum + month.amount, 0)
  
  // Calculate monthly average based on current month (this card always shows current year)
  const currentMonth = new Date().getMonth() + 1
  const monthlyAverage = totalAmount / currentMonth

  const displayAmount = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.amount ?? 0 
    : totalAmount
  
  const displayLabel = hoveredMonth !== null 
    ? monthlyData[hoveredMonth]?.monthFull ?? "Total" 
    : "Total"

  return (
    <Card className="overflow-hidden group w-full">
      <div className="border-b border-border px-3 sm:px-4 py-2 flex items-center justify-between">
        <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
          {currentYear} EXPENSES
        </p>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="opacity-0 group-hover:opacity-100 transition-opacity h-auto py-1.5 px-2 text-[12px]"
        >
          <Link href="/dashboard/expenses/new">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Expense
          </Link>
        </Button>
      </div>
      <CardContent className="px-3 sm:px-3.5 py-4 sm:py-5 space-y-4 sm:space-y-5">
        {/* Stats Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <div className="flex-1 space-y-1">
            <p className="text-[12px] sm:text-[13px] text-muted-foreground font-light">
              {displayLabel}
            </p>
            <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight">
              {formatCurrency(displayAmount, accountCurrency)}
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[12px] sm:text-[13px] text-muted-foreground font-light">Monthly Average</p>
            <p className="text-[20px] sm:text-[24px] font-semibold tracking-tight">
              {formatCurrency(monthlyAverage, accountCurrency)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <ChartContainer config={chartConfig} className="h-[80px] w-full max-[400px]:hidden">
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

