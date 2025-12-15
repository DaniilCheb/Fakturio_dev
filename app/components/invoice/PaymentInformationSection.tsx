'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PlusIcon } from '../Icons'
import { Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getBankAccountsWithClient, BankAccount } from '@/lib/services/bankAccountService.client'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'
import AddBankAccountModal from './AddBankAccountModal'

interface PaymentInformationSectionProps {
  selectedBankAccountId: string
  onChange: (bankAccountId: string) => void
  bankAccounts: BankAccount[]
  isLoading?: boolean
  supabase: SupabaseClient
  userId: string
  errors?: {
    bank_account_id?: string
  }
  onClearError?: (field: string) => void
  onAccountAdded?: (account: BankAccount) => void
}

export default function PaymentInformationSection({
  selectedBankAccountId,
  onChange,
  bankAccounts,
  isLoading = false,
  supabase,
  userId,
  errors = {},
  onClearError,
  onAccountAdded
}: PaymentInformationSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  // Format bank account for display
  const formatBankAccountDisplay = (account: BankAccount): string => {
    if (account.iban) {
      return `${account.name} - ${account.iban}`
    }
    return account.name
  }

  // Get the selected bank account
  const selectedAccount = useMemo(() => {
    return bankAccounts.find(a => a.id === selectedBankAccountId)
  }, [bankAccounts, selectedBankAccountId])

  const handleBankAccountSelect = (accountId: string) => {
    onChange(accountId)
    onClearError?.('bank_account_id')
  }

  const handleAccountAdded = (newAccount: BankAccount) => {
    // Notify parent to add account to list
    onAccountAdded?.(newAccount)
    
    // Auto-select the new account
    onChange(newAccount.id)
    
    // Clear errors
    onClearError?.('bank_account_id')
  }

  const hasError = !!errors.bank_account_id

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        Payment Information
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Bank Account Dropdown */}
          <div className="flex flex-col gap-1" data-field="bank_account_id">
            <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Select bank account <span className="text-destructive">*</span>
            </Label>
            
            {isLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-[#e0e0e0] dark:border-[#333] rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-design-content-weak" />
                <span className="text-[14px] text-design-content-weak">Loading bank accounts...</span>
              </div>
            ) : (
              <ShadcnSelect
                value={selectedBankAccountId || ''}
                onValueChange={handleBankAccountSelect}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  hasError && "border-destructive focus:ring-destructive"
                )}>
                  <SelectValue placeholder={bankAccounts.length === 0 ? "No bank accounts yet" : "Select a bank account..."} />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {formatBankAccountDisplay(account)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
            )}
            
            {hasError && (
              <p className="text-destructive text-[12px] mt-1">
                {errors.bank_account_id || 'Please select a bank account'}
              </p>
            )}
          </div>

          {/* Add Bank Account Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors"
          >
            <PlusIcon size={12} />
            Add bank account
          </button>

          {/* Selected Bank Account Details */}
          {selectedAccount && (
            <div className="pt-3 border-t border-[#e0e0e0] dark:border-[#333]">
              <div className="text-[13px] text-design-content-weak space-y-1">
                <p className="font-medium text-design-content-default">{selectedAccount.name}</p>
                {selectedAccount.iban && (
                  <p className="font-mono text-[12px]">{selectedAccount.iban}</p>
                )}
                {selectedAccount.bank_name && (
                  <p className="text-[12px]">{selectedAccount.bank_name}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAccountAdded={handleAccountAdded}
        existingBankAccounts={bankAccounts}
        supabase={supabase}
        userId={userId}
      />
    </div>
  )
}
