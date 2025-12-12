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
  ...props 
}: InputProps) {
  const hasError = !!error

  const inputElement = (
    <ShadcnInput
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        "h-auto px-2 py-2 text-sm",
        hasError && "border-destructive focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  )

  // If noLabel is true, return input with optional error message below
  if (noLabel) {
    return (
      <div className="flex flex-col gap-1 w-full">
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
    <div className="flex flex-col gap-1 w-full">
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

