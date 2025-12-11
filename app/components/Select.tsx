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

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
  noLabel?: boolean // When true, renders just the select without label wrapper
}

/**
 * Standardized select dropdown component using shadcn
 * 
 * Usage:
 * <Select
 *   label="Customer"
 *   value={selectedId}
 *   onChange={(e) => setSelectedId(e.target.value)}
 *   options={[
 *     { value: '', label: 'Select a customer' },
 *     { value: '1', label: 'Customer A' },
 *   ]}
 * />
 */
export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  disabled = false,
  className = '',
  error,
  noLabel = false
}: SelectProps) {
  const handleValueChange = (newValue: string) => {
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLSelectElement>
    onChange(syntheticEvent)
  }

  const selectElement = (
    <>
      <ShadcnSelect
        value={value || undefined}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={cn(
          "w-full",
          error && "border-destructive focus:ring-destructive"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {placeholder && !value && (
            <SelectItem value="" disabled>
              {placeholder}
            </SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
      {error && (
        <p className="text-destructive text-[12px] mt-1">{error}</p>
      )}
    </>
  )

  // If noLabel is true, return select with optional error message below
  if (noLabel) {
    return (
      <div className={cn("flex flex-col gap-1 w-full", className)}>
        {selectElement}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <Label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {selectElement}
    </div>
  )
}

