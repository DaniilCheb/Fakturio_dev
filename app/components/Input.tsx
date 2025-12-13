'use client'

import React from 'react'
import { Input as ShadcnInput } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  className?: string
  error?: string
  required?: boolean
  noLabel?: boolean // When true, renders just the input without label wrapper
  onErrorClear?: () => void // Callback to clear error when user types
  fieldName?: string // Used for scroll-to-error functionality
}

export default function Input({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  className = "", 
  error, 
  required,
  noLabel = false,
  onErrorClear,
  fieldName,
  ...props 
}: InputProps) {
  const hasError = !!error
  const dataFieldAttr = fieldName ? { 'data-field': fieldName } : {}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear error when user starts typing
    if (error && onErrorClear) {
      onErrorClear()
    }
    onChange(e)
  }

  const inputElement = (
    <ShadcnInput
      type={type}
      value={value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn(
        "h-auto px-2 py-2 text-[15px]",
        hasError && "border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  )

  // If noLabel is true, return input with optional error message below
  if (noLabel) {
    return (
      <div className="flex flex-col gap-1 w-full" {...dataFieldAttr}>
        {inputElement}
        {hasError && (
          <span className="text-destructive text-[12px] mt-[1px] m-0 block">
            {error || 'Required field'}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 w-full" {...dataFieldAttr}>
      {label && (
        <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
          {label}
        </Label>
      )}
      <div className="relative w-full">
        {inputElement}
      </div>
      {hasError && (
        <span className="text-destructive text-[12px] mt-[1px] m-0 block">
          {error || 'Required field'}
        </span>
      )}
    </div>
  )
}

