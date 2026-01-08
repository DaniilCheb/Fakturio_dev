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

// Major currencies list - sorted by common usage
export const currencies = [
  // Most common
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  
  // Other major currencies
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'BRL', label: 'BRL - Brazilian Real', symbol: 'R$' },
  { value: 'MXN', label: 'MXN - Mexican Peso', symbol: '$' },
  { value: 'KRW', label: 'KRW - South Korean Won', symbol: '₩' },
  { value: 'SGD', label: 'SGD - Singapore Dollar', symbol: 'S$' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar', symbol: 'HK$' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar', symbol: 'NZ$' },
  { value: 'ZAR', label: 'ZAR - South African Rand', symbol: 'R' },
  { value: 'SEK', label: 'SEK - Swedish Krona', symbol: 'kr' },
  { value: 'NOK', label: 'NOK - Norwegian Krone', symbol: 'kr' },
  { value: 'DKK', label: 'DKK - Danish Krone', symbol: 'kr' },
  { value: 'PLN', label: 'PLN - Polish Złoty', symbol: 'zł' },
  { value: 'CZK', label: 'CZK - Czech Koruna', symbol: 'Kč' },
  { value: 'HUF', label: 'HUF - Hungarian Forint', symbol: 'Ft' },
  { value: 'RON', label: 'RON - Romanian Leu', symbol: 'lei' },
  { value: 'BGN', label: 'BGN - Bulgarian Lev', symbol: 'лв' },
  { value: 'HRK', label: 'HRK - Croatian Kuna', symbol: 'kn' },
  { value: 'TRY', label: 'TRY - Turkish Lira', symbol: '₺' },
  { value: 'RUB', label: 'RUB - Russian Ruble', symbol: '₽' },
  { value: 'ILS', label: 'ILS - Israeli Shekel', symbol: '₪' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: '﷼' },
  { value: 'THB', label: 'THB - Thai Baht', symbol: '฿' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit', symbol: 'RM' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
  { value: 'PHP', label: 'PHP - Philippine Peso', symbol: '₱' },
  { value: 'VND', label: 'VND - Vietnamese Dong', symbol: '₫' },
  { value: 'CLP', label: 'CLP - Chilean Peso', symbol: '$' },
  { value: 'ARS', label: 'ARS - Argentine Peso', symbol: '$' },
  { value: 'COP', label: 'COP - Colombian Peso', symbol: '$' },
  { value: 'PEN', label: 'PEN - Peruvian Sol', symbol: 'S/' },
]

interface CurrencyPickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  noLabel?: boolean
  onErrorClear?: () => void
}

export default function CurrencyPicker({ 
  label, 
  value, 
  onChange, 
  error, 
  required, 
  noLabel = false, 
  onErrorClear 
}: CurrencyPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCurrency = currencies.find((c) => c.value === value)
  const displayValue = selectedCurrency ? selectedCurrency.label : 'Select currency'

  // Reset search query when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  // Filter currencies based on search query
  const filteredCurrencies = currencies.filter((currency) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      currency.value.toLowerCase().includes(searchLower) ||
      currency.label.toLowerCase().includes(searchLower) ||
      currency.symbol.toLowerCase().includes(searchLower)
    )
  })

  const handleSelect = (currencyValue: string) => {
    onChange(currencyValue)
    setOpen(false)
    setSearchQuery('')
    // Clear error when user selects a currency
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
            "w-full justify-between h-[40px] rounded-lg",
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
            placeholder="Search currencies..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {filteredCurrencies.map((currency) => (
                <CommandItem
                  key={currency.value}
                  value={currency.value}
                  onSelect={() => handleSelect(currency.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {currency.label}
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
