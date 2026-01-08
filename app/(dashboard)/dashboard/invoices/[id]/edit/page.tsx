'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { InvoiceItem } from '@/lib/types/invoice'
import { calculateDueDate } from '@/lib/utils/dateUtils'
import { calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { getBankAccountsWithClient, BankAccount } from '@/lib/services/bankAccountService.client'
import { getUserProfileWithClient, Profile, getVatSettingsWithClient, VatSettings } from '@/lib/services/settingsService.client'
import { useInvoice } from '@/lib/hooks/queries'
import { useLoadingBar } from '@/app/components/LoadingBarContext'
import { getExchangeRate, convertAmount } from '@/lib/services/exchangeRateService'
import { getCurrencyForCountry } from '@/lib/utils/countryCurrency'

// Components
import InvoiceHeader from '@/app/components/invoice/InvoiceHeader'
import AuthToSection, { AuthToInfo } from '@/app/components/invoice/AuthToSection'
import DescriptionSection from '@/app/components/invoice/DescriptionSection'
import PaymentInformationSection from '@/app/components/invoice/PaymentInformationSection'
import ProductsSection from '@/app/components/invoice/ProductsSection'
import PreviewModal from '@/app/components/invoice/PreviewModal'
import { Loader2 } from 'lucide-react'

// Validation types
interface ValidationErrors {
  invoice_number?: string
  issued_on?: string
  due_date?: string
  toName?: string
  toAddress?: string
  toZip?: string
  contact_id?: string
  bank_account_id?: string
  items?: string
  [key: string]: string | undefined
}

// Priority order for error fields (top to bottom in form)
const ERROR_FIELD_PRIORITY = [
  'invoice_number',
  'issued_on',
  'due_date',
  'contact_id',
  'bank_account_id',
  'toName',
  'toAddress',
  'toZip',
  'items'
]

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { start: startLoadingBar } = useLoadingBar()
  
  // Load invoice data
  const { data: invoice, isLoading: isLoadingInvoice } = useInvoice(invoiceId)
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  // Invoice state - will be initialized from invoice data
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issuedOn, setIssuedOn] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [country, setCountry] = useState('Switzerland')
  const [currency, setCurrency] = useState('CHF')
  
  const [toInfo, setToInfo] = useState<AuthToInfo>({
    contact_id: '',
    uid: '',
    name: '',
    address: '',
    zip: ''
  })
  const [projectId, setProjectId] = useState<string | null>(null)
  
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [discount, setDiscount] = useState<number | string>(0)
  const [enableQR, setEnableQR] = useState(true)

  // Profile/Bank account state
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vatSettings, setVatSettings] = useState<VatSettings | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // Get default VAT rate from settings (fallback to 8.1)
  const defaultVatRate = vatSettings?.default_rate ?? 8.1

  // UI state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Initialize form data from invoice
  useEffect(() => {
    if (!invoice) return

    // Header fields
    setInvoiceNumber(invoice.invoice_number || '')
    setIssuedOn(invoice.issued_on || '')
    setDueDate(invoice.due_date || '')
    setCurrency(invoice.currency || 'CHF')

    // To info
    const toInfoData = invoice.to_info || {}
    setToInfo({
      contact_id: invoice.contact_id || '',
      uid: toInfoData.uid || '',
      name: toInfoData.name || '',
      address: toInfoData.address || '',
      zip: toInfoData.zip || '',
      city: toInfoData.city
    })

    // Project
    setProjectId(invoice.project_id || null)

    // Description
    setDescription(invoice.notes || '')

    // Items - transform from invoice format to InvoiceItem format
    if (invoice.items && Array.isArray(invoice.items)) {
      const transformedItems: InvoiceItem[] = invoice.items.map((item: any, index: number) => ({
        id: item.id || `item_${Date.now()}_${index}`,
        quantity: item.quantity ?? item.qty ?? '',
        um: item.um ?? item.unit ?? 'pcs',
        description: item.description || item.name || '',
        pricePerUm: item.pricePerUm ?? item.price ?? item.price_per_um ?? '',
        vat: item.vat ?? item.vat_rate ?? '0'
      }))
      setItems(transformedItems.length > 0 ? transformedItems : [{
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quantity: '',
        um: 'pcs',
        description: '',
        pricePerUm: '',
        vat: '0'
      }])
    } else {
      setItems([{
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quantity: '',
        um: 'pcs',
        description: '',
        pricePerUm: '',
        vat: '0'
      }])
    }

    // Discount (if stored separately, otherwise 0)
    setDiscount(0)

    // Bank account
    setSelectedBankAccountId(invoice.bank_account_id || '')
  }, [invoice])

  // Load profile and bank accounts on mount
  useEffect(() => {
    async function loadProfileData() {
      if (!supabase || !user) {
        setIsLoadingProfile(false)
        return
      }

      try {
        // Fetch profile, bank accounts, and VAT settings in parallel
        const [loadedProfile, loadedBankAccounts, loadedVatSettings] = await Promise.all([
          getUserProfileWithClient(supabase, user.id).catch(() => null),
          getBankAccountsWithClient(supabase, user.id).catch(() => []),
          getVatSettingsWithClient(supabase, user.id).catch(() => null)
        ])

        setProfile(loadedProfile)
        setBankAccounts(loadedBankAccounts)
        setVatSettings(loadedVatSettings)
        
        // Set default country from profile if not already set from invoice
        // Note: We check if country is still the default value to avoid overwriting invoice data
        if (loadedProfile?.country && country === 'Switzerland') {
          setCountry(loadedProfile.country)
        }
        
        // Set bank account if not already set from invoice
        if (!selectedBankAccountId && loadedBankAccounts.length > 0) {
          const defaultAccount = loadedBankAccounts.find(a => a.is_default) || loadedBankAccounts[0]
          if (defaultAccount) {
            setSelectedBankAccountId(defaultAccount.id)
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfileData()
  }, [supabase, user, selectedBankAccountId])

  const handleHeaderChange = (field: string, value: string) => {
    switch (field) {
      case 'invoice_number':
        setInvoiceNumber(value)
        break
      case 'issued_on':
        setIssuedOn(value)
        if (dueDate && issuedOn) {
          const days = Math.ceil((new Date(dueDate).getTime() - new Date(issuedOn).getTime()) / (1000 * 60 * 60 * 24))
          if (days > 0) {
            setDueDate(calculateDueDate(value, `${days} days`))
          } else {
            setDueDate(calculateDueDate(value, '14 days'))
          }
        } else {
          setDueDate(calculateDueDate(value, '14 days'))
        }
        break
      case 'due_date':
        setDueDate(value)
        break
      case 'country':
        setCountry(value)
        // Auto-update currency based on country
        const defaultCurrency = getCurrencyForCountry(value)
        if (defaultCurrency) {
          setCurrency(defaultCurrency)
        }
        break
      case 'currency':
        setCurrency(value)
        break
    }
  }

  // Get selected bank account for building invoice data
  const selectedBankAccount = useMemo(() => {
    return bankAccounts.find(a => a.id === selectedBankAccountId)
  }, [bankAccounts, selectedBankAccountId])

  // Build invoice data for validation/saving
  const buildInvoiceData = () => {
    const totals = calculateGrandTotal(items, discount)
    
    // Build zip from city and postal_code
    const zipCity = [profile?.postal_code, profile?.city].filter(Boolean).join(' ')
    
    return {
      invoice_number: invoiceNumber,
      issued_on: issuedOn,
      due_date: dueDate,
      currency,
      contact_id: toInfo.contact_id,
      from_info: {
        name: profile?.name || '',
        street: profile?.address || '',
        zip: zipCity || '',
        city: profile?.city,
        iban: selectedBankAccount?.iban || '',
        logo_url: profile?.logo_url,
        company_name: profile?.company_name,
        uid: profile?.vat_number
      },
      to_info: {
        uid: toInfo.uid,
        name: toInfo.name,
        address: toInfo.address,
        zip: toInfo.zip,
        city: toInfo.city
      },
      description,
      items,
      discount: parseFloat(String(discount)) || 0,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total
    }
  }

  // Validate invoice data
  const validateInvoice = (): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {}
    const data = buildInvoiceData()

    // Header validation
    if (!data.invoice_number?.trim()) {
      errors.invoice_number = 'Invoice number is required'
    }
    if (!data.issued_on) {
      errors.issued_on = 'Issued date is required'
    }
    if (!data.due_date) {
      errors.due_date = 'Due date is required'
    }

    // To section validation - require contact selection
    if (!data.contact_id) {
      errors.contact_id = 'Please select a customer'
    }

    // Payment information validation - require bank account selection
    if (!selectedBankAccountId) {
      errors.bank_account_id = 'Please select a bank account'
    }

    // Items validation
    if (!data.items || data.items.length === 0) {
      errors.items = 'At least one item is required'
    } else {
      const hasValidItem = data.items.some(item => {
        const qty = parseFloat(String(item.quantity)) || 0
        const price = parseFloat(String(item.pricePerUm)) || 0
        const desc = String(item.description || '').trim()
        return qty > 0 && price > 0 && desc.length > 0
      })
      if (!hasValidItem) {
        errors.items = 'At least one valid item is required'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

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

  // Handle bank account change
  const handleBankAccountChange = (bankAccountId: string) => {
    setSelectedBankAccountId(bankAccountId)
    clearError('bank_account_id')
  }

  // Handle bank account added
  const handleBankAccountAdded = (newAccount: BankAccount) => {
    setBankAccounts(prev => [newAccount, ...prev])
    setSelectedBankAccountId(newAccount.id)
    clearError('bank_account_id')
  }

  const handlePreview = () => {
    const validation = validateInvoice()
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      scrollToFirstError(validation.errors)
      return
    }
    
    setValidationErrors({})
    setShowPreviewModal(true)
  }

  const handleSave = async () => {
    const validation = validateInvoice()
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      scrollToFirstError(validation.errors)
      return
    }
    
    setValidationErrors({})
    setIsSaving(true)
    
    // Start loading bar before save operation
    startLoadingBar()
    
    try {
      const updatedInvoice = await updateInvoiceInDatabase()
      
      // Cache the invoice in React Query for instant loading on detail page
      queryClient.setQueryData(['invoice', invoiceId], updatedInvoice)
      // Invalidate invoices list to refetch with the updated invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] })
      
      // Navigate to invoice detail page after successful save
      router.push(`/dashboard/invoices/${invoiceId}`)
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Update invoice in database
  const updateInvoiceInDatabase = async () => {
    if (!supabase || !user || !invoiceId) {
      throw new Error('Authentication required. Please sign in again.')
    }

    if (!selectedBankAccountId) {
      throw new Error('Please select a bank account')
    }

    const selectedBankAccount = bankAccounts.find(a => a.id === selectedBankAccountId)
    if (!selectedBankAccount) {
      throw new Error('Selected bank account not found')
    }

    const data = buildInvoiceData()
    const totals = calculateGrandTotal(items, discount)

    // Calculate payment terms from dates
    const daysDiff = Math.ceil((new Date(dueDate).getTime() - new Date(issuedOn).getTime()) / (1000 * 60 * 60 * 24))
    const paymentTerms = daysDiff <= 0 ? 'On receipt' : `${daysDiff} days`

    // Calculate average VAT rate from items
    const totalNetWithVat = items.reduce((sum, item) => {
      const net = (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.pricePerUm)) || 0)
      const vat = net * ((parseFloat(String(item.vat)) || 0) / 100)
      return sum + vat
    }, 0)
    const avgVatRate = totals.subtotal > 0 ? (totalNetWithVat / totals.subtotal) * 100 : 0

    // Handle currency conversion if invoice currency differs from account currency
    const accountCurrency = profile?.account_currency || 'CHF'
    let exchangeRate: number | undefined
    let amountInAccountCurrency: number | undefined

    if (data.currency && data.currency !== accountCurrency) {
      try {
        exchangeRate = await getExchangeRate(supabase, data.currency, accountCurrency, issuedOn)
        amountInAccountCurrency = convertAmount(totals.total, data.currency, accountCurrency, exchangeRate)
      } catch (error) {
        console.error('Error fetching exchange rate:', error)
        // Continue without conversion - invoice will be saved with original currency
      }
    }

    // PATCH request to update invoice
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_number: data.invoice_number,
        issued_on: data.issued_on,
        due_date: data.due_date,
        currency: data.currency,
        contact_id: data.contact_id,
        project_id: projectId || undefined,
        bank_account_id: selectedBankAccount.id,
        from_info: data.from_info,
        to_info: data.to_info,
        items: data.items,
        notes: data.description,
        subtotal: totals.subtotal,
        vat_amount: totals.vatAmount,
        vat_rate: avgVatRate,
        total: totals.total,
        exchange_rate: exchangeRate,
        amount_in_account_currency: amountInAccountCurrency,
        payment_terms: paymentTerms
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.details || 'Failed to update invoice')
    }

    return await response.json()
  }

  // Handle preview download
  const handlePreviewDownload = async () => {
    setIsGeneratingPDF(true)
    try {
      await handleSave()
      setShowPreviewModal(false)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Loading state
  if (!session || !user || !supabase || isLoadingInvoice || isLoadingProfile) {
    return (
      <div className="max-w-[920px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
        </div>
      </div>
    )
  }

  // Not found state - redirect to invoices list if invoice doesn't exist
  if (!invoice) {
    router.push('/dashboard/invoices')
    return null
  }

  // Build preview invoice for modal
  const buildPreviewInvoice = () => {
    const data = buildInvoiceData()
    const totals = calculateGrandTotal(items, discount)
    
    return {
      id: invoiceId,
      invoice_number: data.invoice_number,
      issued_on: data.issued_on,
      due_date: data.due_date,
      currency: data.currency,
      payment_method: 'Bank' as const,
      from_info: {
        name: data.from_info.name,
        street: data.from_info.street,
        zip: data.from_info.zip,
        city: data.from_info.city,
        iban: data.from_info.iban,
        uid: data.from_info.uid
      },
      to_info: {
        name: data.to_info.name,
        address: data.to_info.address,
        zip: data.to_info.zip,
        city: data.to_info.city,
        uid: data.to_info.uid
      },
      description: data.description,
      items: data.items,
      discount: data.discount,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total,
      created_at: invoice.created_at,
      updated_at: new Date().toISOString()
    }
  }

  return (
    <div className="max-w-[920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-semibold text-design-content-default tracking-tight">
            Edit Invoice
          </h1>
        </div>
      </div>

      {/* Invoice Form */}
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Invoice Header Card */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          <InvoiceHeader
            invoiceNumber={invoiceNumber}
            issuedOn={issuedOn}
            dueDate={dueDate}
            country={country}
            currency={currency}
            onChange={handleHeaderChange}
            errors={validationErrors}
            onClearError={clearError}
          />
        </div>

        {/* To Section */}
        <AuthToSection
          toInfo={toInfo}
          onChange={setToInfo}
          supabase={supabase}
          userId={user.id}
          projectId={projectId || undefined}
          onProjectChange={setProjectId}
          errors={validationErrors}
          onClearError={clearError}
        />

        {/* Description Section */}
        <DescriptionSection
          description={description}
          onChange={setDescription}
        />

        {/* Payment Information Section */}
        <PaymentInformationSection
          selectedBankAccountId={selectedBankAccountId}
          onChange={handleBankAccountChange}
          bankAccounts={bankAccounts}
          currency={currency}
          onCurrencyChange={(value) => handleHeaderChange('currency', value)}
          isLoading={isLoadingProfile}
          supabase={supabase}
          userId={user.id}
          errors={validationErrors}
          onClearError={clearError}
          onAccountAdded={handleBankAccountAdded}
          enableQR={enableQR}
          onEnableQRChange={setEnableQR}
        />

        {/* Products Section */}
        <ProductsSection
          items={items}
          discount={discount}
          currency={currency}
          onChangeItems={setItems}
          onChangeDiscount={setDiscount}
          errors={validationErrors}
          onClearError={clearError}
          defaultVatRate={defaultVatRate}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <button
            onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
            className="px-6 py-3 text-[16px] text-design-content-weak hover:text-design-content-default transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handlePreview}
            className="px-6 py-3 border border-design-content-weakest rounded-full text-[16px] text-design-content-default hover:bg-design-surface-field transition-colors w-full sm:w-auto"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-design-button-primary text-design-on-button-content rounded-full text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {showPreviewModal && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          invoice={buildPreviewInvoice()}
          onDownload={handlePreviewDownload}
        />
      )}
    </div>
  )
}

