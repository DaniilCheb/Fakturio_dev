'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { saveContactWithClient, type CreateContactInput } from '@/lib/services/contactService.client'
import { formatUid, type CompanyInfo } from '@/lib/services/zefixService'
import { Loader2 } from 'lucide-react'
import { CloseIcon } from '@/app/components/Icons'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import Input from '@/app/components/Input'

interface SearchResult {
  name: string
  uid: string
  legalSeat: string
  legalForm: string
  status: string
}

// Validation types
interface ValidationErrors {
  name?: string
  address?: string
  postal_code?: string
  [key: string]: string | undefined
}

// Priority order for error fields (top to bottom in form)
const ERROR_FIELD_PRIORITY = [
  'name',
  'address',
  'postal_code'
]

export default function NewCustomerPage() {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  // Zefix search state
  const [isLoading, setIsLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Form fields
  const [formData, setFormData] = useState<CreateContactInput>({
    type: 'customer',
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Switzerland',
    vat_number: '',
    notes: '',
  })

  // UI state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

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
          const input = element.querySelector('input, textarea')
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

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setIsCompanySelected(false)
    if (lookupError) setLookupError(null)
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // If less than 3 characters, hide results
    if (value.trim().length < 3) {
      setShowResults(false)
      setSearchResults([])
      return
    }
    
    // Debounce the search
    debounceRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, 300)
  }

  const performSearch = async (query: string) => {
    setIsLoading(true)
    setLookupError(null)

    try {
      const response = await fetch('/api/zefix/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query }),
      })
      const data = await response.json()

      if (!response.ok) {
        setLookupError(data.error || 'Failed to search companies')
        return
      }

      const results = data as SearchResult[]
      
      if (results.length === 0) {
        setLookupError('No companies found. You can enter details manually below.')
        return
      }

      setSearchResults(results)
      setShowResults(true)
    } catch (error) {
      console.error('Lookup error:', error)
      setLookupError('Failed to connect to lookup service')
    } finally {
      setIsLoading(false)
    }
  }

  const lookupByUid = async (uid: string): Promise<CompanyInfo | null> => {
    const response = await fetch(`/api/zefix/${encodeURIComponent(uid)}`)
    const data = await response.json()

    if (!response.ok) {
      setLookupError(data.error || 'Failed to lookup company')
      return null
    }

    return data as CompanyInfo
  }

  const handleSelectResult = async (result: SearchResult) => {
    setShowResults(false)
    setSearchResults([])
    setIsLoading(true)
    
    try {
      const company = await lookupByUid(result.uid)
      if (company) {
        setFormData({
          ...formData,
          name: company.name,
          company_name: company.name,
          address: company.address,
          city: company.city,
          postal_code: company.zip,
          vat_number: company.uid,
        })
        setSearchQuery(company.name)
        setIsCompanySelected(true)
        setValidationErrors({})
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setLookupError(null)
    setShowResults(false)
    setSearchResults([])
    setIsCompanySelected(false)
  }

  const handleFieldChange = (field: keyof CreateContactInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (validationErrors[field as string]) {
      clearError(field as keyof ValidationErrors)
    }
  }

  // Validate form
  const validateForm = (): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {}

    if (!formData.name?.trim()) {
      errors.name = 'Name is required'
    }
    if (!formData.address?.trim()) {
      errors.address = 'Address is required'
    }
    if (!formData.postal_code?.trim() && !formData.city?.trim()) {
      errors.postal_code = 'ZIP or City is required'
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
      alert('Please sign in to create a customer')
      return
    }

    setIsSaving(true)
    
    try {
      await saveContactWithClient(supabase, user.id, {
        type: 'customer',
        name: formData.name!.trim(),
        company_name: formData.company_name?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address!.trim(),
        city: formData.city?.trim() || undefined,
        postal_code: formData.postal_code?.trim() || undefined,
        country: formData.country || 'Switzerland',
        vat_number: formData.vat_number?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      })
      
      // Invalidate contacts query to refetch the list
      await queryClient.invalidateQueries({ queryKey: ['contacts', user.id] })
      
      // Redirect to customers list
      router.push('/dashboard/customers')
    } catch (error) {
      console.error('Error saving customer:', error)
      alert(`Failed to save customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (!session || !user || !supabase) {
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
            New Customer
          </h1>
        </div>
      </div>

      {/* Customer Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
        {/* Company Search Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Search company
              </label>
              <div className="relative">
                <Input
                  noLabel
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  onBlur={() => setLookupError(null)}
                  placeholder="Enter company name to search..."
                  className={searchQuery || isLoading ? "pr-12" : ""}
                />
                {isLoading ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#666] dark:text-[#999]" />
                  </div>
                ) : searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#666] dark:text-[#999] rounded-full border border-transparent transition-all hover:bg-[#e0e0e0] hover:text-[#333] hover:shadow-sm hover:border-[#e0e0e0]"
                  >
                    <CloseIcon size={16} />
                  </button>
                )}
              </div>
              {lookupError && (
                <span className="text-[12px] mt-[1px] m-0 block text-design-content-weak">
                  {lookupError}
                </span>
              )}

              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="relative mt-1">
                  <div className="absolute z-50 w-full bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#444] rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#e0e0e0] dark:border-[#444]">
                      <span className="text-xs text-[#666] dark:text-[#999]">
                        {searchResults.length} companies found
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowResults(false)}
                        className="text-[#666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white"
                      >
                        <CloseIcon size={16} />
                      </button>
                    </div>
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.uid}-${index}`}
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        className="w-full px-3 py-4 text-left hover:bg-[#f5f5f5] dark:hover:bg-[#333] border-b border-[#e0e0e0] dark:border-[#444] last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-sm text-[#141414] dark:text-white">
                          {result.name}
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#999] mt-0.5">
                          {formatUid(result.uid)} • {result.legalSeat} • {result.legalForm}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Customer Details Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-6">
            {/* Name */}
            <Input
              label="Name / Company *"
              value={formData.name || ''}
              onChange={handleFieldChange('name')}
              placeholder="Company AG or John Doe"
              error={validationErrors.name}
              onErrorClear={() => clearError('name')}
              fieldName="name"
              required
            />

            {/* Company Name (optional, separate field) */}
            <Input
              label="Company Name (optional)"
              value={formData.company_name || ''}
              onChange={handleFieldChange('company_name')}
              placeholder="Acme GmbH"
            />

            {/* Address */}
            <Input
              label="Street Address *"
              value={formData.address || ''}
              onChange={handleFieldChange('address')}
              placeholder="Bahnhofstrasse 1"
              error={validationErrors.address}
              onErrorClear={() => clearError('address')}
              fieldName="address"
              required
            />

            {/* ZIP and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Postal Code"
                value={formData.postal_code || ''}
                onChange={handleFieldChange('postal_code')}
                placeholder="8001"
                error={validationErrors.postal_code}
                onErrorClear={() => clearError('postal_code')}
                fieldName="postal_code"
              />
              <Input
                label="City"
                value={formData.city || ''}
                onChange={handleFieldChange('city')}
                placeholder="Zürich"
              />
            </div>

            {/* Country */}
            <Input
              label="Country"
              value={formData.country || 'Switzerland'}
              onChange={handleFieldChange('country')}
              placeholder="Switzerland"
            />

            {/* VAT Number / UID */}
            <Input
              label="VAT Number / UID"
              value={formData.vat_number || ''}
              onChange={handleFieldChange('vat_number')}
              placeholder="CHE-123.456.789"
            />

            {/* Email */}
            <Input
              label="Email (optional)"
              type="email"
              value={formData.email || ''}
              onChange={handleFieldChange('email')}
              placeholder="contact@company.com"
            />

            {/* Phone */}
            <Input
              label="Phone (optional)"
              type="tel"
              value={formData.phone || ''}
              onChange={handleFieldChange('phone')}
              placeholder="+41 44 123 45 67"
            />

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={handleFieldChange('notes')}
                placeholder="Additional notes..."
                rows={3}
                className="w-full px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:ring-2 focus:ring-design-button-primary focus:border-transparent resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/customers')}
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
              'Create Customer'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

