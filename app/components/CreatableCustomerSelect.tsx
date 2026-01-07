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
import AddCustomerModal from '@/app/components/invoice/AddCustomerModal'
import type { Contact } from '@/lib/services/contactService.client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface CreatableCustomerSelectProps {
  value?: string
  onChange: (value: string) => void
  customers: Contact[]
  supabase: SupabaseClient | null
  userId: string
  onCustomerCreated?: (contact: Contact) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export default function CreatableCustomerSelect({
  value,
  onChange,
  customers,
  supabase,
  userId,
  onCustomerCreated,
  disabled = false,
  error,
  placeholder = 'Select a customer',
}: CreatableCustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [prefillName, setPrefillName] = useState('')

  const selectedCustomer = customers.find((c) => c.id === value)
  const displayName = selectedCustomer
    ? selectedCustomer.company_name || selectedCustomer.name
    : placeholder

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    const name = customer.company_name || customer.name
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Show create option if search query doesn't match any customer
  const showCreateOption =
    searchQuery.trim().length > 0 &&
    !filteredCustomers.some(
      (c) =>
        (c.company_name || c.name).toLowerCase() ===
        searchQuery.toLowerCase()
    )

  const handleSelect = (customerId: string) => {
    onChange(customerId)
    setOpen(false)
    setSearchQuery('')
  }

  const handleCreateClick = (prefill?: string) => {
    setPrefillName(prefill || searchQuery.trim())
    setShowAddModal(true)
    setOpen(false)
    setSearchQuery('')
  }

  const handleCustomerCreated = (contact: Contact) => {
    // Auto-select the new customer
    onChange(contact.id)
    // Call the callback if provided
    onCustomerCreated?.(contact)
    setShowAddModal(false)
    setPrefillName('')
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
                !selectedCustomer && 'text-muted-foreground'
              )}
            >
              <span className="truncate">{displayName}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-black" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search customers or type to create one"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {/* Always show "Create new" as first option when dropdown is open */}
                <CommandGroup>
                  <CommandItem
                    value="create-new"
                    onSelect={() => handleCreateClick('')}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create new</span>
                  </CommandItem>
                </CommandGroup>

                {filteredCustomers.length === 0 && searchQuery.trim().length === 0 ? (
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No customers found.
                    </div>
                  </CommandEmpty>
                ) : (
                  <>
                    {filteredCustomers.length > 0 && (
                      <CommandGroup>
                        {filteredCustomers.map((customer) => {
                          const name = customer.company_name || customer.name
                          return (
                            <CommandItem
                              key={customer.id}
                              value={`${name} ${customer.id}`}
                              onSelect={() => handleSelect(customer.id)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  value === customer.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {name}
                            </CommandItem>
                          )
                        })}
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
                    {filteredCustomers.length === 0 && searchQuery.trim().length > 0 && !showCreateOption && (
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No customers found.
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

      {/* Add Customer Modal */}
      {supabase && (
        <AddCustomerModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setPrefillName('')
          }}
          onCustomerCreated={handleCustomerCreated}
          supabase={supabase}
          userId={userId}
        />
      )}
    </>
  )
}

