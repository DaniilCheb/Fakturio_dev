'use client'

import React, { useState, useEffect } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from '@/app/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Label } from '@/app/components/ui/label'
import { getCountryOptions } from '@/lib/utils/countryCurrency'

// Get countries list
const countries = getCountryOptions()

interface CountryPickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  noLabel?: boolean
  onErrorClear?: () => void
  placeholder?: string
}

export default function CountryPicker({ 
  label, 
  value, 
  onChange, 
  error, 
  required, 
  noLabel = false, 
  onErrorClear,
  placeholder = 'Select country'
}: CountryPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCountry = countries.find((c) => c.value === value)
  const displayValue = selectedCountry ? selectedCountry.label : placeholder

  // Reset search query when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  // Filter countries based on search query
  const filteredCountries = countries.filter((country) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      country.value.toLowerCase().includes(searchLower) ||
      country.label.toLowerCase().includes(searchLower)
    )
  })

  const handleSelect = (countryValue: string) => {
    onChange(countryValue)
    setOpen(false)
    setSearchQuery('')
    // Clear error when user selects a country
    if (error && onErrorClear) {
      onErrorClear()
    }
  }

  const hasError = !!error

  const selectElement = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-[40px] rounded-lg px-[7px]",
            hasError && "border-destructive focus:ring-destructive"
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search countries..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={() => handleSelect(country.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  if (noLabel) {
    return (
      <div className="flex flex-col gap-1 w-full">
        {selectElement}
        {hasError && (
          <span className="text-destructive text-[12px] mt-[1px] m-0 block">
            {error || 'Required field'}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <Label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {selectElement}
      {hasError && (
        <span className="text-destructive text-[12px] mt-[1px] m-0 block">
          {error || 'Required field'}
        </span>
      )}
    </div>
  )
}

