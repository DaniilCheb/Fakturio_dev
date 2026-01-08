'use client'

import { useExpenses, useProfile } from "@/lib/hooks/queries"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Wallet, Download, Trash2, Search, X } from "lucide-react"
import { useSession } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Card, CardContent } from "@/app/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { Button } from "@/app/components/ui/button"
import { Checkbox } from "@/app/components/ui/checkbox"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import Header from "@/app/components/Header"
import SectionHeader from "@/app/components/SectionHeader"
import { useConfirmDialog } from "@/app/components/useConfirmDialog"
import ExpensesChart from "./ExpensesChart"
import ExpenseRowActions from "./ExpenseRowActions"
import type { Expense } from "@/lib/services/expenseService.client"
import ListRow, { type ListRowColumn } from "@/app/components/ListRow"
import { formatDate } from "@/lib/utils/dateUtils"

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
        <Link href="/dashboard/expenses/new?returnTo=/dashboard/expenses">
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
    <div className="max-w-[920px] mx-auto space-y-8">
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
function ExpenseRow({ 
  expense, 
  accountCurrency,
  checkbox 
}: { 
  expense: Expense
  accountCurrency: string
  checkbox?: {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
  }
}) {
  const displayAmount = parseFloat(String(expense.amount)) || 0
  const displayCurrency = expense.currency || accountCurrency
  const expenseType = (expense.type || 'one-time') as 'one-time' | 'recurring' | 'asset'

  const columns: ListRowColumn[] = [
    { type: 'text', value: formatDate(expense.date || expense.created_at), muted: true, className: 'hidden sm:table-cell' },
    { type: 'currency', value: displayAmount, currency: displayCurrency, className: 'hidden sm:table-cell' },
    { type: 'badge', variant: expenseType, frequency: expense.frequency, className: 'hidden sm:table-cell' },
  ]

  return (
    <ListRow
      href={`/dashboard/expenses/${expense.id}`}
      primary={{
        text: expense.name,
        label: expense.category || "Other",
      }}
      columns={columns}
      actions={{
        custom: <ExpenseRowActions expense={expense} />,
      }}
      checkbox={checkbox}
    />
  )
}

export default function ExpensesPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'expenses/page.tsx:128',message:'Component render started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { data: expenses = [], isLoading } = useExpenses()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'expenses/page.tsx:132',message:'After useExpenses hook',data:{isLoading,expensesLength:expenses.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { data: profile } = useProfile()
  const { session } = useSession()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useConfirmDialog()
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Get account currency from profile, default to CHF
  const accountCurrency = useMemo(() => {
    return profile?.account_currency || "CHF"
  }, [profile])

  // Extract unique years from expenses
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    expenses.forEach(expense => {
      const dateStr = expense.date || expense.created_at
      if (dateStr) {
        const year = new Date(dateStr).getFullYear()
        if (!isNaN(year)) {
          years.add(year)
        }
      }
    })
    return Array.from(years).sort((a, b) => b - a) // Sort descending
  }, [expenses])

  // Create year filter options
  const yearOptions = useMemo(() => {
    const options = [{ value: "all", label: "All time" }]
    availableYears.forEach(year => {
      options.push({ value: year.toString(), label: year.toString() })
    })
    return options
  }, [availableYears])

  // Filter expenses by selected year
  const filteredExpenses = useMemo(() => {
    if (selectedYear === "all") {
      return expenses
    }
    const year = parseInt(selectedYear)
    return expenses.filter(expense => {
      const dateStr = expense.date || expense.created_at
      if (!dateStr) return false
      const expenseYear = new Date(dateStr).getFullYear()
      return expenseYear === year
    })
  }, [expenses, selectedYear])

  // Filter expenses by search query
  const searchFilteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return filteredExpenses
    const query = searchQuery.toLowerCase().trim()
    return filteredExpenses.filter(expense => {
      const name = expense.name || ""
      const category = expense.category || ""
      const description = expense.description || ""
      return (
        name.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      )
    })
  }, [filteredExpenses, searchQuery])

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'expenses/page.tsx:181',message:'Before early return check',data:{isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Sort by date, newest first
  const sortedExpenses = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'expenses/page.tsx:186',message:'sortedExpenses useMemo hook called',data:{filteredExpensesLength:searchFilteredExpenses.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return [...searchFilteredExpenses].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0)
      const dateB = new Date(b.date || b.created_at || 0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [searchFilteredExpenses])

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'expenses/page.tsx:195',message:'After sortedExpenses hook, before early return',data:{isLoading,sortedExpensesLength:sortedExpenses.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  if (isLoading) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'expenses/page.tsx:199',message:'Early return executed - isLoading true',data:{isLoading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return <ExpensesSkeleton />
  }

  // Toggle expense selection
  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenseIds(prev => {
      const next = new Set(prev)
      if (next.has(expenseId)) {
        next.delete(expenseId)
      } else {
        next.add(expenseId)
      }
      return next
    })
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenseIds(new Set(sortedExpenses.map(expense => expense.id)))
    } else {
      setSelectedExpenseIds(new Set())
    }
  }

  // Check if all expenses are selected
  const allSelected = sortedExpenses.length > 0 && selectedExpenseIds.size === sortedExpenses.length

  // Export selected expenses to CSV
  const handleExportSelected = () => {
    if (selectedExpenseIds.size === 0) return

    const selectedExpenses = sortedExpenses.filter(exp => selectedExpenseIds.has(exp.id))
    
    // Create CSV content
    const headers = ['Name', 'Category', 'Date', 'Amount', 'Currency', 'Type', 'Frequency']
    const rows = selectedExpenses.map(expense => {
      const displayAmount = parseFloat(String(expense.amount)) || 0
      const displayCurrency = expense.currency || accountCurrency
      const expenseType = expense.type || 'one-time'
      return [
        expense.name || '',
        expense.category || 'Other',
        formatDate(expense.date || expense.created_at),
        displayAmount.toString(),
        displayCurrency,
        expenseType,
        expense.frequency || ''
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Exported ${selectedExpenses.length} expense(s)`)
  }

  // Delete selected expenses
  const handleDeleteSelected = async () => {
    if (!session || selectedExpenseIds.size === 0) return

    const selectedExpenses = sortedExpenses.filter(exp => selectedExpenseIds.has(exp.id))
    if (selectedExpenses.length === 0) return

    const confirmed = await confirm({
      title: "Delete Expenses",
      message: `Are you sure you want to delete ${selectedExpenses.length} expense${selectedExpenses.length === 1 ? '' : 's'}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      // Delete expenses one by one
      for (const expenseId of Array.from(selectedExpenseIds)) {
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Failed to delete expense ${expenseId}`)
        }
      }

      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['expenses'] })

      // Clear selection
      setSelectedExpenseIds(new Set())
      toast.success(`Deleted ${selectedExpenses.length} expense(s)`)
    } catch (error) {
      console.error("Error deleting expenses:", error)
      toast.error("Failed to delete expenses. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {DialogComponent}
      <div className="max-w-[920px] mx-auto space-y-8">
        {/* Header */}
        <Header 
          title="Expenses" 
          actions={
            <Button variant="default" asChild>
              <Link href="/dashboard/expenses/new?returnTo=/dashboard/expenses">
                <Plus className="mr-2 h-4 w-4" />
                New Expense
              </Link>
            </Button>
          }
        />

        {/* Stats & Chart */}
        {sortedExpenses.length > 0 && (
          <ExpensesChart expenses={sortedExpenses} accountCurrency={accountCurrency} />
        )}

        {/* Expenses Table */}
        <Card className="overflow-hidden">
          <SectionHeader 
            title="Expenses"
            actions={
              <div className="flex items-center gap-2">
                {selectedExpenseIds.size > 0 && (
                  <>
                    <Button
                      onClick={handleExportSelected}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      <Download className="h-4 w-4" style={{ marginRight: '2px' }} />
                      Export
                    </Button>
                    <Button
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" style={{ marginRight: '2px' }} />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </>
                )}
                <div className="relative h-8">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="list-search-input w-[200px] pl-8 pr-8 text-[13px] bg-transparent shadow-none rounded-md focus-visible:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px] h-8 text-[13px] bg-transparent shadow-none px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
          <CardContent className="p-0">
          {sortedExpenses.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Name / Category</TableHead>
                  <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Date</TableHead>
                  <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell text-[13px] font-medium px-6">Type</TableHead>
                  <TableHead className="text-right text-[13px] font-medium px-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((expense) => (
                  <ExpenseRow 
                    key={expense.id} 
                    expense={expense} 
                    accountCurrency={accountCurrency}
                    checkbox={{
                      checked: selectedExpenseIds.has(expense.id),
                      onCheckedChange: () => toggleExpenseSelection(expense.id)
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}

