'use client'

import React, { useState, useEffect, useRef } from 'react'
import Input from '../Input'
import { ToInfo } from '@/lib/types/invoice'
import ZefixCompanySelect from '../ZefixCompanySelect'
import { PlusIcon } from '../Icons'
import CountryPicker from '../CountryPicker'

interface ToSectionProps {
  toInfo: ToInfo
  onChange: (toInfo: ToInfo) => void
  errors?: {
    toName?: string
    toAddress?: string
    toZip?: string
    toCity?: string
    toCountry?: string
  }
  onClearError?: (field: string) => void
  syncedCountry?: string // Country synced from FromSection
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

export default function ToSection({ toInfo, onChange, errors = {}, onClearError, syncedCountry }: ToSectionProps) {
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
    if (!hasParsedZip && toInfo.zip && !toInfo.city) {
      const parsed = parseZipCity(toInfo.zip)
      if (parsed.city) {
        onChange({
          ...toInfo,
          zip: parsed.zip,
          city: parsed.city,
        })
      }
      setHasParsedZip(true)
    }
  }, [toInfo.zip, toInfo.city, hasParsedZip])

  // Sync country from FromSection when it changes
  useEffect(() => {
    if (syncedCountry && syncedCountry !== toInfo.country) {
      onChange({
        ...toInfo,
        country: syncedCountry
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedCountry])

  // Show fields automatically when there are validation errors
  useEffect(() => {
    if (errors.toName || errors.toAddress || errors.toZip || errors.toCity) {
      setShowFields(true)
    }
  }, [errors.toName, errors.toAddress, errors.toZip, errors.toCity])

  const handleChange = (field: keyof ToInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...toInfo,
      [field]: e.target.value
    })
  }

  const handleCountryChange = (newCountry: string) => {
    onChange({
      ...toInfo,
      country: newCountry
    })
    onClearError?.('toCountry')
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
        setShowFields(true)
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
      ...toInfo,
      uid: company.uid,
      name: company.name,
      address: company.address,
      zip: company.zip,
      city: company.city,
    })
    // Clear validation errors for pre-filled fields
    onClearError?.('toName')
    onClearError?.('toAddress')
    onClearError?.('toZip')
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        To
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          {/* Country selection */}
          <CountryPicker
            label="Country"
            value={toInfo.country || ''}
            onChange={handleCountryChange}
            placeholder="Select country"
            error={errors.toCountry}
            onErrorClear={() => onClearError?.('toCountry')}
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
            label="Company name"
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
                label="Address"
                value={toInfo.address || ''}
                onChange={handleChange('address')}
                placeholder="Address"
                error={errors.toAddress}
                required
                onErrorClear={() => onClearError?.('toAddress')}
                fieldName="toAddress"
              />
              <Input
                label="UID/VAT number"
                value={toInfo.uid || ''}
                onChange={handleChange('uid')}
                placeholder="CHE-123.456.789"
              />
              
              <Input
                label="Name"
                value={toInfo.name || ''}
                onChange={handleChange('name')}
                placeholder="Company AG"
                error={errors.toName}
                required
                onErrorClear={() => onClearError?.('toName')}
                fieldName="toName"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ZIP"
                  value={toInfo.zip || ''}
                  onChange={handleChange('zip')}
                  placeholder="8001"
                  error={errors.toZip}
                  required
                  onErrorClear={() => onClearError?.('toZip')}
                  fieldName="toZip"
                />
                <Input
                  label="City"
                  value={toInfo.city || ''}
                  onChange={handleChange('city')}
                  placeholder="Zurich"
                  error={errors.toCity}
                  required
                  onErrorClear={() => onClearError?.('toCity')}
                  fieldName="toCity"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
