'use client'

import React from 'react'
import Input from '../Input'
import DatePicker from '../DatePicker'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { getCurrentDateISO, calculateDueDate } from '@/lib/utils/dateUtils'
import { cn } from '@/lib/utils'

interface InvoiceHeaderProps {
  invoiceNumber: string
  issuedOn: string
  dueDate: string
  onChange: (field: string, value: string) => void
  errors?: {
    invoice_number?: string
    issued_on?: string
    due_date?: string
  }
  onClearError?: (field: string) => void
}

const PAYMENT_TERMS_OPTIONS = [
  { value: '14 days', label: '14 days' },
  { value: '30 days', label: '30 days' },
  { value: '60 days', label: '60 days' },
  { value: '90 days', label: '90 days' },
  { value: 'On receipt', label: 'On receipt' }
]

export default function InvoiceHeader({
  invoiceNumber,
  issuedOn,
  dueDate,
  onChange,
  errors = {},
  onClearError
}: InvoiceHeaderProps) {

  const handleIssuedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIssuedDate = e.target.value
    onChange('issued_on', newIssuedDate)
    onClearError?.('issued_on')
    
    // Recalculate due date if payment terms are set
    if (dueDate && issuedOn) {
      const daysDiff = Math.ceil((new Date(dueDate).getTime() - new Date(issuedOn).getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 0) {
        const newDueDate = calculateDueDate(newIssuedDate, `${daysDiff} days`)
        onChange('due_date', newDueDate)
      }
    }
  }

  const handleInvoiceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('invoice_number', e.target.value)
    onClearError?.('invoice_number')
  }

  const handlePaymentTermsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const terms = e.target.value
    if (terms === 'On receipt') {
      onChange('due_date', issuedOn)
    } else {
      const calculatedDueDate = calculateDueDate(issuedOn, terms)
      onChange('due_date', calculatedDueDate)
    }
    onClearError?.('due_date')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* First Row: Invoice # and Issued on */}
      <div className="flex flex-row gap-4">
        <div className="flex-1">
          <Input
            label="Invoice #"
            value={invoiceNumber}
            onChange={handleInvoiceNumberChange}
            error={errors.invoice_number}
            required
            onErrorClear={() => onClearError?.('invoice_number')}
            fieldName="invoice_number"
          />
        </div>
        <div className="flex-1">
          <DatePicker
            label="Issued on"
            value={issuedOn || getCurrentDateISO()}
            onChange={handleIssuedDateChange}
            error={errors.issued_on}
            onErrorClear={() => onClearError?.('issued_on')}
            fieldName="issued_on"
          />
        </div>
      </div>

      {/* Second Row: Due */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex flex-col gap-1" data-field="due_date">
            <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Due
            </Label>
            <ShadcnSelect
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
              onValueChange={(value) => {
                const syntheticEvent = {
                  target: { value }
                } as React.ChangeEvent<HTMLSelectElement>
                handlePaymentTermsChange(syntheticEvent)
              }}
            >
              <SelectTrigger className={cn(
                "w-full",
                errors.due_date && "border-destructive focus:ring-destructive"
              )}>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
            {errors.due_date && (
              <p className="text-destructive text-[12px] mt-1">{errors.due_date}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

