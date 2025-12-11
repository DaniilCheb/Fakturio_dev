'use client'

import React from 'react'
import Input from '../Input'
import Select from '../Select'
import CurrencyPicker from '../CurrencyPicker'
import { formatDateISO, getCurrentDateISO, calculateDueDate, parsePaymentTerms } from '@/lib/utils/dateUtils'

interface InvoiceHeaderProps {
  invoiceNumber: string
  issuedOn: string
  dueDate: string
  currency: string
  paymentMethod: 'Bank' | 'Card' | 'Cash' | 'Other'
  onChange: (field: string, value: string) => void
  errors?: {
    invoice_number?: string
    issued_on?: string
    due_date?: string
    currency?: string
    payment_method?: string
  }
}

const PAYMENT_TERMS_OPTIONS = [
  { value: '14 days', label: '14 days' },
  { value: '30 days', label: '30 days' },
  { value: '60 days', label: '60 days' },
  { value: '90 days', label: '90 days' },
  { value: 'On receipt', label: 'On receipt' }
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'Bank', label: 'Bank' },
  { value: 'Card', label: 'Card' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Other', label: 'Other' }
]

export default function InvoiceHeader({
  invoiceNumber,
  issuedOn,
  dueDate,
  currency,
  paymentMethod,
  onChange,
  errors = {}
}: InvoiceHeaderProps) {
  const handlePaymentTermsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const terms = e.target.value
    if (terms === 'On receipt') {
      onChange('due_date', issuedOn)
    } else {
      const calculatedDueDate = calculateDueDate(issuedOn, terms)
      onChange('due_date', calculatedDueDate)
    }
  }

  const handleIssuedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIssuedDate = e.target.value
    onChange('issued_on', newIssuedDate)
    
    // Recalculate due date if payment terms are set
    if (dueDate && issuedOn) {
      const daysDiff = Math.ceil((new Date(dueDate).getTime() - new Date(issuedOn).getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 0) {
        const newDueDate = calculateDueDate(newIssuedDate, `${daysDiff} days`)
        onChange('due_date', newDueDate)
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* First Row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Invoice #"
            value={invoiceNumber}
            onChange={(e) => onChange('invoice_number', e.target.value)}
            error={errors.invoice_number}
            required
          />
        </div>
        <div className="flex-1">
          <Input
            label="Issued on"
            type="date"
            value={issuedOn || getCurrentDateISO()}
            onChange={handleIssuedDateChange}
            error={errors.issued_on}
            required
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Due
            </label>
            <select
              value={dueDate ? (() => {
                if (!issuedOn) return '14 days'
                const days = Math.ceil((new Date(dueDate).getTime() - new Date(issuedOn).getTime()) / (1000 * 60 * 60 * 24))
                if (days <= 0) return 'On receipt'
                const matchingOption = PAYMENT_TERMS_OPTIONS.find(opt => {
                  if (opt.value === 'On receipt') return days <= 0
                  const optDays = parseInt(opt.value)
                  return optDays === days
                })
                return matchingOption ? matchingOption.value : '14 days'
              })() : '14 days'}
              onChange={handlePaymentTermsChange}
              className={`w-full px-2 py-2 bg-[#f7f5f3] dark:bg-[#2a2a2a] border rounded-lg text-[16px] text-[#141414] dark:text-white focus:outline-none focus:border-[#141414] dark:focus:border-white transition-all duration-200 appearance-none cursor-pointer ${
                errors.due_date 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-[#e0e0e0] dark:border-[#444]'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10L12 15L17 10H7Z' fill='%23666'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center'
              }}
            >
              {PAYMENT_TERMS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.due_date && (
              <p className="text-[12px] text-red-500 mt-1">{errors.due_date}</p>
            )}
          </div>
        </div>
        <div className="flex-1">
          <CurrencyPicker
            label="Currency"
            value={currency}
            onChange={(value) => onChange('currency', value)}
            error={errors.currency}
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
          Payment method
        </label>
        <div className="flex gap-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('payment_method', option.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-[16px] font-medium transition-all duration-200 ${
                paymentMethod === option.value
                  ? 'bg-[#141414] dark:bg-white text-white dark:text-[#141414]'
                  : 'bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] text-[#141414] dark:text-white hover:border-[#d0d0d0] dark:hover:border-[#555]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.payment_method && (
          <p className="text-[12px] text-red-500 mt-1">{errors.payment_method}</p>
        )}
      </div>
    </div>
  )
}

