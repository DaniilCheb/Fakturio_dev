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

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: (string | DropdownOption)[]
  placeholder?: string
}

export default function Dropdown({ label, value, onChange, options, placeholder = 'Select...' }: DropdownProps) {
  // Normalize options to always have value and label
  const normalizedOptions: DropdownOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <Label className="font-medium text-[13px] text-[#7A7A78] dark:text-[#999]">
          {label}
        </Label>
      )}
      <ShadcnSelect
        value={value || undefined}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full h-[40px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    </div>
  )
}

