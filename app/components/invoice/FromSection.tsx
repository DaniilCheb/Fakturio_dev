'use client'

import React, { useState, useEffect, useRef } from 'react'
import Input from '../Input'
import { FromInfo } from '@/lib/types/invoice'
import ZefixCompanySelect from '../ZefixCompanySelect'

interface FromSectionProps {
  fromInfo: FromInfo
  onChange: (fromInfo: FromInfo) => void
  errors?: {
    fromName?: string
    fromStreet?: string
    fromZip?: string
    fromIban?: string
  }
  onClearError?: (field: string) => void
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

export default function FromSection({ fromInfo, onChange, errors = {}, onClearError }: FromSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = (field: keyof FromInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...fromInfo,
      [field]: e.target.value
    })
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
    // No-op for FromSection as fields are always visible
  }

  const fillFormWithCompany = (company: CompanyInfo) => {
    onChange({
      ...fromInfo,
      street: company.address,
      zip: `${company.zip} ${company.city}`.trim(),
    })
    // Clear validation errors for pre-filled fields
    onClearError?.('fromStreet')
    onClearError?.('fromZip')
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        From
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-5">
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
          <Input
            label="ZIP / City"
            value={fromInfo.zip || ''}
            onChange={handleChange('zip')}
            placeholder="8037 Zurich"
            error={errors.fromZip}
            required
            onErrorClear={() => onClearError?.('fromZip')}
            fieldName="fromZip"
          />
        </div>
      </div>
    </div>
  )
}
