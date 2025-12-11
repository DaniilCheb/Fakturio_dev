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
import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group'
import CurrencyPicker from '../CurrencyPicker'
import { formatDateISO, getCurrentDateISO, calculateDueDate, parsePaymentTerms } from '@/lib/utils/dateUtils'
import { cn } from '@/lib/utils'

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
      {/* First Row: Invoice # */}
      <div>
        <Input
          label="Invoice #"
          value={invoiceNumber}
          onChange={(e) => onChange('invoice_number', e.target.value)}
          error={errors.invoice_number}
          required
        />
      </div>

      {/* Second Row: Issued on and Due */}
      <div className="flex gap-4">
        <div className="flex-1">
          <DatePicker
            label="Issued on"
            value={issuedOn || getCurrentDateISO()}
            onChange={handleIssuedDateChange}
            error={errors.issued_on}
            required
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-1">
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

      {/* Third Row: Currency and Payment Method */}
      <div className="flex gap-4">
        <div className="flex-1">
          <CurrencyPicker
            label="Currency"
            value={currency}
            onChange={(value) => onChange('currency', value)}
            error={errors.currency}
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Payment method
            </Label>
            <ToggleGroup
              type="single"
              value={paymentMethod}
              onValueChange={(value) => {
                if (value) onChange('payment_method', value)
              }}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-md border border-input bg-muted p-1 text-muted-foreground",
                "w-full",
                errors.payment_method && "border-destructive"
              )}
            >
              {PAYMENT_METHOD_OPTIONS.map((option, index) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex-1 h-full px-3 text-[16px] md:text-sm font-normal transition-all border",
                    // Override default toggle styles for selected state
                    "data-[state=on]:!bg-white dark:data-[state=on]:!bg-design-surface-default",
                    "data-[state=on]:!text-design-content-default",
                    "data-[state=on]:!border-design-border-default",
                    "data-[state=on]:shadow-sm",
                    // Selected items always have rounded corners
                    "data-[state=on]:rounded-md",
                    // Unselected state: transparent border to prevent layout shift, muted text
                    "data-[state=off]:border-transparent data-[state=off]:bg-transparent",
                    "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/50",
                    // Unselected items: rounded edges based on position
                    "data-[state=off]:rounded-none",
                    index === 0 && "data-[state=off]:rounded-l-md",
                    index === PAYMENT_METHOD_OPTIONS.length - 1 && "data-[state=off]:rounded-r-md"
                  )}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {errors.payment_method && (
              <p className="text-destructive text-[12px] mt-1">{errors.payment_method}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

