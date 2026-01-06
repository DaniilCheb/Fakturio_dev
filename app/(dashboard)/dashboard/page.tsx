'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useInvoices, useExpenses, useProfile } from '@/lib/hooks/queries'
import DashboardInvoicesCard from './components/DashboardInvoicesCard'
import DashboardExpensesCard from './components/DashboardExpensesCard'
import DashboardProjectsTable from './components/DashboardProjectsTable'
import { Skeleton } from '@/app/components/ui/skeleton'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Plus, FileText, Receipt, Users, FolderKanban } from 'lucide-react'
import { useLoadingBar } from '@/app/components/LoadingBarContext'

function DashboardSkeleton() {
  return (
    <div className="max-w-[920px] mx-auto space-y-8 px-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-5 space-y-5">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-5">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </Card>
        <Card className="p-5 space-y-5">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-5">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </Card>
      </div>
      <Card className="p-5">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { start: startLoadingBar } = useLoadingBar()
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: expenses = [], isLoading: isLoadingExpenses } = useExpenses()
  const { data: profile } = useProfile()
  
  const accountCurrency = profile?.currency || 'CHF'
  
  // Prepare invoice data for chart
  const chartInvoices = invoices.map((inv) => ({
    id: inv.id,
    issued_on: inv.issued_on,
    total: inv.total,
    currency: inv.currency,
  }))

  // Get the most common currency for invoices
  const currencyCount = invoices.reduce((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const defaultCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || accountCurrency

  const handleNavigate = (path: string) => {
    startLoadingBar()
    router.push(path)
  }

  if (isLoadingInvoices || isLoadingExpenses) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-[920px] mx-auto space-y-8 px-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-semibold tracking-tight">Dashboard</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create new
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleNavigate('/dashboard/invoices/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/dashboard/expenses/new')}>
              <Receipt className="mr-2 h-4 w-4" />
              Expense
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/dashboard/customers/new')}>
              <Users className="mr-2 h-4 w-4" />
              Customer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/dashboard/projects/new')}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Invoices and Expenses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DashboardInvoicesCard 
          invoices={chartInvoices} 
          defaultCurrency={defaultCurrency}
        />
        <DashboardExpensesCard 
          expenses={expenses} 
          accountCurrency={accountCurrency}
        />
      </div>

      {/* Projects Table */}
      <DashboardProjectsTable />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
