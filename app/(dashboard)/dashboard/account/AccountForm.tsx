'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { updateUserProfileWithClient, type Profile } from '@/lib/services/settingsService.client'
import { formatUid } from '@/lib/services/zefixService'
import { Loader2, X } from 'lucide-react'

interface AccountFormProps {
  initialProfile: Profile | null
}

interface CompanyInfo {
  name: string
  address: string
  zip: string
  city: string
  canton: string
  legalForm: string
  uid: string
  status: string
}

interface SearchResult {
  name: string
  uid: string
  legalSeat: string
  legalForm: string
  status: string
}

export default function AccountForm({ initialProfile }: AccountFormProps) {
  const { session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Zefix search state
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    name: initialProfile?.name || '',
    company_name: initialProfile?.company_name || '',
    address: initialProfile?.address || '',
    city: initialProfile?.city || '',
    postal_code: initialProfile?.postal_code || '',
    country: initialProfile?.country || 'Switzerland',
    phone: initialProfile?.phone || '',
    vat_number: initialProfile?.vat_number || '',
  })

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSuccess(false)
    setError(null)
  }

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, company_name: value }))
    setSuccess(false)
    setError(null)
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
        setLookupError(data.error || 'Failed to search companies')
        return
      }

      const results = data as SearchResult[]
      
      if (results.length === 0) {
        setLookupError('No companies found')
        return
      }

      setSearchResults(results)
      setShowResults(true)
    } catch (err) {
      console.error('Lookup error:', err)
      setLookupError('Failed to connect to lookup service')
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
    setShowResults(false)
    setSearchResults([])
    setIsSearching(true)
    
    try {
      const company = await lookupByUid(result.uid)
      if (company) {
        setFormData(prev => ({
          ...prev,
          company_name: company.name,
          address: company.address,
          city: company.city,
          postal_code: company.zip,
          country: 'Switzerland',
        }))
        setIsCompanySelected(true)
        setSuccess(false)
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearCompany = () => {
    setFormData(prev => ({ ...prev, company_name: '' }))
    setLookupError(null)
    setShowResults(false)
    setSearchResults([])
    setIsCompanySelected(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await updateUserProfileWithClient(supabase, userId, {
        ...formData,
        email: session.user.primaryEmailAddress?.emailAddress || initialProfile?.email || '',
      })

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          Your Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., John Doe"
        />
      </div>

      {/* Company Name with Zefix Search */}
      <div className="flex flex-col gap-1" ref={dropdownRef}>
        <label className="text-[13px] font-medium text-design-content-weak">
          Company Name
        </label>
        <div className="relative">
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleCompanyNameChange}
            className="w-full h-[40px] px-3 py-2 pr-10 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
            placeholder="Search Swiss companies..."
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-design-content-weak" />
            </div>
          ) : formData.company_name && (
            <button
              type="button"
              onClick={handleClearCompany}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-design-content-weak rounded-full transition-all hover:bg-design-surface-field-hover hover:text-design-content-default"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-design-surface-default border border-design-border-default rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-design-border-default">
                <span className="text-xs text-design-content-weak">
                  {searchResults.length} companies found
                </span>
                <button
                  type="button"
                  onClick={() => setShowResults(false)}
                  className="text-design-content-weak hover:text-design-content-default"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {searchResults.map((result, index) => (
                <button
                  key={`${result.uid}-${index}`}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-3 py-3 text-left hover:bg-design-surface-field border-b border-design-border-default last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-sm text-design-content-default">
                    {result.name}
                  </div>
                  <div className="text-xs text-design-content-weak mt-0.5">
                    {formatUid(result.uid)} • {result.legalSeat} • {result.legalForm}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {lookupError && (
          <span className="text-red-500 dark:text-red-400 text-[12px]">
            {lookupError}
          </span>
        )}
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          Street Address
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., Bahnhofstrasse 1"
        />
      </div>

      {/* City and Postal Code */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-design-content-weak">
            Postal Code
          </label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
            className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
            placeholder="e.g., 8001"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-design-content-weak">
            City
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
            placeholder="e.g., Zürich"
          />
        </div>
      </div>

      {/* Country */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          Country
        </label>
        <input
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., Switzerland"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., +41 44 123 45 67"
        />
      </div>

      {/* VAT Number */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          VAT Number (optional)
        </label>
        <input
          type="text"
          name="vat_number"
          value={formData.vat_number}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., CHE-123.456.789"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-[13px] text-green-600 dark:text-green-400">Profile saved successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center px-5 py-2.5 h-[44px] bg-design-button-primary text-design-on-button-content rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}

