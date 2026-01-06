'use client'

import React from 'react'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

// TODO: Add language context when available
// import { useLanguage } from '../context/LanguageContext'

export const currencies = [
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'SEK', label: 'SEK - Swedish Krona', symbol: 'kr' },
  { value: 'NOK', label: 'NOK - Norwegian Krone', symbol: 'kr' },
  { value: 'DKK', label: 'DKK - Danish Krone', symbol: 'kr' },
  { value: 'PLN', label: 'PLN - Polish Złoty', symbol: 'zł' },
  { value: 'CZK', label: 'CZK - Czech Koruna', symbol: 'Kč' },
]

interface CurrencyPickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  noLabel?: boolean
  onErrorClear?: () => void // Callback to clear error when user selects a currency
}

export default function CurrencyPicker({ label, value, onChange, error, required, noLabel = false, onErrorClear }: CurrencyPickerProps) {
  // TODO: Uncomment when language context is available
  // const { t } = useLanguage()
  const hasError = !!error

  const handleValueChange = (newValue: string) => {
    // Clear error when user selects a currency
    if (error && onErrorClear) {
      onErrorClear()
    }
    onChange(newValue)
  }

  const selectElement = (
    <ShadcnSelect
      value={value ? value : undefined}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={cn(
        "w-full",
        hasError && "border-destructive focus:ring-destructive"
      )}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
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

