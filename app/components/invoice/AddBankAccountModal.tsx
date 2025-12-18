'use client'

import React, { useState, useEffect } from 'react'
import Modal, { ModalBody, ModalFooter } from '../Modal'
import Input from '../Input'
import Button from '../Button'
import { Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveBankAccountWithClient, BankAccount } from '@/lib/services/bankAccountService.client'

interface AddBankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountAdded: (account: BankAccount) => void
  existingBankAccounts: BankAccount[]
  supabase: SupabaseClient
  userId: string
}

export default function AddBankAccountModal({
  isOpen,
  onClose,
  onAccountAdded,
  existingBankAccounts,
  supabase,
  userId
}: AddBankAccountModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    iban: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', iban: '' })
      setErrors({})
    }
  }, [isOpen])

  const handleFieldChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
    
    // Real-time validation for name field (check duplicates)
    if (field === 'name' && value.trim()) {
      const trimmedName = value.trim()
      const duplicateExists = existingBankAccounts.some(
        account => account.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (duplicateExists) {
        setErrors(prev => ({
          ...prev,
          name: 'An account with this name already exists'
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required'
    } else {
      // Check for duplicate names (case-insensitive)
      const trimmedName = formData.name.trim()
      const duplicateExists = existingBankAccounts.some(
        account => account.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (duplicateExists) {
        newErrors.name = 'An account with this name already exists'
      }
    }
    
    // IBAN is optional - no validation needed

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const account = await saveBankAccountWithClient(supabase, userId, {
        name: formData.name.trim(),
        iban: formData.iban.trim(),
        is_default: false // Will be set to true if it's the first account
      })

      onAccountAdded(account)
      onClose()
    } catch (error) {
      console.error('Error saving bank account:', error)
      setErrors({ save: 'Failed to save bank account. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Bank Account">
      <div className="flex flex-col gap-5">
        <ModalBody>
          <Input
            label="Account Name"
            value={formData.name}
            onChange={handleFieldChange('name')}
            placeholder="e.g. Main Account"
            error={errors.name}
            required
          />
          <Input
            label="IBAN"
            value={formData.iban}
            onChange={handleFieldChange('iban')}
            placeholder="CH93 0076 2011 6238 5295 7"
            error={errors.iban}
            className="font-mono"
          />
        </ModalBody>

        {errors.save && (
          <div className="px-4 sm:px-5">
            <p className="text-destructive text-[13px]">{errors.save}</p>
          </div>
        )}

        <ModalFooter>
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
              'Add Account'
            )}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

