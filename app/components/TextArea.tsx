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
  noLabel?: boolean
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
  maxLength,
  noLabel = false
}: TextAreaProps) {
  const textareaElement = (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full px-2 py-2 bg-design-surface-field border rounded-lg text-sm font-normal text-design-content-default focus:outline-none focus:border-design-content-default transition-all duration-200 resize-none ${
        error 
          ? 'border-red-500 dark:border-red-500' 
          : 'border-design-border-default'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    />
  )

  if (noLabel) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {textareaElement}
        <div className="flex justify-between items-center">
          {error && (
            <p className="text-[12px] text-red-500">{error}</p>
          )}
          {maxLength && (
            <p className="text-[11px] text-design-content-weak ml-auto">
              {value?.length || 0}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="font-medium text-[13px] text-design-content-weakest tracking-[-0.208px]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {textareaElement}
      <div className="flex justify-between items-center">
        {error && (
          <p className="text-[12px] text-red-500">{error}</p>
        )}
        {maxLength && (
          <p className="text-[11px] text-design-content-weak ml-auto">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

