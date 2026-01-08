'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Trash2, Play, Pause } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { formatDate } from '@/lib/utils/dateUtils'
import { formatCurrency } from '@/lib/utils/formatters'

interface RecurringInvoice {
  id: string
  contact_id?: string
  project_id?: string
  currency: string
  total: number
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  next_run_date: string
  end_date?: string
  is_active: boolean
  auto_send: boolean
  invoices_created: number
  last_run_date?: string
  created_at: string
}

export default function RecurringInvoicesPage() {
  const router = useRouter()
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecurringInvoices()
  }, [])

  const loadRecurringInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recurring-invoices')
      
      if (!response.ok) {
        throw new Error('Failed to load recurring invoices')
      }

      const data = await response.json()
      setRecurringInvoices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring invoices')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/recurring-invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update recurring invoice')
      }

      await loadRecurringInvoices()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update recurring invoice')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring invoice?')) {
      return
    }

    try {
      const response = await fetch(`/api/recurring-invoices/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete recurring invoice')
      }

      await loadRecurringInvoices()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete recurring invoice')
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return labels[frequency] || frequency
  }

  if (isLoading) {
    return (
      <div className="max-w-[920px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Recurring Invoices</h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recurring Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Automatically generate invoices on a schedule
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/invoices/recurring/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Recurring Invoice
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {recurringInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No recurring invoices yet
            </p>
            <Button onClick={() => router.push('/dashboard/invoices/recurring/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Recurring Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recurringInvoices.map((recurring) => (
            <Card key={recurring.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {formatCurrency(recurring.total, recurring.currency)} - {getFrequencyLabel(recurring.frequency)}
                    </CardTitle>
                    <Badge variant={recurring.is_active ? 'default' : 'secondary'}>
                      {recurring.is_active ? 'Active' : 'Paused'}
                    </Badge>
                    {recurring.auto_send && (
                      <Badge variant="outline">Auto-send</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(recurring.id, recurring.is_active)}
                    >
                      {recurring.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/invoices/recurring/${recurring.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recurring.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Next Run</p>
                    <p className="font-medium">{formatDate(recurring.next_run_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invoices Created</p>
                    <p className="font-medium">{recurring.invoices_created}</p>
                  </div>
                  {recurring.last_run_date && (
                    <div>
                      <p className="text-muted-foreground">Last Run</p>
                      <p className="font-medium">{formatDate(recurring.last_run_date)}</p>
                    </div>
                  )}
                  {recurring.end_date && (
                    <div>
                      <p className="text-muted-foreground">Ends</p>
                      <p className="font-medium">{formatDate(recurring.end_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}




