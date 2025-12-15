'use client'

import { useExpenses, useProfile } from "@/lib/hooks/queries"
import { useMemo } from "react"
import Link from "next/link"
import { Plus, Wallet } from "lucide-react"

import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import Header from "@/app/components/Header"
import SectionHeader from "@/app/components/SectionHeader"
import ExpensesChart from "./ExpensesChart"
import ExpenseRowActions from "./ExpenseRowActions"
import type { Expense } from "@/lib/services/expenseService.client"
import TableRowLabel from "@/app/components/TableRowLabel"
import { formatDate } from "@/lib/utils/dateUtils"
import { formatCurrency } from "@/lib/utils/formatters"

// Format currency for display
function formatCurrencyDisplay(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Type badge component
function TypeBadge({ expense }: { expense: Expense }) {
  const type = expense.type
  const styles: Record<string, { className: string; label: string }> = {
    'one-time': { 
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent hover:bg-green-100",
      label: "One-time"
    },
    'recurring': { 
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent hover:bg-blue-100",
      label: expense.frequency || "Recurring"
    },
    'asset': { 
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent hover:bg-amber-100",
      label: "Asset"
    }
  }
  
  const style = styles[type] || styles['one-time']
  
  return (
    <Badge variant="outline" className={style.className}>
      {style.label}
    </Badge>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <Wallet className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-[18px] font-semibold mb-2">
        No expenses yet
      </h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-sm mb-6">
        Track your business expenses to better understand your spending.
      </p>
      <Button variant="default" asChild>
        <Link href="/dashboard/expenses/new">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Link>
      </Button>
    </div>
  )
}

// Loading skeleton component
function ExpensesSkeleton() {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
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
    </div>
  )
}

// Expense row component
function ExpenseRow({ expense, accountCurrency }: { expense: Expense; accountCurrency: string }) {
  const displayAmount = parseFloat(String(expense.amount)) || 0
  const displayCurrency = expense.currency || accountCurrency

  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium px-6">
        <Link href={`/dashboard/expenses/${expense.id}`} className="block">
          <TableRowLabel 
            mainText={expense.name} 
            labelText={expense.category || "Other"}
          />
        </Link>
      </TableCell>
      <TableCell className="text-[14px] text-muted-foreground px-6">
        {formatDate(expense.date)}
      </TableCell>
      <TableCell className="text-[14px] font-medium px-6">
        {formatCurrencyDisplay(displayAmount, displayCurrency)}
      </TableCell>
      <TableCell className="px-6">
        <TypeBadge expense={expense} />
      </TableCell>
      <TableCell className="text-right px-6">
        <ExpenseRowActions expense={expense} />
      </TableCell>
    </TableRow>
  )
}

export default function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses()
  const { data: profile } = useProfile()
  
  // Get account currency from profile, default to CHF
  const accountCurrency = useMemo(() => {
    return profile?.account_currency || "CHF"
  }, [profile])

  if (isLoading) {
    return <ExpensesSkeleton />
  }

  // Sort by date, newest first
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at || 0)
    const dateB = new Date(b.date || b.created_at || 0)
    return dateB.getTime() - dateA.getTime()
  })

  // Get the most common currency
  const currencyCount = sortedExpenses.reduce((acc, exp) => {
    const currency = exp.currency || accountCurrency
    acc[currency] = (acc[currency] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const defaultCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || accountCurrency

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Expenses" 
        actions={
          <Button variant="default" asChild>
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Link>
          </Button>
        }
      />

      {/* Stats & Chart */}
      {sortedExpenses.length > 0 && (
        <ExpensesChart expenses={sortedExpenses} accountCurrency={defaultCurrency} />
      )}

      {/* Expenses Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {sortedExpenses.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6">Name / Category</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Date</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Amount</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Type</TableHead>
                  <TableHead className="text-right text-[13px] font-medium px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} accountCurrency={accountCurrency} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

