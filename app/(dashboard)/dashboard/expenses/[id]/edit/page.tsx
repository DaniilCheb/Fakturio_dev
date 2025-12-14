'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { getExpenseByIdWithClient, updateExpenseWithClient } from '@/lib/services/expenseService.client'
import { getUserProfileWithClient } from '@/lib/services/settingsService.client'
import { formatDateISO } from '@/lib/utils/dateUtils'
import { formatCurrency } from '@/lib/utils/formatters'

// Components
import Input from '@/app/components/Input'
import DatePicker from '@/app/components/DatePicker'
import Dropdown from '@/app/components/Dropdown'
import CurrencyPicker from '@/app/components/CurrencyPicker'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Loader2 } from 'lucide-react'

// Expense categories
const EXPENSE_CATEGORIES = [
  'Office',
  'Travel',
  'Software',
  'Equipment',
  'Marketing',
  'Professional Services',
  'Other'
]

// Expense types
const EXPENSE_TYPES = [
  { value: 'one-time', label: 'One-time' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'asset', label: 'Asset' }
]

// Frequency options for recurring expenses
const FREQUENCY_OPTIONS = [
  'Weekly',
  'Monthly',
  'Quarterly',
  'Yearly',
  'Other'
]

// Validation types
interface ValidationErrors {
  name?: string
  amount?: string
  date?: string
  [key: string]: string | undefined
}

// Priority order for error fields (top to bottom in form)
const ERROR_FIELD_PRIORITY = [
  'name',
  'amount',
  'date'
]

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [expenseId, setExpenseId] = useState<string | null>(null)
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [category, setCategory] = useState('Other')
  const [type, setType] = useState<'one-time' | 'recurring' | 'asset'>('one-time')
  const [date, setDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [frequency, setFrequency] = useState('Monthly')
  const [depreciationYears, setDepreciationYears] = useState('3')
  const [description, setDescription] = useState('')

  // Account currency state
  const [accountCurrency, setAccountCurrency] = useState('CHF')
  const [isLoading, setIsLoading] = useState(true)

  // UI state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Load expense data and account currency
  useEffect(() => {
    async function loadData() {
      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      try {
        // Get expense ID from params
        const resolvedParams = await params
        const id = resolvedParams.id
        setExpenseId(id)

        // Load expense and profile in parallel
        const [expense, profile] = await Promise.all([
          getExpenseByIdWithClient(supabase, user.id, id),
          getUserProfileWithClient(supabase, user.id).catch(() => null)
        ])

        if (!expense) {
          router.push('/dashboard/expenses')
          return
        }

        // Set form values from expense
        setName(expense.name || '')
        setAmount(String(expense.amount || ''))
        setCurrency(expense.currency || 'CHF')
        setCategory(expense.category || 'Other')
        setType(expense.type || 'one-time')
        setDate(expense.date ? formatDateISO(new Date(expense.date)) : '')
        setEndDate(expense.end_date ? formatDateISO(new Date(expense.end_date)) : '')
        setFrequency(expense.frequency || 'Monthly')
        setDepreciationYears(String(expense.depreciation_years || 3))
        setDescription(expense.description || '')

        if (profile?.account_currency) {
          setAccountCurrency(profile.account_currency)
        }
      } catch (error) {
        console.error('Error loading expense:', error)
        router.push('/dashboard/expenses')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, user, params, router])

  // Scroll to first error field
  const scrollToFirstError = useCallback((errors: ValidationErrors) => {
    const firstErrorField = ERROR_FIELD_PRIORITY.find(field => errors[field])
    
    if (firstErrorField) {
      const element = document.querySelector(`[data-field="${firstErrorField}"]`)
      if (element) {
        const offset = 100
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth'
        })
        
        setTimeout(() => {
          const input = element.querySelector('input, button, select')
          if (input && 'focus' in input) {
            (input as HTMLElement).focus()
          }
        }, 500)
      }
    }
  }, [])

  // Clear specific validation error
  const clearError = (field: keyof ValidationErrors) => {
    setValidationErrors(prev => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  // Validate form
  const validateForm = (): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {}

    if (!name.trim()) {
      errors.name = 'Expense name is required'
    }
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount'
    }
    if (!date) {
      errors.date = 'Date is required'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateForm()
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      scrollToFirstError(validation.errors)
      return
    }

    if (!supabase || !user || !expenseId) {
      alert('Please sign in to update an expense')
      return
    }

    setIsSaving(true)
    
    try {
      await updateExpenseWithClient(supabase, user.id, expenseId, {
        name: name.trim(),
        amount: parseFloat(amount),
        currency: currency,
        category: category as any,
        type: type,
        date: date,
        end_date: type === 'recurring' && endDate ? endDate : undefined,
        frequency: type === 'recurring' ? frequency as any : undefined,
        depreciation_years: type === 'asset' ? parseInt(depreciationYears) : undefined,
        description: description.trim() || undefined,
      })
      
      // Invalidate expenses queries to refetch the list and detail
      await queryClient.invalidateQueries({ queryKey: ['expenses', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['expense', expenseId] })
      
      // Redirect to expense detail
      router.push(`/dashboard/expenses/${expenseId}`)
    } catch (error) {
      console.error('Error updating expense:', error)
      alert(`Failed to update expense: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (!session || !user || !supabase || isLoading) {
    return (
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
            Edit Expense
          </h1>
        </div>
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-6">
            {/* Expense Name */}
            <Input
              label="Expense name"
              placeholder="e.g., Office supplies, Software subscription"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={validationErrors.name}
              onErrorClear={() => clearError('name')}
              fieldName="name"
              required
            />
            
            {/* Row: Amount, Currency, Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={validationErrors.amount}
                onErrorClear={() => clearError('amount')}
                fieldName="amount"
                required
              />
              
              <CurrencyPicker
                label="Currency"
                value={currency}
                onChange={(value) => setCurrency(value)}
              />
              
              <Dropdown
                label="Category"
                value={category}
                onChange={(value) => setCategory(value)}
                options={EXPENSE_CATEGORIES}
                placeholder="Select a category"
              />
            </div>
            
            {/* Row: Type and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense Type Segmented Control */}
              <div className="flex flex-col gap-1">
                <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">Type</label>
                <div className="flex items-center bg-[#F7F5F2] dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] rounded-lg p-1 h-[40px]">
                  {EXPENSE_TYPES.map((expenseType) => (
                    <button
                      key={expenseType.value}
                      type="button"
                      onClick={() => setType(expenseType.value as any)}
                      className={`flex-1 h-full rounded-md text-[14px] font-medium transition-all ${
                        type === expenseType.value
                          ? 'bg-white dark:bg-[#333] text-[#141414] dark:text-white shadow-sm border border-[#e0e0e0] dark:border-[#444]'
                          : 'text-[#666666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white'
                      }`}
                    >
                      {expenseType.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Date */}
              <DatePicker
                label={type === 'recurring' ? 'Start date' : 'Date'}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={validationErrors.date}
                onErrorClear={() => clearError('date')}
                fieldName="date"
                required
              />
            </div>
            
            {/* Depreciation Years - Only shown for Asset type */}
            {type === 'asset' && (
              <div className="flex flex-col gap-1">
                <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">Depreciation Period (years)</label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={depreciationYears}
                    onChange={(e) => setDepreciationYears(e.target.value)}
                    className="w-[100px]"
                    noLabel
                  />
                  <span className="text-[14px] text-[#666666] dark:text-[#999]">
                    Annual depreciation: {formatCurrency(
                      (parseFloat(amount) || 0) / (parseInt(depreciationYears) || 1),
                      currency
                    )}
                  </span>
                </div>
              </div>
            )}
            
            {/* Frequency and End Date - Only shown for Recurring type */}
            {type === 'recurring' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Dropdown
                  label="Frequency"
                  value={frequency}
                  onChange={(value) => setFrequency(value)}
                  options={FREQUENCY_OPTIONS}
                  placeholder="Select frequency"
                />
                <DatePicker
                  label="End date (optional)"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="No end date"
                />
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional notes..."
                className="w-full min-h-[80px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:ring-2 focus:ring-design-button-primary focus:border-transparent resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/expenses/${expenseId}`)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

