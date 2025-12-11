'use client'

import React, { useState, useEffect, useRef } from 'react'

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find(opt => {
    const optValue = typeof opt === 'string' ? opt : opt.value
    return optValue === value
  })
  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="font-medium text-[13px] text-[#7A7A78] dark:text-[#999]">
          {label}
        </label>
      )}
      
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-[40px] px-3 py-2 bg-white dark:bg-[#2a2a2a] border border-[#E5E2DB] dark:border-[#444] rounded-lg flex items-center justify-between hover:border-[#D4D1CA] dark:hover:border-[#555] transition-colors focus:outline-none focus:ring-1 focus:ring-[#E07B5D] focus:border-[#E07B5D]"
        >
          <span className={`text-[14px] ${value ? 'text-[#3D3D3D] dark:text-white' : 'text-[#9E9E9C] dark:text-[#666]'}`}>
            {displayValue}
          </span>
          <ChevronDownIcon />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2a2a2a] border border-[#E5E2DB] dark:border-[#444] rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto py-1">
            {options.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value
              const optionLabel = typeof option === 'string' ? option : option.label
              const isSelected = value === optionValue
              
              return (
                <button
                  key={optionValue || index}
                  type="button"
                  onClick={() => handleSelect(optionValue)}
                  className={`w-full text-left px-3 py-2 text-[14px] hover:bg-[#F5F3EE] dark:hover:bg-[#333] transition-colors text-[#3D3D3D] dark:text-white ${
                    isSelected ? 'bg-[#F5F3EE] dark:bg-[#333] font-medium' : ''
                  }`}
                >
                  {optionLabel}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

