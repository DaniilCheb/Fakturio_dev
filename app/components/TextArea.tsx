'use client'

import React from 'react'

interface TextAreaProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
  maxLength?: number
}

/**
 * Standardized textarea component
 * 
 * Usage:
 * <TextArea
 *   label="Description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   rows={4}
 *   placeholder="Enter description..."
 * />
 */
export default function TextArea({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3,
  required = false,
  disabled = false,
  className = '',
  error,
  maxLength
}: TextAreaProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-3 py-2 bg-[#F7F5F2] dark:bg-[#2a2a2a] border rounded-lg text-[14px] text-[#141414] dark:text-white placeholder-[#9e9e9e] dark:placeholder-[#666] focus:outline-none focus:border-[#141414] dark:focus:border-white transition-all duration-200 resize-none ${
          error 
            ? 'border-red-500 dark:border-red-500' 
            : 'border-[#e0e0e0] dark:border-[#444]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      <div className="flex justify-between items-center">
        {error && (
          <p className="text-[12px] text-red-500">{error}</p>
        )}
        {maxLength && (
          <p className="text-[11px] text-[#999] dark:text-[#666] ml-auto">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

