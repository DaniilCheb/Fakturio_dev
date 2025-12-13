'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { InvoiceItem } from '@/lib/types/invoice'
import { getCurrentDateISO, calculateDueDate } from '@/lib/utils/dateUtils'
import { calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { saveInvoiceWithClient } from '@/lib/services/invoiceService.client'
import { getDefaultBankAccountWithClient, BankAccount } from '@/lib/services/bankAccountService.client'
import { Profile } from '@/lib/services/settingsService.client'

// Components
import InvoiceHeader from '@/app/components/invoice/InvoiceHeader'
import AuthFromSection, { AuthFromInfo } from '@/app/components/invoice/AuthFromSection'
import AuthToSection, { AuthToInfo } from '@/app/components/invoice/AuthToSection'
import DescriptionSection from '@/app/components/invoice/DescriptionSection'
import ProductsSection from '@/app/components/invoice/ProductsSection'
import SaveInvoiceModal from '@/app/components/invoice/SaveInvoiceModal'
import PreviewModal from '@/app/components/invoice/PreviewModal'
import { Loader2 } from 'lucide-react'

// Validation types
interface ValidationErrors {
  invoice_number?: string
  issued_on?: string
  due_date?: string
  fromName?: string
  fromStreet?: string
  fromZip?: string
  fromIban?: string
  toName?: string
  toAddress?: string
  toZip?: string
  contact_id?: string
  items?: string
  [key: string]: string | undefined
}

// Priority order for error fields (top to bottom in form)
const ERROR_FIELD_PRIORITY = [
  'invoice_number',
  'issued_on',
  'due_date',
  'fromName',
  'fromStreet',
  'fromZip',
  'fromIban',
  'contact_id',
  'toName',
  'toAddress',
  'toZip',
  'items'
]

export default function NewInvoicePage() {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issuedOn, setIssuedOn] = useState(getCurrentDateISO())
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('CHF')
  
  const [fromInfo, setFromInfo] = useState<AuthFromInfo>({
    name: '',
    street: '',
    zip: '',
    iban: ''
  })
  
  const [toInfo, setToInfo] = useState<AuthToInfo>({
    contact_id: '',
    uid: '',
    name: '',
    address: '',
    zip: ''
  })
  
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quantity: '',
      um: 'pcs',
      description: '',
      pricePerUm: '',
      vat: '0'
    }
  ])
  const [discount, setDiscount] = useState<number | string>(0)

  // Profile/Bank account state
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // UI state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoadingNumber, setIsLoadingNumber] = useState(true)

  // Initialize invoice number from server
  useEffect(() => {
    async function loadInvoiceNumber() {
      if (!supabase || !user) return

      try {
        // Use a simple count-based approach
        const currentYear = new Date().getFullYear()
        const { count, error } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .like('invoice_number', `${currentYear}-%`)

        if (error) throw error

        const nextSequence = (count || 0) + 1
        const paddedSequence = nextSequence.toString().padStart(2, '0')
        setInvoiceNumber(`${currentYear}-${paddedSequence}`)
      } catch (error) {
        console.error('Error generating invoice number:', error)
        // Fallback to timestamp-based
        setInvoiceNumber(`${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`)
      } finally {
        setIsLoadingNumber(false)
      }
    }

    loadInvoiceNumber()
  }, [supabase, user])

  // Initialize due date
  useEffect(() => {
    if (!dueDate && issuedOn) {
      const calculated = calculateDueDate(issuedOn, '14 days')
      setDueDate(calculated)
    }
  }, [issuedOn, dueDate])

  // Handle profile loaded callback
  const handleProfileLoaded = (loadedProfile: Profile | null, loadedBankAccount: BankAccount | null) => {
    setProfile(loadedProfile)
    setBankAccount(loadedBankAccount)
  }

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
      case 'currency':
        setCurrency(value)
        break
    }
  }

  // Build invoice data for validation/saving
  const buildInvoiceData = () => {
    const totals = calculateGrandTotal(items, discount)
    
    return {
      invoice_number: invoiceNumber,
      issued_on: issuedOn,
      due_date: dueDate,
      currency,
      contact_id: toInfo.contact_id,
      from_info: {
        name: fromInfo.name,
        street: fromInfo.street,
        zip: fromInfo.zip,
        iban: fromInfo.iban,
        logo_url: fromInfo.logo_url,
        company_name: fromInfo.company_name
      },
      to_info: {
        uid: toInfo.uid,
        name: toInfo.name,
        address: toInfo.address,
        zip: toInfo.zip
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

    // From section validation
    if (!data.from_info.name?.trim()) {
      errors.fromName = 'Your name is required'
    }
    if (!data.from_info.street?.trim()) {
      errors.fromStreet = 'Street is required'
    }
    if (!data.from_info.zip?.trim()) {
      errors.fromZip = 'ZIP / City is required'
    }
    if (!data.from_info.iban?.trim()) {
      errors.fromIban = 'IBAN is required'
    }

    // To section validation - require contact selection
    if (!data.contact_id) {
      errors.contact_id = 'Please select a customer'
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

  const handleSave = () => {
    const validation = validateInvoice()
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      scrollToFirstError(validation.errors)
      return
    }
    
    setValidationErrors({})
    setShowSaveModal(true)
  }

  // Save invoice to database
  const saveInvoiceToDatabase = async () => {
    if (!supabase || !user || !bankAccount) {
      throw new Error('Missing required data for saving')
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

    const invoice = await saveInvoiceWithClient(supabase, user.id, {
      contact_id: data.contact_id,
      bank_account_id: bankAccount.id,
      invoice_number: data.invoice_number,
      status: 'issued',
      currency: data.currency,
      issued_on: data.issued_on,
      due_date: data.due_date,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      vat_rate: avgVatRate,
      total: totals.total,
      from_info: data.from_info,
      to_info: data.to_info,
      items: data.items,
      notes: data.description,
      payment_terms: paymentTerms
    })

    return invoice
  }

  // Handle download with PDF
  const handleDownload = async () => {
    const validation = validateInvoice()
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setShowSaveModal(false)
      scrollToFirstError(validation.errors)
      return
    }

    setIsGeneratingPDF(true)
    
    try {
      // Save to database first
      await saveInvoiceToDatabase()
      
      // Generate PDF
      const { generateInvoicePDF } = await import('@/lib/services/pdfService')
      const data = buildInvoiceData()
      const totals = calculateGrandTotal(items, discount)
      
      const fullInvoice = {
        id: `inv_${Date.now()}`,
        invoice_number: data.invoice_number,
        issued_on: data.issued_on,
        due_date: data.due_date,
        currency: data.currency,
        payment_method: 'Bank' as const,
        from_info: {
          name: data.from_info.name,
          street: data.from_info.street,
          zip: data.from_info.zip,
          iban: data.from_info.iban
        },
        to_info: {
          name: data.to_info.name,
          address: data.to_info.address,
          zip: data.to_info.zip,
          uid: data.to_info.uid
        },
        description: data.description,
        items: data.items,
        discount: data.discount,
        subtotal: totals.subtotal,
        vat_amount: totals.vatAmount,
        total: totals.total,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await generateInvoicePDF(fullInvoice, { includeQRCode: true })
      
      setSaveSuccess(true)
      setShowSaveModal(false)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error saving/generating PDF:', error)
      alert(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Handle save only (no PDF)
  const handleSaveOnly = async () => {
    const validation = validateInvoice()
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setIsSaving(true)
    
    try {
      await saveInvoiceToDatabase()
      
      setSaveSuccess(true)
      setShowSaveModal(false)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle preview download
  const handlePreviewDownload = async () => {
    setIsGeneratingPDF(true)
    try {
      await handleDownload()
      setShowPreviewModal(false)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Loading state
  if (!session || !user || !supabase) {
    return (
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
        </div>
      </div>
    )
  }

  // Build preview invoice for modal
  const buildPreviewInvoice = () => {
    const data = buildInvoiceData()
    const totals = calculateGrandTotal(items, discount)
    
    return {
      id: `preview_${Date.now()}`,
      invoice_number: data.invoice_number,
      issued_on: data.issued_on,
      due_date: data.due_date,
      currency: data.currency,
      payment_method: 'Bank' as const,
      from_info: {
        name: data.from_info.name,
        street: data.from_info.street,
        zip: data.from_info.zip,
        iban: data.from_info.iban
      },
      to_info: {
        name: data.to_info.name,
        address: data.to_info.address,
        zip: data.to_info.zip,
        uid: data.to_info.uid
      },
      description: data.description,
      items: data.items,
      discount: data.discount,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
            New Invoice
          </h1>
          <p className="text-[14px] text-design-content-weak mt-1">
            Create a new invoice for your customer
          </p>
        </div>
      </div>

      {/* Invoice Form */}
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Invoice Header Card */}
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
          {isLoadingNumber ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-design-content-weak" />
              <span className="text-[14px] text-design-content-weak">Generating invoice number...</span>
            </div>
          ) : (
            <InvoiceHeader
              invoiceNumber={invoiceNumber}
              issuedOn={issuedOn}
              dueDate={dueDate}
              onChange={handleHeaderChange}
              errors={validationErrors}
              onClearError={clearError}
            />
          )}
        </div>

        {/* From Section */}
        <AuthFromSection
          fromInfo={fromInfo}
          onChange={setFromInfo}
          errors={validationErrors}
          onClearError={clearError}
          onProfileLoaded={handleProfileLoaded}
        />

        {/* To Section */}
        <AuthToSection
          toInfo={toInfo}
          onChange={setToInfo}
          supabase={supabase}
          userId={user.id}
          errors={validationErrors}
          onClearError={clearError}
        />

        {/* Description Section */}
        <DescriptionSection
          description={description}
          onChange={setDescription}
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
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <button
            onClick={() => router.push('/dashboard')}
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
            className="px-6 py-3 bg-design-button-primary text-design-on-button-content rounded-full text-[16px] hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            Save
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#141414] dark:bg-white text-white dark:text-[#141414] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#22C55E" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[14px] font-medium">Invoice saved successfully!</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <SaveInvoiceModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onDownload={handleDownload}
        onSaveOnly={handleSaveOnly}
        isLoading={isGeneratingPDF}
        isSaving={isSaving}
      />

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

