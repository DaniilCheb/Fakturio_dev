'use client'

import React from 'react'
import Select from 'react-select'

// TODO: Add language context when available
// import { useLanguage } from '../context/LanguageContext'

const currencies = [
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'SEK', label: 'SEK - Swedish Krona', symbol: 'kr' },
  { value: 'NOK', label: 'NOK - Norwegian Krone', symbol: 'kr' },
  { value: 'DKK', label: 'DKK - Danish Krone', symbol: 'kr' },
]

const customStyles = {
  control: (provided: any) => ({
    ...provided,
    backgroundColor: '#f7f5f3',
    minHeight: 'auto',
    height: 'auto',
    fontSize: '16px',
    fontWeight: 400,
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: 'none',
    padding: '8px 12px',
    '&:hover': {
      borderColor: '#b0b0b0',
    },
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    height: 'auto',
    padding: '0',
  }),
  input: (provided: any) => ({
    ...provided,
    margin: '0px',
    padding: '0px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: 'auto',
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: '8px',
    color: '#9e9e9e',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: '14px',
    color: state.isSelected ? 'white' : '#141414',
    backgroundColor: state.isSelected ? '#141414' : state.isFocused ? '#f5f5f5' : 'white',
    borderRadius: '6px',
    padding: '8px 12px',
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontSize: '14px',
    fontWeight: 400,
    color: '#141414',
  }),
  menu: (provided: any) => ({
    ...provided,
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    marginTop: '4px',
    padding: '4px',
    backgroundColor: 'white',
  }),
}

interface CurrencyPickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  noLabel?: boolean
}

export default function CurrencyPicker({ label, value, onChange, error, required, noLabel = false }: CurrencyPickerProps) {
  // TODO: Uncomment when language context is available
  // const { t } = useLanguage()
  const selectedOption = currencies.find(c => c.value === value) || currencies[0]
  const hasError = !!error

  // Update styles to include error state
  const errorStyles = {
    ...customStyles,
    control: (provided: any, state: any) => ({
      ...customStyles.control(provided, state),
      borderColor: hasError ? '#ef4444' : '#e0e0e0',
      '&:hover': {
        borderColor: hasError ? '#ef4444' : '#b0b0b0',
      },
    }),
  }

  const selectElement = (
    <Select
      value={selectedOption}
      onChange={(option) => onChange(option!.value)}
      options={currencies}
      styles={errorStyles}
      classNamePrefix="currency-select"
      className="w-full"
      isSearchable={true}
    />
  )

  if (noLabel) {
    return (
      <div className="flex flex-col gap-1 w-full">
        {selectElement}
        {hasError && (
          <span className="text-red-500 dark:text-red-400 text-[12px] mt-[1px] m-0 block">
            {error || 'Required field'}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="font-medium text-[13px] text-[#474743] dark:text-[#999]">
          {label}
        </label>
      )}
      {selectElement}
      {hasError && (
        <span className="text-red-500 dark:text-red-400 text-[12px] mt-[1px] m-0 block">
          {error || 'Required field'}
        </span>
      )}
    </div>
  )
}

export { currencies }

