'use client'

import React, { useState, useRef, useEffect } from 'react'
import Modal from '../Modal'
import Input from '../Input'
import Button from '../Button'
import ZefixCompanySelect from '../ZefixCompanySelect'
import { Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveContactWithClient, Contact } from '@/lib/services/contactService.client'

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onCustomerCreated: (contact: Contact) => void
  supabase: SupabaseClient
  userId: string
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

export default function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
  supabase,
  userId
}: AddCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCompanySelected, setIsCompanySelected] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Form fields
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    address: '',
    city: '',
    postalCode: '',
    email: '',
    phone: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        uid: '',
        name: '',
        address: '',
        city: '',
        postalCode: '',
        email: '',
        phone: ''
      })
      setSearchQuery('')
      setSearchResults([])
      setLookupError(null)
      setIsCompanySelected(false)
      setErrors({})
    }
  }, [isOpen])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

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

  const handleSelectResult = async (result: SearchResult) => {
    setSearchResults([])
    setIsLoading(true)
    
    try {
      const company = await lookupByUid(result.uid)
      if (company) {
        setFormData({
          uid: company.uid,
          name: company.name,
          address: company.address,
          city: company.city,
          postalCode: company.zip,
          email: '',
          phone: ''
        })
        setSearchQuery(company.name)
        setIsCompanySelected(true)
        setErrors({})
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualEntry = () => {
    // Pre-fill the name with the search query if available
    if (searchQuery.trim()) {
      setFormData(prev => ({
        ...prev,
        name: searchQuery.trim()
      }))
    }
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
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.postalCode.trim() && !formData.city.trim()) {
      newErrors.postalCode = 'ZIP or City is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const contact = await saveContactWithClient(supabase, userId, {
        type: 'customer',
        name: formData.name.trim(),
        company_name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postal_code: formData.postalCode.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        vat_number: formData.uid.trim() || undefined,
        country: 'Switzerland'
      })

      onCustomerCreated(contact)
      onClose()
    } catch (error) {
      console.error('Error saving customer:', error)
      setErrors({ save: 'Failed to save customer. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer">
      <div className="flex flex-col gap-5 p-4 sm:p-5">
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
          label="Search company"
        />

        <div>
          {formData.uid && (
            <div className="mb-4">
              <Input
                label="UID"
                value={formData.uid}
                onChange={handleFieldChange('uid')}
                placeholder="CHE-123.456.789"
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Input
              label="Name / Company"
              value={formData.name}
              onChange={handleFieldChange('name')}
              placeholder="Company AG"
              error={errors.name}
              required
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={handleFieldChange('address')}
              placeholder="Main Street 123"
              error={errors.address}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ZIP Code"
                value={formData.postalCode}
                onChange={handleFieldChange('postalCode')}
                placeholder="8000"
                error={errors.postalCode}
              />
              <Input
                label="City"
                value={formData.city}
                onChange={handleFieldChange('city')}
                placeholder="Zürich"
              />
            </div>
            <Input
              label="Email (optional)"
              type="email"
              value={formData.email}
              onChange={handleFieldChange('email')}
              placeholder="contact@company.ch"
            />
            <Input
              label="Phone (optional)"
              value={formData.phone}
              onChange={handleFieldChange('phone')}
              placeholder="+41 44 123 45 67"
            />
          </div>
        </div>

        {errors.save && (
          <p className="text-destructive text-[13px]">{errors.save}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Customer'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}


