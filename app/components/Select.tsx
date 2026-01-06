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
  onErrorClear?: () => void // Callback to clear error when user selects an option
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
  noLabel = false,
  onErrorClear
}: SelectProps) {
  const handleValueChange = (newValue: string) => {
    // Clear error when user selects an option
    if (error && onErrorClear) {
      onErrorClear()
    }
    // Create a synthetic event to match the expected onChange signature
    const syntheticEvent = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLSelectElement>
    onChange(syntheticEvent)
  }

  const selectElement = (
    <>
      <ShadcnSelect
        value={value ? value : undefined}
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
          {options.map((option) => {
            // Filter out options with empty string values - Radix UI doesn't allow them
            if (option.value === '') {
              return null
            }
            return (
              <SelectItem key={option.value} value={option.value} disabled={option.value.startsWith('__disabled_')}>
                {option.label}
              </SelectItem>
            )
          })}
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
        <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {selectElement}
    </div>
  )
}

