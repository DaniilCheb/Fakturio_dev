'use client'

import React, { useState, useEffect, useRef } from 'react'
import Input from '../Input'
import { ToInfo } from '@/lib/types/invoice'
import { formatUid } from '@/lib/services/zefixService'
import { Loader2 } from 'lucide-react'
import { CloseIcon } from '../Icons'

interface ToSectionProps {
  toInfo: ToInfo
  onChange: (toInfo: ToInfo) => void
  errors?: {
    toName?: string
    toAddress?: string
    toZip?: string
  }
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

export default function ToSection({ toInfo, onChange, errors = {} }: ToSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = (field: keyof ToInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...toInfo,
      [field]: e.target.value
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

    // Always show results dropdown for user to select
    setSearchResults(results)
    setShowResults(true)
  }

  const handleSelectResult = async (result: SearchResult) => {
    setShowResults(false)
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

  const handleClearSearch = () => {
    setSearchQuery('')
    setLookupError(null)
    setShowResults(false)
    setSearchResults([])
    setIsCompanySelected(false)
  }

  const fillFormWithCompany = (company: CompanyInfo) => {
    onChange({
      ...toInfo,
      uid: company.uid,
      name: company.name,
      address: company.address,
      zip: `${company.zip} ${company.city}`.trim(),
    })
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        To
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          {/* Company search */}
          <div className="flex flex-col gap-1">
            <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Company name (optional)
            </label>
            <div className="relative">
              <Input
                noLabel
                value={searchQuery}
                onChange={handleSearchQueryChange}
                placeholder="Enter company name..."
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#666] dark:text-[#999] rounded-full border border-transparent transition-all hover:bg-white hover:text-[#333] hover:shadow-sm hover:border-[#e0e0e0]"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
            {lookupError && (
              <span className="text-destructive text-[12px] mt-[1px] m-0 block">
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

          {/* UID field */}
          <Input
            label="UID"
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
          />
          <Input
            label="Address"
            value={toInfo.address || ''}
            onChange={handleChange('address')}
            placeholder="Address"
            error={errors.toAddress}
            required
          />
          <Input
            label="ZIP / City"
            value={toInfo.zip || ''}
            onChange={handleChange('zip')}
            placeholder="8037 Zurich"
            error={errors.toZip}
            required
          />
        </div>
      </div>
    </div>
  )
}
