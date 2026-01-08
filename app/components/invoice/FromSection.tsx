'use client'

import React, { useState, useEffect, useRef } from 'react'
import Input from '../Input'
import { FromInfo } from '@/lib/types/invoice'
import ZefixCompanySelect from '../ZefixCompanySelect'
import { PlusIcon } from '../Icons'
import CountryPicker from '../CountryPicker'

interface FromSectionProps {
  fromInfo: FromInfo
  onChange: (fromInfo: FromInfo) => void
  errors?: {
    fromName?: string
    fromStreet?: string
    fromZip?: string
    fromCity?: string
    fromIban?: string
    fromCountry?: string
  }
  onClearError?: (field: string) => void
  onCountryChange?: (country: string) => void // Callback to sync country to ToSection
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

export default function FromSection({ fromInfo, onChange, errors = {}, onClearError, onCountryChange }: FromSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const [showFields, setShowFields] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [hasParsedZip, setHasParsedZip] = useState(false)

  // Parse zip field into postal code and city
  const parseZipCity = (combined: string): { zip: string; city: string } => {
    if (!combined) return { zip: '', city: '' }
    const trimmed = combined.trim()
    const match = trimmed.match(/^(\d{4,6})\s+(.+)$/)
    if (match) {
      return { zip: match[1], city: match[2] }
    }
    if (/^\d+$/.test(trimmed)) {
      return { zip: trimmed, city: '' }
    }
    return { zip: '', city: trimmed }
  }

  // Parse existing combined zip value into separate fields on mount
  useEffect(() => {
    if (!hasParsedZip && fromInfo.zip && !fromInfo.city) {
      const parsed = parseZipCity(fromInfo.zip)
      if (parsed.city) {
        onChange({
          ...fromInfo,
          zip: parsed.zip,
          city: parsed.city,
        })
      }
      setHasParsedZip(true)
    }
  }, [fromInfo.zip, fromInfo.city, hasParsedZip])

  // Show fields automatically when there are validation errors
  useEffect(() => {
    if (errors.fromStreet || errors.fromZip || errors.fromCity) {
      setShowFields(true)
    }
  }, [errors.fromStreet, errors.fromZip, errors.fromCity])

  const handleChange = (field: keyof FromInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...fromInfo,
      [field]: e.target.value
    })
  }

  const handleCountryChange = (newCountry: string) => {
    onChange({
      ...fromInfo,
      country: newCountry
    })
    onClearError?.('fromCountry')
    // Sync country to ToSection
    if (onCountryChange) {
      onCountryChange(newCountry)
    }
  }

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
    setIsCompanySelected(false)
    if (lookupError) setLookupError(null)
    
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const performSearch = async (query: string) => {
    setIsLoading(true)
    setLookupError(null)

    try {
      await searchByName(query)
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

  const searchByName = async (name: string) => {
    const response = await fetch('/api/zefix/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
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

    // Set results for dropdown
    setSearchResults(results)
  }

  const handleSelectResult = async (result: SearchResult) => {
    setSearchResults([])
    setIsLoading(true)
    
    try {
      const company = await lookupByUid(result.uid)
      if (company) {
        fillFormWithCompany(company)
        // Keep the company name in the search field
        setSearchQuery(company.name)
        setIsCompanySelected(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualEntry = () => {
    setShowFields(true)
  }

  const fillFormWithCompany = (company: CompanyInfo) => {
    onChange({
      ...fromInfo,
      company_name: company.name,
      street: company.address,
      zip: company.zip,
      city: company.city,
      uid: company.uid,
    })
    // Clear validation errors for pre-filled fields
    onClearError?.('fromStreet')
    onClearError?.('fromZip')
    setShowFields(true)
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        From
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          {/* Country selection */}
          <CountryPicker
            label="Country"
            value={fromInfo.country || ''}
            onChange={handleCountryChange}
            placeholder="Select country"
            error={errors.fromCountry}
            onErrorClear={() => onClearError?.('fromCountry')}
          />
          
          <Input
            label="Your name"
            value={fromInfo.name || ''}
            onChange={handleChange('name')}
            placeholder="Name"
            error={errors.fromName}
            required
            onErrorClear={() => onClearError?.('fromName')}
            fieldName="fromName"
          />

          {/* Company search */}
          <ZefixCompanySelect
            value={searchQuery}
            onValueChange={handleSearchQueryChange}
            isLoading={isLoading}
            searchResults={searchResults}
            onSelectResult={handleSelectResult}
            onManualEntry={handleManualEntry}
            placeholder="Enter company name..."
            error={lookupError || undefined}
            label="Company name (optional)"
          />

          {/* Enter manually button */}
          {!showFields && (
            <button
              type="button"
              onClick={() => setShowFields(true)}
              className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors"
            >
              <PlusIcon size={12} />
              Enter manually
            </button>
          )}

          {/* Manual entry fields */}
          {showFields && (
            <>
              <Input
                label="UID/VAT number"
                value={fromInfo.uid || ''}
                onChange={handleChange('uid')}
                placeholder="CHE-123.456.789"
              />
              <Input
                label="Street"
                value={fromInfo.street || ''}
                onChange={handleChange('street')}
                placeholder="Street"
                error={errors.fromStreet}
                required
                onErrorClear={() => onClearError?.('fromStreet')}
                fieldName="fromStreet"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ZIP"
                  value={fromInfo.zip || ''}
                  onChange={handleChange('zip')}
                  placeholder="8001"
                  error={errors.fromZip}
                  required
                  onErrorClear={() => onClearError?.('fromZip')}
                  fieldName="fromZip"
                />
                <Input
                  label="City"
                  value={fromInfo.city || ''}
                  onChange={handleChange('city')}
                  placeholder="Zurich"
                  error={errors.fromCity}
                  required
                  onErrorClear={() => onClearError?.('fromCity')}
                  fieldName="fromCity"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
