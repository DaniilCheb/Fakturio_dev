'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  className?: string
  error?: string
  required?: boolean
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
  ...props 
}: InputProps) {
  const hasError = !!error

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full h-[40px] px-3 py-2 
            bg-[#F7F5F2] dark:bg-[#2a2a2a] border rounded-lg
            text-[14px] text-[#141414] dark:text-white placeholder-[#9e9e9e] dark:placeholder-[#666]
            transition-all duration-200
            focus:outline-none focus:ring-0
            disabled:bg-[#f0f0f0] dark:disabled:bg-[#333] disabled:text-[#9e9e9e]
            ${hasError 
              ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500' 
              : 'border-[#e0e0e0] dark:border-[#444] focus:border-[#141414] dark:focus:border-white'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {hasError && (
        <span className="text-red-500 dark:text-red-400 text-[12px] mt-[1px] m-0 block">
          {error || 'Required field'}
        </span>
      )}
    </div>
  )
}

