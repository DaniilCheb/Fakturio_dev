'use client'

import React from 'react'

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
}

/**
 * Standardized select dropdown component
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
  error
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-[#F7F5F2] dark:bg-[#2a2a2a] border rounded-lg text-[14px] text-[#141414] dark:text-white focus:outline-none focus:border-[#141414] dark:focus:border-white transition-all duration-200 appearance-none cursor-pointer ${
          error 
            ? 'border-red-500 dark:border-red-500' 
            : 'border-[#e0e0e0] dark:border-[#444]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10L12 15L17 10H7Z' fill='%23666'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center'
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}
    </div>
  )
}

