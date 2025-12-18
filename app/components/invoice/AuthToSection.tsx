'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PlusIcon } from '../Icons'
import { Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getContactsWithClient, Contact } from '@/lib/services/contactService.client'
import AddCustomerModal from './AddCustomerModal'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

export interface AuthToInfo {
  contact_id: string
  uid?: string
  name: string
  address: string
  zip: string
}

interface AuthToSectionProps {
  toInfo: AuthToInfo
  onChange: (toInfo: AuthToInfo) => void
  supabase: SupabaseClient
  userId: string
  errors?: {
    toName?: string
    toAddress?: string
    toZip?: string
    contact_id?: string
  }
  onClearError?: (field: string) => void
}

export default function AuthToSection({
  toInfo,
  onChange,
  supabase,
  userId,
  errors = {},
  onClearError
}: AuthToSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Load contacts on mount
  useEffect(() => {
    async function loadContacts() {
      try {
        const fetchedContacts = await getContactsWithClient(supabase, userId)
        // Filter to only show customers
        const customers = fetchedContacts.filter(c => c.type === 'customer')
        setContacts(customers)
      } catch (error) {
        console.error('Error loading contacts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
  }, [supabase, userId])

  // Format contact for display
  const formatContactDisplay = (contact: Contact): string => {
    if (contact.company_name && contact.company_name !== contact.name) {
      return `${contact.company_name} (${contact.name})`
    }
    return contact.company_name || contact.name
  }

  // Get the selected contact
  const selectedContact = useMemo(() => {
    return contacts.find(c => c.id === toInfo.contact_id)
  }, [contacts, toInfo.contact_id])

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      // Build zip from postal_code and city
      const zipCity = [contact.postal_code, contact.city].filter(Boolean).join(' ')
      
      onChange({
        contact_id: contact.id,
        uid: contact.vat_number,
        name: contact.company_name || contact.name,
        address: contact.address || '',
        zip: zipCity
      })
      
      // Clear errors
      onClearError?.('contact_id')
      onClearError?.('toName')
      onClearError?.('toAddress')
      onClearError?.('toZip')
    }
  }

  const handleCustomerCreated = (contact: Contact) => {
    // Add to local list
    setContacts(prev => [contact, ...prev])
    
    // Auto-select the new contact
    const zipCity = [contact.postal_code, contact.city].filter(Boolean).join(' ')
    onChange({
      contact_id: contact.id,
      uid: contact.vat_number,
      name: contact.company_name || contact.name,
      address: contact.address || '',
      zip: zipCity
    })
    
    // Clear errors
    onClearError?.('contact_id')
    onClearError?.('toName')
    onClearError?.('toAddress')
    onClearError?.('toZip')
  }

  const hasError = errors.contact_id || errors.toName || errors.toAddress || errors.toZip

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        To
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Customer Dropdown */}
          <div className="flex flex-col gap-1" data-field="contact_id">
            <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Select customer <span className="text-destructive">*</span>
            </Label>
            
            {isLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-[#e0e0e0] dark:border-[#333] rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-design-content-weak" />
                <span className="text-[14px] text-design-content-weak">Loading customers...</span>
              </div>
            ) : (
              <ShadcnSelect
                value={toInfo.contact_id || ''}
                onValueChange={handleContactSelect}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  hasError && "border-destructive focus:ring-destructive"
                )}>
                  <SelectValue placeholder={contacts.length === 0 ? "No customers yet" : "Select a customer..."} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {formatContactDisplay(contact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
            )}
            
            {hasError && (
              <p className="text-destructive text-[12px] mt-1">
                {errors.contact_id || errors.toName || 'Please select a customer'}
              </p>
            )}
          </div>

          {/* Create New Customer Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors"
          >
            <PlusIcon size={12} />
            Create new customer
          </button>

          {/* Selected Customer Details */}
          {selectedContact && (
            <div className="pt-3 border-t border-[#e0e0e0] dark:border-[#333]">
              <div className="text-[13px] text-design-content-weak space-y-1">
                {selectedContact.vat_number && (
                  <p className="text-[12px] text-design-content-weak">{selectedContact.vat_number}</p>
                )}
                <p className="font-medium text-design-content-default">{selectedContact.company_name || selectedContact.name}</p>
                {selectedContact.address && <p>{selectedContact.address}</p>}
                <p>
                  {[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')}
                </p>
                {selectedContact.email && (
                  <p className="text-[12px]">{selectedContact.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerCreated={handleCustomerCreated}
        supabase={supabase}
        userId={userId}
      />
    </div>
  )
}


