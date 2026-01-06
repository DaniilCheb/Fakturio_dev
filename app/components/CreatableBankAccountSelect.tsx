'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import AddBankAccountModal from '@/app/components/invoice/AddBankAccountModal'
import type { BankAccount } from '@/lib/services/bankAccountService.client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface CreatableBankAccountSelectProps {
  value?: string
  onChange: (value: string) => void
  bankAccounts: BankAccount[]
  supabase: SupabaseClient | null
  userId: string
  onAccountAdded?: (account: BankAccount) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export default function CreatableBankAccountSelect({
  value,
  onChange,
  bankAccounts,
  supabase,
  userId,
  onAccountAdded,
  disabled = false,
  error,
  placeholder = 'Select a bank account',
}: CreatableBankAccountSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Format bank account for display
  const formatBankAccountDisplay = (account: BankAccount): string => {
    if (account.iban) {
      return `${account.name} - ${account.iban}`
    }
    return account.name
  }

  const selectedAccount = bankAccounts.find((a) => a.id === value)
  const displayName = selectedAccount
    ? formatBankAccountDisplay(selectedAccount)
    : placeholder

  // Filter bank accounts based on search query
  const filteredAccounts = bankAccounts.filter((account) => {
    const display = formatBankAccountDisplay(account)
    return display.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Show create option if search query doesn't match any account
  const showCreateOption =
    searchQuery.trim().length > 0 &&
    !filteredAccounts.some(
      (a) => formatBankAccountDisplay(a).toLowerCase() === searchQuery.toLowerCase()
    )

  const handleSelect = (accountId: string) => {
    onChange(accountId)
    setOpen(false)
    setSearchQuery('')
  }

  const handleCreateClick = () => {
    setShowAddModal(true)
    setOpen(false)
    setSearchQuery('')
  }

  const handleAccountAdded = (newAccount: BankAccount) => {
    // Auto-select the new account
    onChange(newAccount.id)
    
    // Call the callback if provided
    onAccountAdded?.(newAccount)
    
    setShowAddModal(false)
  }

  // Reset search query when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  if (!supabase) {
    // Fallback to disabled state if no supabase client
    return (
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default flex items-center',
            error && 'border-red-500'
          )}
        >
          {displayName}
        </div>
        {error && (
          <p className="text-red-500 text-[12px] mt-1">{error}</p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                'w-full h-[40px] justify-between bg-design-surface-field border border-design-border-default rounded-lg text-[14px] font-normal hover:bg-design-surface-field',
                error && 'border-red-500 focus:ring-red-500',
                !selectedAccount && 'text-muted-foreground'
              )}
            >
              <span className="truncate">{displayName}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search bank accounts or type to create one"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {/* Always show "Create new" as first option when dropdown is open */}
                <CommandGroup>
                  <CommandItem
                    value="create-new"
                    onSelect={() => handleCreateClick()}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create new</span>
                  </CommandItem>
                </CommandGroup>

                {filteredAccounts.length === 0 && searchQuery.trim().length === 0 ? (
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No bank accounts found.
                    </div>
                  </CommandEmpty>
                ) : (
                  <>
                    {filteredAccounts.length > 0 && (
                      <CommandGroup>
                        {filteredAccounts.map((account) => (
                          <CommandItem
                            key={account.id}
                            value={`${formatBankAccountDisplay(account)} ${account.id}`}
                            onSelect={() => handleSelect(account.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                value === account.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {formatBankAccountDisplay(account)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {showCreateOption && (
                      <CommandGroup>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Select an option or create one
                        </div>
                        <CommandItem
                          value={`create-${searchQuery}`}
                          onSelect={() => handleCreateClick()}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span>Create</span>
                            <span className="px-2 py-0.5 bg-muted rounded-md text-sm font-medium">
                              {searchQuery}
                            </span>
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    )}
                    {filteredAccounts.length === 0 && searchQuery.trim().length > 0 && !showCreateOption && (
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No bank accounts found.
                        </div>
                      </CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="text-red-500 text-[12px] mt-1">{error}</p>
        )}
      </div>

      {/* Add Bank Account Modal */}
      {supabase && (
        <AddBankAccountModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
          }}
          onAccountAdded={handleAccountAdded}
          existingBankAccounts={bankAccounts}
          supabase={supabase}
          userId={userId}
        />
      )}
    </>
  )
}

