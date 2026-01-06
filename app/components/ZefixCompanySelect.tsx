'use client'

import { useState, useEffect } from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/button'
import {
  Command,
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
import { Skeleton } from '@/app/components/ui/skeleton'
import { formatUid } from '@/lib/services/zefixService'

interface SearchResult {
  name: string
  uid: string
  legalSeat: string
  legalForm: string
  status: string
}

interface ZefixCompanySelectProps {
  value: string // Current search query/company name
  onValueChange: (value: string) => void // Called when user types (triggers search)
  isLoading: boolean
  searchResults: SearchResult[]
  onSelectResult: (result: SearchResult) => void
  onManualEntry: () => void
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
}

export default function ZefixCompanySelect({
  value,
  onValueChange,
  isLoading,
  searchResults,
  onSelectResult,
  onManualEntry,
  placeholder = 'Enter company name...',
  disabled = false,
  error,
  label,
}: ZefixCompanySelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sync searchQuery with value when popover opens
  useEffect(() => {
    if (open) {
      setSearchQuery(value)
    }
  }, [open, value])

  // Reset search query when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onValueChange(query)
  }

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result)
    setOpen(false)
    setSearchQuery('')
  }

  // Handle manual entry
  const handleManualEntry = () => {
    onManualEntry()
    setOpen(false)
    setSearchQuery('')
  }

  const displayValue = value || placeholder

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
          {label}
        </label>
      )}
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
              !value && 'text-[#9D9B9A]'
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search companies..."
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              {/* Always show "Enter manually" as first option */}
              <CommandGroup>
                <CommandItem
                  value="enter-manually"
                  onSelect={handleManualEntry}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Enter manually</span>
                </CommandItem>
              </CommandGroup>

              {/* Skeleton loaders when loading and query has ≥3 characters */}
              {isLoading && searchQuery.trim().length >= 3 && (
                <CommandGroup>
                  {[1, 2, 3].map((i) => (
                    <CommandItem
                      key={i}
                      value={`skeleton-${i}`}
                      disabled
                      className="cursor-default"
                    >
                      <div className="flex flex-col gap-0.5 w-full">
                        <Skeleton className="h-4 w-48 bg-[#e5e5e5] dark:bg-[#333]" />
                        <Skeleton className="h-3 w-40 bg-[#e5e5e5] dark:bg-[#333]" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Zefix search results */}
              {!isLoading && searchResults.length > 0 && (
                <CommandGroup>
                  {searchResults.map((result, index) => (
                    <CommandItem
                      key={`${result.uid}-${index}`}
                      value={`${result.name}-${result.uid}`}
                      onSelect={() => handleSelectResult(result)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="font-medium text-sm text-[#141414] dark:text-white">
                          {result.name}
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#999]">
                          {formatUid(result.uid)} • {result.legalSeat} • {result.legalForm}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <span className="text-destructive text-[12px] mt-[1px] m-0 block">
          {error}
        </span>
      )}
    </div>
  )
}

