'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { InvoiceItem } from '@/lib/types/invoice'
import { getCurrentDateISO, calculateDueDate } from '@/lib/utils/dateUtils'
import { calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { saveInvoiceWithClient } from '@/lib/services/invoiceService.client'
import { getBankAccountsWithClient, BankAccount } from '@/lib/services/bankAccountService.client'
import { getUserProfileWithClient, Profile, getVatSettingsWithClient, VatSettings } from '@/lib/services/settingsService.client'
import { markEntriesAsInvoicedWithClient, getTimeEntriesByIdsWithClient } from '@/lib/services/timeEntryService.client'
import { getProjectByIdWithClient } from '@/lib/services/projectService.client'
import { getContactByIdWithClient } from '@/lib/services/contactService.client'
import { useSearchParams } from 'next/navigation'
import { useLoadingBar } from '@/app/components/LoadingBarContext'
import { getExchangeRate, convertAmount } from '@/lib/services/exchangeRateService'
import { getCurrencyForCountry } from '@/lib/utils/countryCurrency'

// Components
import InvoiceHeader from '@/app/components/invoice/InvoiceHeader'
import AuthToSection, { AuthToInfo } from '@/app/components/invoice/AuthToSection'
import DescriptionSection from '@/app/components/invoice/DescriptionSection'
import PaymentInformationSection from '@/app/components/invoice/PaymentInformationSection'
import ProductsSection from '@/app/components/invoice/ProductsSection'
import SaveInvoiceModal from '@/app/components/invoice/SaveInvoiceModal'
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

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { start: startLoadingBar } = useLoadingBar()
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issuedOn, setIssuedOn] = useState(getCurrentDateISO())
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
  // Initialize items with default VAT rate (will be updated when VAT settings load)
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quantity: '',
      um: 'pcs',
      description: '',
      pricePerUm: '',
      vat: '8.1' // Default, will be updated when VAT settings load
    }
  ])
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
  
  // Update initial item VAT rate when VAT settings load (only if still using default)
  useEffect(() => {
    if (!vatSettings) return
    
    // Only update if we have exactly one item that's still in its initial empty state
    setItems(prevItems => {
      if (prevItems.length === 1 && 
          prevItems[0].vat === '8.1' && 
          prevItems[0].quantity === '' && 
          prevItems[0].description === '' &&
          prevItems[0].pricePerUm === '') {
        return [{
          ...prevItems[0],
          vat: defaultVatRate.toString()
        }]
      }
      return prevItems
    })
  }, [vatSettings, defaultVatRate])

  // UI state
  // Note: showSaveModal is not used for authenticated users - we save directly
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoadingNumber, setIsLoadingNumber] = useState(true)
  const [timeEntryIds, setTimeEntryIds] = useState<string[]>([])

  // Handle time entry parameters from URL
  // Wait for VAT settings to load before processing time entries
  useEffect(() => {
    async function loadProjectAndContact() {
      const fromTimeEntries = searchParams.get('fromTimeEntries')
      if (fromTimeEntries === 'true' && supabase && user) {
        const entryIds = searchParams.get('entryIds')?.split(',').filter(Boolean) || []
        const projectIdParam = searchParams.get('projectId')
        
        if (entryIds.length > 0) {
          setTimeEntryIds(entryIds)
          
          // Ensure VAT settings are loaded before processing time entries
          let vatRate = defaultVatRate
          if (!vatSettings) {
            try {
              const loadedVatSettings = await getVatSettingsWithClient(supabase, user.id)
              setVatSettings(loadedVatSettings)
              vatRate = loadedVatSettings.default_rate ?? 8.1
            } catch (error) {
              console.error('Error loading VAT settings for time entries:', error)
              // Use fallback
              vatRate = 8.1
            }
          }
          
          // Fetch the actual time entries and convert each to an invoice item
          try {
            const timeEntries = await getTimeEntriesByIdsWithClient(supabase, user.id, entryIds)
            
            if (timeEntries.length > 0) {
              // Convert each time entry to an invoice item
              const invoiceItems: InvoiceItem[] = timeEntries.map((entry) => {
                const hours = Math.round((entry.duration_minutes / 60) * 100) / 100 // Round to 2 decimals
                const hourlyRate = entry.hourly_rate || 0
                
                // Create description from time entry
                const date = new Date(entry.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })
                const description = entry.description 
                  ? `${entry.description} (${date})`
                  : `Time entry - ${date}`
                
                return {
                  id: `item_${entry.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  quantity: hours.toString(),
                  um: '1', // 1 hour = 1 unit
                  description: description,
                  pricePerUm: hourlyRate.toString(),
                  vat: vatRate.toString() // Use default VAT rate from settings
                }
              })
              
              setItems(invoiceItems)
            }
          } catch (error) {
            console.error('Error loading time entries:', error)
            // Fallback to empty items if fetching fails
            setItems([{
              id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              quantity: '',
              um: 'pcs',
              description: '',
              pricePerUm: '',
              vat: vatRate.toString()
            }])
          }
          
          // Load project and pre-select customer
          if (projectIdParam && supabase && user) {
            try {
              const project = await getProjectByIdWithClient(supabase, user.id, projectIdParam)
              if (project?.contact_id) {
                // Store projectId to set after customer is loaded
                // We'll set it in a separate useEffect after customer is selected
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('pendingProjectIdFromTimeEntries', project.id)
                }
                
                // Load the contact to get full details
                const contact = await getContactByIdWithClient(supabase, user.id, project.contact_id)
                if (contact) {
                  // Build zip from postal_code and city
                  const zipCity = [contact.postal_code, contact.city].filter(Boolean).join(' ')
                  
                  // Pre-select the customer FIRST (this will trigger project list loading)
                  setToInfo({
                    contact_id: contact.id,
                    uid: contact.vat_number,
                    name: contact.company_name || contact.name,
                    address: contact.address || '',
                    zip: zipCity
                  })
                }
              }
            } catch (error) {
              console.error('Error loading project/contact:', error)
            }
          }
        }
      }
    }
    
    loadProjectAndContact()
  }, [searchParams, supabase, user, vatSettings, defaultVatRate])

  // Set project ID after customer is selected (for time entries flow)
  useEffect(() => {
    if (!toInfo.contact_id || typeof window === 'undefined') return
    
    const pendingProjectId = sessionStorage.getItem('pendingProjectIdFromTimeEntries')
    if (!pendingProjectId) return
    
    // Only set if project is not already selected
    if (projectId === pendingProjectId) {
      sessionStorage.removeItem('pendingProjectIdFromTimeEntries')
      return
    }
    
    // Set project ID after a brief delay to ensure projects list has loaded
    const timer = setTimeout(() => {
      setProjectId(pendingProjectId)
      sessionStorage.removeItem('pendingProjectIdFromTimeEntries')
    }, 200)
    
    return () => clearTimeout(timer)
  }, [toInfo.contact_id, projectId])

  // Check for newly created project from time tracking
  useEffect(() => {
    async function loadStoredProject() {
      // Only check if we haven't already loaded a project from URL params
      const fromTimeEntries = searchParams.get('fromTimeEntries')
      if (fromTimeEntries === 'true') {
        // Skip if we already loaded project from URL params
        return
      }

      if (!supabase || !user || typeof window === 'undefined') return

      const storedProjectId = sessionStorage.getItem('lastCreatedProjectFromTimeTracking')
      if (!storedProjectId) return

      // Only pre-select if no project is already selected
      if (projectId) return

      try {
        const project = await getProjectByIdWithClient(supabase, user.id, storedProjectId)
        if (project?.contact_id) {
          // Store projectId to set after customer is loaded
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('pendingProjectIdFromTimeEntries', project.id)
          }

          // Load the contact to get full details
          const contact = await getContactByIdWithClient(supabase, user.id, project.contact_id)
          if (contact) {
            // Build zip from postal_code and city
            const zipCity = [contact.postal_code, contact.city].filter(Boolean).join(' ')

            // Pre-select the customer
            setToInfo({
              contact_id: contact.id,
              uid: contact.vat_number,
              name: contact.company_name || contact.name,
              address: contact.address || '',
              zip: zipCity
            })
          }

          // Clear the stored project ID after using it
          sessionStorage.removeItem('lastCreatedProjectFromTimeTracking')
        }
      } catch (error) {
        console.error('Error loading stored project:', error)
        // Clear invalid stored project ID
        sessionStorage.removeItem('lastCreatedProjectFromTimeTracking')
      }
    }

    loadStoredProject()
  }, [supabase, user, searchParams, projectId])

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
        
        // Set default country and currency from profile
        if (loadedProfile?.country) {
          setCountry(loadedProfile.country)
        }
        if (loadedProfile?.account_currency) {
          setCurrency(loadedProfile.account_currency)
        } else if (loadedProfile?.country) {
          // If no currency set but country is set, use country's default currency
          const { getCurrencyForCountry } = await import('@/lib/utils/countryCurrency')
          const defaultCurrency = getCurrencyForCountry(loadedProfile.country)
          if (defaultCurrency) {
            setCurrency(defaultCurrency)
          }
        }
        
        // Set default bank account if available
        if (loadedBankAccounts.length > 0) {
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
  }, [supabase, user])

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
        iban: selectedBankAccount?.iban || '',
        logo_url: profile?.logo_url,
        company_name: profile?.company_name
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
      const invoice = await saveInvoiceToDatabase()
      
      // Cache the invoice in React Query for instant loading on detail page
      queryClient.setQueryData(['invoice', invoice.id], invoice)
      // Invalidate invoices list to refetch with the new invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] })
      
      setSaveSuccess(true)
      
      // Navigate to invoice detail page after successful save
      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Save invoice to database
  const saveInvoiceToDatabase = async () => {
    if (!supabase || !user) {
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
    const invoice = await saveInvoiceWithClient(supabase, user.id, {
      contact_id: data.contact_id,
      project_id: projectId || undefined,
      bank_account_id: selectedBankAccount.id,
      invoice_number: data.invoice_number,
      status: 'issued',
      currency: data.currency,
      issued_on: data.issued_on,
      due_date: data.due_date,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      vat_rate: avgVatRate,
      total: totals.total,
      exchange_rate: exchangeRate,
      amount_in_account_currency: amountInAccountCurrency,
      from_info: data.from_info,
      to_info: data.to_info,
      items: data.items,
      notes: data.description,
      payment_terms: paymentTerms
    })

    // Mark time entries as invoiced if this invoice was created from time entries
    if (timeEntryIds.length > 0) {
      try {
        await markEntriesAsInvoicedWithClient(supabase, user.id, timeEntryIds, invoice.id)
        // Invalidate time entries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      } catch (error) {
        console.error('Error marking time entries as invoiced:', error)
        // Don't fail the invoice save if this fails
      }
    }

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
      const invoice = await saveInvoiceToDatabase()
      
      // Generate PDF
      const { generateInvoicePDF } = await import('@/lib/services/pdfService')
      const data = buildInvoiceData()
      const totals = calculateGrandTotal(items, discount)
      
      const fullInvoice = {
        id: invoice.id,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await generateInvoicePDF(fullInvoice, { includeQRCode: enableQR })
      
      // Cache the invoice in React Query for instant loading on detail page
      queryClient.setQueryData(['invoice', invoice.id], invoice)
      // Invalidate invoices list to refetch with the new invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] })
      
      setSaveSuccess(true)
      setShowSaveModal(false)
      
      // Navigate immediately - data is already cached
      router.push(`/dashboard/invoices/${invoice.id}`)
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
    
    // Start loading bar before save operation
    startLoadingBar()
    
    try {
      const invoice = await saveInvoiceToDatabase()
      
      // Cache the invoice in React Query for instant loading on detail page
      queryClient.setQueryData(['invoice', invoice.id], invoice)
      // Invalidate invoices list to refetch with the new invoice
      queryClient.invalidateQueries({ queryKey: ['invoices', user?.id] })
      
      setSaveSuccess(true)
      setShowSaveModal(false)
      
      // Navigate immediately - data is already cached
      router.push(`/dashboard/invoices/${invoice.id}`)
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
  if (!session || !user || !supabase || isLoadingProfile) {
    return (
      <div className="max-w-[920px] mx-auto">
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return (
    <div className="max-w-[920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
            New Invoice
          </h1>
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
              country={country}
              currency={currency}
              onChange={handleHeaderChange}
              errors={validationErrors}
              onClearError={clearError}
            />
          )}
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
            disabled={isSaving}
            className="px-6 py-3 bg-design-button-primary text-design-on-button-content rounded-full text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
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

      {/* Modals - Only show for unauthenticated users (shouldn't happen in dashboard) */}
      {/* Modal is disabled for authenticated users - we save directly */}
      {!session && showSaveModal && (
        <SaveInvoiceModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onDownload={handleDownload}
          onSaveOnly={handleSaveOnly}
          isLoading={isGeneratingPDF}
          isSaving={isSaving}
        />
      )}

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

