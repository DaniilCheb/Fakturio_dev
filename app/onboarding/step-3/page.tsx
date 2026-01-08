'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { updateUserProfileWithClient } from '@/lib/services/settingsService.client'
import { getCurrencyForCountry, shouldPromptCurrencyUpdate } from '@/lib/utils/countryCurrency'
import { getGuestCacheData } from '@/lib/services/guestCacheService'
import { type CompanyInfo } from '@/lib/services/zefixService'
import Input from '@/app/components/Input'
import CurrencyPicker from '@/app/components/CurrencyPicker'
import CountryPicker from '@/app/components/CountryPicker'
import Button from '@/app/components/Button'
import ZefixCompanySelect from '@/app/components/ZefixCompanySelect'
import { Loader2 } from 'lucide-react'

interface SearchResult {
  name: string
  uid: string
  legalSeat: string
  legalForm: string
  status: string
}

interface ValidationErrors {
  name?: string
  country?: string
  currency?: string
  company?: string
  company_uid?: string
  street?: string
  postal_code?: string
  city?: string
}

export default function OnboardingStep3Page() {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state - initialize with defaults to ensure controlled components
  const [formData, setFormData] = useState({
    name: '',
    country: 'Switzerland', // Default to ensure controlled
    currency: 'CHF', // Default to ensure controlled
    company: '',
    company_uid: '',
    street: '',
    postal_code: '',
    city: '',
  })
  
  // Track which fields were pre-filled
  const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set())
  
  // Track if currency was manually set
  const [wasCurrencyManuallySet, setWasCurrencyManuallySet] = useState(false)
  const previousCountryRef = useRef<string>('')
  
  // Zefix search state
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Validation errors
  const [errors, setErrors] = useState<ValidationErrors>({})
  
  // Load guest data and existing profile on mount
  useEffect(() => {
    async function loadInitialData() {
      if (!session || !user) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClientSupabaseClient(session)
        
        // Check for guest cache data
        const guestData = getGuestCacheData()
        
        // Check for existing profile
        const { getUserProfileWithClient } = await import('@/lib/services/settingsService.client')
        const existingProfile = await getUserProfileWithClient(supabase, user.id).catch(() => null)
        
        // Pre-fill from guest data or existing profile
        // Priority: existing profile > guest data > defaults
        const initialData = {
          name: existingProfile?.name || guestData.profile?.name || '',
          country: existingProfile?.country || guestData.profile?.country || 'Switzerland',
          currency: existingProfile?.account_currency || guestData.profile?.currency || 'CHF',
          company: existingProfile?.company_name || guestData.profile?.company || '',
          company_uid: guestData.profile?.company_uid || '', // UID not stored in profile yet
          street: existingProfile?.address || guestData.profile?.street || '',
          postal_code: existingProfile?.postal_code || guestData.profile?.postal_code || '',
          city: existingProfile?.city || guestData.profile?.city || '',
        }
        
        setFormData(initialData)
        previousCountryRef.current = initialData.country
        
        // Track pre-filled fields
        const prefilled = new Set<string>()
        if (guestData.profile?.name) prefilled.add('name')
        if (guestData.profile?.country) prefilled.add('country')
        if (guestData.profile?.currency) prefilled.add('currency')
        if (guestData.profile?.company) prefilled.add('company')
        if (guestData.profile?.street) prefilled.add('street')
        if (guestData.profile?.postal_code) prefilled.add('postal_code')
        if (guestData.profile?.city) prefilled.add('city')
        setPrefilledFields(prefilled)
        
        // Auto-select currency based on country
        if (initialData.country && !initialData.currency) {
          const defaultCurrency = getCurrencyForCountry(initialData.country)
          if (defaultCurrency) {
            setFormData(prev => ({ ...prev, currency: defaultCurrency }))
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [session, user])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])


  // Handle country change with currency auto-selection
  const handleCountryChange = (newCountry: string) => {
    const previousCountry = previousCountryRef.current
    
    setFormData(prev => ({ ...prev, country: newCountry }))
    setErrors(prev => ({ ...prev, country: undefined }))
    
    // Check if we should prompt for currency update
    if (shouldPromptCurrencyUpdate(newCountry, previousCountry, formData.currency, wasCurrencyManuallySet)) {
      const newDefaultCurrency = getCurrencyForCountry(newCountry)
      if (newDefaultCurrency && window.confirm(`The default currency for ${newCountry} is ${newDefaultCurrency}. Would you like to update your currency?`)) {
        setFormData(prev => ({ ...prev, currency: newDefaultCurrency }))
        setWasCurrencyManuallySet(false)
      }
    } else {
      // Auto-select currency
      const defaultCurrency = getCurrencyForCountry(newCountry)
      if (defaultCurrency && !wasCurrencyManuallySet) {
        setTimeout(() => {
          setFormData(prev => ({ ...prev, currency: defaultCurrency }))
        }, 50) // Small delay to ensure state update
      }
    }
    
    previousCountryRef.current = newCountry
    
    // Disable Zefix if not Switzerland
    if (newCountry !== 'Switzerland') {
      setSearchResults([])
      setIsCompanySelected(false)
    }
  }

  // Handle currency change
  const handleCurrencyChange = (value: string) => {
    setFormData(prev => ({ ...prev, currency: value }))
    setErrors(prev => ({ ...prev, currency: undefined }))
    setWasCurrencyManuallySet(true)
  }

  // Handle company name change with Zefix search
  const handleCompanyNameChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, company: value, company_uid: '' }
      return newData
    })
    setErrors(prev => ({ ...prev, company: undefined }))
    setIsCompanySelected(false)
    if (lookupError) setLookupError(null)
    
    // Only search if Switzerland is selected
    if (formData.country !== 'Switzerland') {
      setSearchResults([])
      return
    }
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // If less than 3 characters, clear results
    if (value.trim().length < 3) {
      setSearchResults([])
      return
    }
    
    // Debounce the search
    debounceRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, 300)
  }

  const performSearch = async (query: string) => {
    setIsSearching(true)
    setLookupError(null)

    try {
      const response = await fetch('/api/zefix/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query }),
      })
      const data = await response.json()

      if (!response.ok) {
        setLookupError(data.error || 'Company search temporarily unavailable. Please enter details manually.')
        return
      }

      const results = data as SearchResult[]
      
      if (results.length === 0) {
        setLookupError('No companies found. You can enter details manually.')
        return
      }

      // Limit to 10 results
      setSearchResults(results.slice(0, 10))
    } catch (error) {
      console.error('Lookup error:', error)
      setLookupError('Company search temporarily unavailable. Please enter details manually.')
    } finally {
      setIsSearching(false)
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
    setSearchResults([])
    setIsSearching(true)
    
    try {
      const company = await lookupByUid(result.uid)
      if (company) {
        setFormData(prev => {
          const newData = {
            ...prev,
            company: company.name,
            company_uid: company.uid,
            street: company.address,
            postal_code: company.zip,
            city: company.city,
          }
          return newData
        })
        setIsCompanySelected(true)
        setLookupError(null)
        // Clear errors for pre-filled fields
        setErrors(prev => {
          const updated = { ...prev }
          delete updated.street
          delete updated.postal_code
          delete updated.city
          return updated
        })
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleManualEntry = () => {
    // No-op for onboarding as fields are always visible
  }

  const handleFieldChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    }
    
    if (!formData.country) {
      newErrors.country = 'Country is required'
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Currency is required'
    }
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required'
    }
    
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0]
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        ;(errorElement.querySelector('input') || errorElement.querySelector('select'))?.focus()
      }
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (!session || !user) {
      setError('Session expired. Please sign in again.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      
      const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || null
      
      const profileUpdates = {
        email: userEmail || undefined,
        name: formData.name.trim(),
        company_name: formData.company.trim() || undefined,
        address: formData.street.trim(),
        postal_code: formData.postal_code.trim(),
        city: formData.city.trim(),
        country: formData.country,
        account_currency: formData.currency,
      }
      
      const savedProfile = await updateUserProfileWithClient(supabase, user.id, profileUpdates)
      
      // Verify profile was saved correctly before navigating
      const verifyProfile = await supabase.from("profiles").select("name, address, postal_code, city, company_name").eq("id", user.id).maybeSingle();
      
      // Navigate to Step 4
      router.push('/onboarding/step-4')
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError(error.message || 'Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 bg-design-border-default rounded-full overflow-hidden">
            <div className="h-full bg-[#F8DA44] rounded-full" style={{ width: '50%' }} />
          </div>
        </div>
        <h1 className="text-[32px] font-semibold text-design-content-default tracking-[-0.512px] pt-4">
          Tell us about yourself
        </h1>
        <p className="text-[16px] text-design-content-weak mt-2 tracking-[-0.256px]">
          This information will speed up your invoice creation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[33px]">
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-5 flex flex-col gap-5">
        {/* Name */}
        <Input
          label="Your name"
          name="name"
          value={formData.name}
          onChange={handleFieldChange('name')}
          placeholder="e.g., John Doe"
          required
          error={errors.name}
          fieldName="name"
          onErrorClear={() => setErrors(prev => ({ ...prev, name: undefined }))}
        />

        {/* Country and Currency side-by-side */}
        <div className="flex gap-5">
          <div className="flex-1">
            <CountryPicker
              label="Country"
              value={formData.country}
              onChange={handleCountryChange}
              placeholder="Select your country"
              required
              error={errors.country}
              onErrorClear={() => setErrors(prev => ({ ...prev, country: undefined }))}
            />
          </div>
          <div className="flex-1">
            <CurrencyPicker
              label="Currency"
              value={formData.currency}
              onChange={handleCurrencyChange}
              required
              error={errors.currency}
              onErrorClear={() => setErrors(prev => ({ ...prev, currency: undefined }))}
            />
          </div>
        </div>

        {/* Company with Zefix search */}
        {formData.country === 'Switzerland' ? (
          <ZefixCompanySelect
            value={formData.company}
            onValueChange={handleCompanyNameChange}
            isLoading={isSearching}
            searchResults={searchResults}
            onSelectResult={handleSelectResult}
            onManualEntry={handleManualEntry}
            placeholder="Company name"
            error={lookupError || undefined}
            label="Company (optional)"
          />
        ) : (
          <Input
            label="Company (optional)"
            name="company"
            value={formData.company}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, company: e.target.value, company_uid: '' }))
              setErrors(prev => ({ ...prev, company: undefined }))
            }}
            placeholder="Company name"
            fieldName="company"
            onErrorClear={() => setErrors(prev => ({ ...prev, company: undefined }))}
          />
        )}

        {/* Street Address */}
        <Input
          label="Street Address"
          name="street"
          value={formData.street}
          onChange={handleFieldChange('street')}
          placeholder="e.g., Bahnhofstrasse 1"
          required
          error={errors.street}
          fieldName="street"
          onErrorClear={() => setErrors(prev => ({ ...prev, street: undefined }))}
        />

        {/* Postal Code and City side-by-side */}
        <div className="flex gap-5">
          <div className="flex-1">
            <Input
              label="Postal code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleFieldChange('postal_code')}
              placeholder="e.g., 8001"
              required
              error={errors.postal_code}
              fieldName="postal_code"
              onErrorClear={() => setErrors(prev => ({ ...prev, postal_code: undefined }))}
            />
          </div>
          <div className="flex-1">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleFieldChange('city')}
              placeholder="e.g., Zürich"
              required
              error={errors.city}
              fieldName="city"
              onErrorClear={() => setErrors(prev => ({ ...prev, city: undefined }))}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-[13px] text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        </div>

        {/* Submit button - outside card, right-aligned */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="default"
            disabled={isSaving}
            className="w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

