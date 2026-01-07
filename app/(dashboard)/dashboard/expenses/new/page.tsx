'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { saveExpenseWithClient } from '@/lib/services/expenseService.client'
import { getUserProfileWithClient } from '@/lib/services/settingsService.client'
import { getCurrentDateISO } from '@/lib/utils/dateUtils'
import { formatCurrency } from '@/lib/utils/formatters'
import { getExchangeRate, convertAmount } from '@/lib/services/exchangeRateService'

// Components
import Input from '@/app/components/Input'
import DatePicker from '@/app/components/DatePicker'
import Dropdown from '@/app/components/Dropdown'
import CurrencyPicker from '@/app/components/CurrencyPicker'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Loader2 } from 'lucide-react'
import { UploadIcon, DeleteIcon } from '@/app/components/Icons'

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

export default function NewExpensePage() {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  
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
  const [date, setDate] = useState(getCurrentDateISO())
  const [endDate, setEndDate] = useState('')
  const [frequency, setFrequency] = useState('Monthly')
  const [depreciationYears, setDepreciationYears] = useState('3')
  const [description, setDescription] = useState('')

  // Receipt upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Account currency state
  const [accountCurrency, setAccountCurrency] = useState('CHF')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // UI state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Load account currency on mount
  useEffect(() => {
    async function loadAccountCurrency() {
      if (!supabase || !user) {
        setIsLoadingProfile(false)
        return
      }

      try {
        const profile = await getUserProfileWithClient(supabase, user.id)
        if (profile?.account_currency) {
          setAccountCurrency(profile.account_currency)
          setCurrency(profile.account_currency)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadAccountCurrency()
  }, [supabase, user])

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

  // Validate and set file
  const validateAndSetFile = (file: File) => {
    // Validate file type (PDF, images)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please select a PDF or image file (JPEG, PNG, WebP)')
      return false
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return false
    }

    setSelectedFile(file)
    return true
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    validateAndSetFile(file)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    validateAndSetFile(file)
  }

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setReceiptUrl(null)
    // Reset file input
    const fileInput = document.getElementById('receipt-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Upload receipt to Supabase storage
  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!supabase || !user) {
      throw new Error('Not authenticated')
    }

    setUploadingReceipt(true)
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `receipts/${fileName}`

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading receipt:', uploadError)
        throw new Error('Failed to upload receipt')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading receipt:', error)
      throw error
    } finally {
      setUploadingReceipt(false)
    }
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

    if (!supabase || !user) {
      alert('Please sign in to create an expense')
      return
    }

    setIsSaving(true)
    
    try {
      // Upload receipt if a file is selected
      let finalReceiptUrl = receiptUrl
      if (selectedFile && !receiptUrl) {
        try {
          finalReceiptUrl = await uploadReceipt(selectedFile)
          setReceiptUrl(finalReceiptUrl)
        } catch (error) {
          console.error('Error uploading receipt:', error)
          alert('Failed to upload receipt. The expense will be created without a receipt.')
          // Continue with expense creation even if receipt upload fails
        }
      }

      // Handle currency conversion if expense currency differs from account currency
      const expenseAmount = parseFloat(amount)
      let exchangeRate: number | undefined
      let amountInAccountCurrency: number | undefined

      if (currency && currency !== accountCurrency) {
        try {
          exchangeRate = await getExchangeRate(supabase, currency, accountCurrency, date)
          amountInAccountCurrency = convertAmount(expenseAmount, currency, accountCurrency, exchangeRate)
        } catch (error) {
          console.error('Error fetching exchange rate:', error)
          // Continue without conversion - expense will be saved with original currency
        }
      }

      await saveExpenseWithClient(supabase, user.id, {
        name: name.trim(),
        amount: expenseAmount,
        currency: currency,
        category: category as any,
        type: type,
        date: date,
        end_date: type === 'recurring' && endDate ? endDate : undefined,
        frequency: type === 'recurring' ? frequency as any : undefined,
        depreciation_years: type === 'asset' ? parseInt(depreciationYears) : undefined,
        description: description.trim() || undefined,
        receipt_url: finalReceiptUrl || undefined,
        exchange_rate: exchangeRate,
        amount_in_account_currency: amountInAccountCurrency,
      })
      
      // Invalidate expenses query to refetch the list
      await queryClient.invalidateQueries({ queryKey: ['expenses', user.id] })
      
      // Redirect to expenses list
      router.push('/dashboard/expenses')
    } catch (error) {
      console.error('Error saving expense:', error)
      alert(`Failed to save expense: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (!session || !user || !supabase || isLoadingProfile) {
    return (
      <div className="max-w-[920px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
            New Expense
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
                <div className="flex items-center bg-[#F8F7F6] dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] rounded-lg p-1 h-[40px]">
                  {EXPENSE_TYPES.map((expenseType) => (
                    <button
                      key={expenseType.value}
                      type="button"
                      onClick={() => setType(expenseType.value as any)}
                      className={`flex-1 h-full rounded-md text-[14px] font-normal transition-all ${
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

            {/* Receipt Upload */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">Receipt / Invoice (optional)</label>
              {selectedFile || receiptUrl ? (
                <div className="flex items-center justify-between p-4 bg-[#F7F5F2] dark:bg-[#2a2a2a] rounded-lg border border-[#e0e0e0] dark:border-[#444]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e3f2fd] dark:bg-[#1a3a5c] rounded-lg flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium">
                        {selectedFile?.name || 'Receipt attached'}
                      </p>
                      {selectedFile && (
                        <p className="text-[12px] text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-[#555555] dark:text-[#aaa] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    title="Remove"
                  >
                    <DeleteIcon size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full p-6 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center gap-2 cursor-pointer ${
                    isDragging
                      ? 'border-design-button-primary bg-design-button-primary/5 dark:bg-design-button-primary/10'
                      : 'border-[#e0e0e0] dark:border-[#444] hover:border-[#b0b0b0] dark:hover:border-[#555]'
                  } ${
                    uploadingReceipt ? 'opacity-50 cursor-not-allowed' : 'text-[#666666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white'
                  }`}
                >
                  <input
                    id="receipt-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploadingReceipt}
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="flex flex-col items-center gap-2 cursor-pointer w-full"
                  >
                    <UploadIcon />
                    <span className="text-[14px] font-medium">
                      {uploadingReceipt ? 'Uploading...' : isDragging ? 'Drop file here' : 'Upload receipt or drag and drop'}
                    </span>
                    <span className="text-[12px]">PDF or image, max 5MB</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/expenses')}
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
              'Create Expense'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

